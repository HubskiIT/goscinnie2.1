/**
 * Publiczny profil firmy pod /f/<slug>.
 *
 * Cztery statusy, trzy różne zachowania. Najważniejszy jest ten czwarty:
 * profil zawieszony ma zwracać prawdziwe 404, a nie pustą stronę z nagłówkiem.
 * Strona zwracająca 200 z pustą treścią zostanie zaindeksowana i zostanie
 * w wynikach wyszukiwania długo po zawieszeniu.
 *
 * Drugi pod względem wagi jest stan pusty. Profil importowany, bez opisu
 * i bez ceny, to stan domyślny sześciuset profili, nie przypadek brzegowy.
 *
 * Testy pracują na firmach z zasiewu.
 */
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { pobierzProfilFirmy } from "@/lib/db/queries/firmy";
import { companies, companyMembers } from "@/lib/db/schema/katalog";
import {
  NiezaimplementowanaGalazUprawnien,
  type StatusProfilu,
  type Widz,
  widocznoscProfilu,
} from "@/lib/permissions";

const ANONIM: Widz = { rodzaj: "anonim" };

const KOMPLETNY = "firma-1";
const IMPORTOWANY = "firma-8";
const ZAWIESZONY = "firma-9";
const WIZYTOWKA = "firma-10";

function kontekst(status: StatusProfilu, czlonek = false) {
  return { status, czlonekTejFirmy: czlonek };
}

describe("cztery statusy, trzy zachowania", () => {
  it("draft jest widoczny i zaprasza do przejęcia", () => {
    const widocznosc = widocznoscProfilu(ANONIM, kontekst("draft"));
    expect(widocznosc.widoczny).toBe(true);
    expect(widocznosc.wezwanieDoPrzejecia).toBe(true);
    expect(widocznosc.kalendarz).toBe(false);
  });

  it("active jest widoczny w pełni, z kalendarzem", () => {
    const widocznosc = widocznoscProfilu(ANONIM, kontekst("active"));
    expect(widocznosc.widoczny).toBe(true);
    expect(widocznosc.kalendarz).toBe(true);
    expect(widocznosc.wezwanieDoPrzejecia).toBe(false);
  });

  it("visitcard jest widoczny, ale bez kalendarza", () => {
    // Po wygaśnięciu abonamentu profil nie znika, schodzi do wizytówki.
    const widocznosc = widocznoscProfilu(ANONIM, kontekst("visitcard"));
    expect(widocznosc.widoczny).toBe(true);
    expect(widocznosc.kalendarz).toBe(false);
  });

  it("suspended jest niewidoczny", () => {
    expect(widocznoscProfilu(ANONIM, kontekst("suspended")).widoczny).toBe(false);
  });

  it("żaden status nie odsłania danych kontaktowych firmy", () => {
    // Kontakt idzie przez formularz zapytania, a tego jeszcze nie ma.
    for (const status of ["draft", "active", "visitcard", "suspended"] as const) {
      expect(widocznoscProfilu(ANONIM, kontekst(status)).daneKontaktowe).toBe(false);
    }
  });

  it("członkowi tej firmy nie proponujemy przejęcia jej własnego profilu", () => {
    expect(widocznoscProfilu(ANONIM, kontekst("draft", true)).wezwanieDoPrzejecia).toBe(false);
  });

  it("gałąź bez implementacji rzuca także tutaj", () => {
    const moderator: Widz = { rodzaj: "moderator", userId: "u5" };
    expect(() => widocznoscProfilu(moderator, kontekst("active"))).toThrow(
      NiezaimplementowanaGalazUprawnien,
    );
  });
});

describe("zapytanie o profil", () => {
  it("profil kompletny zwraca komplet danych", async () => {
    const profil = await pobierzProfilFirmy(ANONIM, KOMPLETNY);

    expect(profil).not.toBeNull();
    expect(profil?.nazwa).toBeTruthy();
    expect(profil?.miasto).toBeTruthy();
    expect(profil?.opis.length).toBeGreaterThan(20);
    expect(profil?.cenaOd).not.toBeNull();
    expect(profil?.kategorie.length).toBeGreaterThan(0);
  });

  it("profil kompletny ma wolne terminy w kalendarzu", async () => {
    const profil = await pobierzProfilFirmy(ANONIM, KOMPLETNY);
    expect(profil?.wolneTerminy.length).toBeGreaterThan(0);
  });

  it("wszystkie terminy w kalendarzu są przyszłe", async () => {
    // Kalendarz z terminem sprzed miesiąca wygląda na zepsuty, nie na pusty.
    const profil = await pobierzProfilFirmy(ANONIM, KOMPLETNY);
    const dzisiaj = new Date().toISOString().slice(0, 10);
    for (const dzien of profil?.wolneTerminy ?? []) {
      expect(dzien >= dzisiaj).toBe(true);
    }
  });

  it("profil zawieszony zwraca null, czyli 404", async () => {
    expect(await pobierzProfilFirmy(ANONIM, ZAWIESZONY)).toBeNull();
  });

  it("profil nieistniejący zwraca null tak samo jak zawieszony", async () => {
    // Jedno i drugie jest dla świata tym samym. Rozróżnienie mówiłoby,
    // że firma o tym slugu istnieje, tylko została zawieszona.
    expect(await pobierzProfilFirmy(ANONIM, "nie-ma-takiej-firmy-xyz")).toBeNull();
  });

  it("wizytówka nie pobiera kalendarza wcale", async () => {
    // Nie pobieramy i nie ukrywamy w komponencie. Czego nie pobrano,
    // tego nie da się zgubić.
    const profil = await pobierzProfilFirmy(ANONIM, WIZYTOWKA);
    expect(profil).not.toBeNull();
    expect(profil?.widocznosc.kalendarz).toBe(false);
    expect(profil?.wolneTerminy).toEqual([]);
  });

  it("zalogowany obcy widzi dokładnie to samo co anonim", async () => {
    const klient: Widz = { rodzaj: "klient", userId: "00000000-0000-4000-8000-000000000001" };
    const dlaAnonima = await pobierzProfilFirmy(ANONIM, KOMPLETNY);
    const dlaKlienta = await pobierzProfilFirmy(klient, KOMPLETNY);
    expect(dlaKlienta).toEqual(dlaAnonima);
  });

  it("członek firmy nie widzi wezwania do przejęcia własnego profilu", async () => {
    const [firma] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, IMPORTOWANY))
      .limit(1);
    if (!firma) throw new Error("Zasiew nie ma profilu importowanego.");

    const obcy = await pobierzProfilFirmy(ANONIM, IMPORTOWANY);
    expect(obcy?.widocznosc.wezwanieDoPrzejecia).toBe(true);

    const czlonek: Widz = {
      rodzaj: "firma",
      userId: "u1",
      companyId: firma.id,
      abonament: false,
    };
    const wlasny = await pobierzProfilFirmy(czlonek, IMPORTOWANY);
    expect(wlasny?.widocznosc.wezwanieDoPrzejecia).toBe(false);
  });
});

/**
 * Stan pusty jako ścieżka główna, nie przypadek brzegowy.
 *
 * Tak wygląda profil, który zobaczy pierwszy prawdziwy właściciel sali, gdy
 * usłyszy „twój profil już istnieje, przejmij go za darmo”.
 */
describe("profil importowany, bez opisu i bez ceny", () => {
  it("istnieje i jest publicznie widoczny", async () => {
    const profil = await pobierzProfilFirmy(ANONIM, IMPORTOWANY);
    expect(profil).not.toBeNull();
    expect(profil?.status).toBe("draft");
  });

  it("nie ma opisu ani ceny, i to jest poprawny stan", async () => {
    const profil = await pobierzProfilFirmy(ANONIM, IMPORTOWANY);
    expect(profil?.opis).toBe("");
    expect(profil?.cenaOd).toBeNull();
  });

  it("ma to, czym da się go rozpoznać: nazwę, miasto i kategorię", async () => {
    // Bez tego profil nie nadaje się do rozmowy sprzedażowej: właściciel musi
    // od razu poznać, że to o jego firmie.
    const profil = await pobierzProfilFirmy(ANONIM, IMPORTOWANY);
    expect(profil?.nazwa).toBeTruthy();
    expect(profil?.miasto).toBeTruthy();
    expect(profil?.kategorie.length).toBeGreaterThan(0);
  });

  it("zaprasza do przejęcia", async () => {
    const profil = await pobierzProfilFirmy(ANONIM, IMPORTOWANY);
    expect(profil?.widocznosc.wezwanieDoPrzejecia).toBe(true);
  });

  it("instancja pozytywna: w bazie istnieje profil Z opisem i ceną", async () => {
    // Bez tego „importowany nie ma opisu” byłoby prawdą także wtedy, gdyby
    // opisu nie miał nikt, a zapytanie w ogóle go nie pobierało.
    const kompletny = await pobierzProfilFirmy(ANONIM, KOMPLETNY);
    expect(kompletny?.opis.length).toBeGreaterThan(20);
    expect(kompletny?.cenaOd).not.toBeNull();
  });
});

describe("zasiew pokrywa wszystkie cztery statusy", () => {
  it("każdy status ma w bazie co najmniej jeden profil", async () => {
    const wiersze = await db.select({ status: companies.status }).from(companies);
    const obecne = new Set(wiersze.map((w) => w.status));

    for (const status of ["draft", "active", "visitcard", "suspended"]) {
      expect(obecne.has(status as StatusProfilu)).toBe(true);
    }
  });

  it("profil importowany ma właściciela w companies, ale nikogo w company_members", async () => {
    // Tak wygląda profil nieodebrany: kolumna ownerUserId istnieje od importu,
    // ale nikt się jeszcze nie zalogował i nie potwierdził, że to jego firma.
    const [firma] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, IMPORTOWANY))
      .limit(1);
    if (!firma) throw new Error("Brak profilu importowanego.");

    const czlonkowie = await db
      .select({ id: companyMembers.id })
      .from(companyMembers)
      .where(eq(companyMembers.companyId, firma.id));

    expect(czlonkowie).toHaveLength(0);
  });
});

/**
 * Ściana abonamentowa: co widzi firma z abonamentem, a co bez.
 *
 * Tu stoi cały model przychodowy. Jeśli firma bez abonamentu zobaczy cały opis
 * albo budżet, abonament przestaje być do czegokolwiek potrzebny.
 *
 * Testy korzystają z firm **z zasiewu**, nie tworzą własnych. Zasiewu używamy
 * przy każdej pracy ręcznej, więc test, który buduje stan własną ścieżką, jest
 * ślepy na błędy zasiewu. Tak się wcześniej wydało, że konta zasiewowe w ogóle
 * nie dawały się zalogować.
 *
 * Wymagają bazy z danymi: pnpm db:reset.
 */
import { and, eq, sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { GET as pobierzListe } from "@/app/api/zlecenia/route";
import { auth } from "@/lib/auth";
import { czlonkostwoUzytkownika, maAktywnyAbonament } from "@/lib/auth/firma";
import { db } from "@/lib/db";
import { pobierzListeDlaWidza } from "@/lib/db/queries/requests";
import { subscriptions } from "@/lib/db/schema/abonament";
import { requests } from "@/lib/db/schema/gielda";
import { companies, companyMembers } from "@/lib/db/schema/katalog";
import { rateLimits } from "@/lib/db/schema/sesje";
import { users } from "@/lib/db/schema/tozsamosc";
import { type Widz, widocznoscZlecenia, ZAJAWKA_OPISU_ZNAKOW } from "@/lib/permissions";

/** Opis wyraźnie dłuższy niż zajawka, żeby obcięcie było widoczne. */
const OPIS_DLUGI =
  "Zaczynamy o piętnastej w ogrodzie za stodołą, dojazd od strony sadu, prąd ciągniemy " +
  "z garażu, a o dwudziestej przenosimy wszystkich pod zadaszenie, bo prognoza jest kiepska.";

/** Fragment, który leży poza pierwszymi 120 znakami. Nie ma prawa wyciec. */
const FRAGMENT_ZA_ZAJAWKA = "przenosimy wszystkich pod zadaszenie";

type Firma = { companyId: string; userId: string };

async function firmaPoSlugu(slug: string): Promise<Firma> {
  const [wiersz] = await db
    .select({ companyId: companies.id, userId: companyMembers.userId })
    .from(companies)
    .innerJoin(companyMembers, eq(companyMembers.companyId, companies.id))
    .where(eq(companies.slug, slug))
    .limit(1);

  if (!wiersz) throw new Error(`Zasiew nie ma firmy o slugu ${slug} z członkiem.`);
  return wiersz;
}

function widzFirmy(firma: Firma, abonament: boolean): Widz {
  return { rodzaj: "firma", userId: firma.userId, companyId: firma.companyId, abonament };
}

let zAbonamentem: Firma;
let wygasla: Firma;
let odwolana: Firma;
let bezAbonamentu: Firma;

beforeAll(async () => {
  zAbonamentem = await firmaPoSlugu("firma-1");
  wygasla = await firmaPoSlugu("firma-2");
  odwolana = await firmaPoSlugu("firma-3");
  bezAbonamentu = await firmaPoSlugu("firma-4");

  // Wydłużamy opis w każdym otwartym zleceniu, żeby zajawka miała co obcinać.
  await db.update(requests).set({ description: OPIS_DLUGI }).where(eq(requests.status, "open"));
});

describe("stan abonamentu liczony datą przy każdym żądaniu", () => {
  it("firma z aktywnym abonamentem i datą w przyszłości: aktywny", async () => {
    expect(await maAktywnyAbonament(zAbonamentem.companyId)).toBe(true);
  });

  it("status active, ale data minęła: nieaktywny", async () => {
    // To jest prawdziwy kształt wygaśnięcia. Statusu nikt nie przestawia
    // w momencie, w którym mija data.
    expect(await maAktywnyAbonament(wygasla.companyId)).toBe(false);
  });

  it("data w przyszłości, ale status cancelled: nieaktywny", async () => {
    // Drugi warunek, sprawdzany osobno. Bez tego przypadku nie dałoby się
    // odróżnić kodu patrzącego tylko na datę od kodu patrzącego na oba warunki.
    expect(await maAktywnyAbonament(odwolana.companyId)).toBe(false);
  });

  it("brak jakiegokolwiek abonamentu: nieaktywny", async () => {
    expect(await maAktywnyAbonament(bezAbonamentu.companyId)).toBe(false);
  });
});

/** Przypadek 3 z docs/uprawnienia.md. */
describe("przypadek 3: firma bez subskrypcji widzi najwyżej 120 znaków opisu", () => {
  it("reguła mówi: zajawka o długości 120 znaków", () => {
    const widocznosc = widocznoscZlecenia(widzFirmy(bezAbonamentu, false));
    expect(widocznosc.opis).toEqual({ rodzaj: "zajawka", znakow: ZAJAWKA_OPISU_ZNAKOW });
    expect(widocznosc.budzet).toBe(false);
  });

  it("zapytanie zwraca dokładnie 120 znaków, nie więcej", async () => {
    const wynik = await pobierzListeDlaWidza(widzFirmy(bezAbonamentu, false), {
      limit: 5,
      offset: 0,
    });

    expect(wynik.zakres).toBe("zajawka");
    if (wynik.zakres !== "zajawka") return;

    expect(wynik.zlecenia.length).toBeGreaterThan(0);
    for (const zlecenie of wynik.zlecenia) {
      expect(zlecenie.opisZajawka.length).toBeLessThanOrEqual(ZAJAWKA_OPISU_ZNAKOW);
      expect(zlecenie.opisZajawka).toBe(OPIS_DLUGI.slice(0, ZAJAWKA_OPISU_ZNAKOW));
    }
  });

  it("odpowiedź API nie zawiera dalszej części opisu ani budżetu", async () => {
    const odpowiedz = await pobierzListe(
      new Request("http://localhost:3000/api/zlecenia?limit=50"),
    );
    // Żądanie bez sesji, więc widz jest anonimem: tym bardziej nie ma opisu.
    const tekst = await odpowiedz.text();
    expect(tekst).not.toContain(FRAGMENT_ZA_ZAJAWKA);
    expect(tekst).not.toContain("budzet");
  });

  it("firma bez abonamentu nie dostaje pełnej listy nawet przez zapytanie pełne", async () => {
    const wynik = await pobierzListeDlaWidza(widzFirmy(bezAbonamentu, false), {
      limit: 50,
      offset: 0,
    });

    if (wynik.zakres !== "zajawka") throw new Error("Zakres inny niż zajawka.");
    const cala = JSON.stringify(wynik.zlecenia);
    expect(cala).not.toContain(FRAGMENT_ZA_ZAJAWKA);
    expect(cala).not.toContain("budzetMin");
  });
});

describe("firma z abonamentem dostaje pełny opis i budżet", () => {
  it("zakres pełny, cały opis, widełki budżetu", async () => {
    const wynik = await pobierzListeDlaWidza(widzFirmy(zAbonamentem, true), {
      limit: 5,
      offset: 0,
    });

    expect(wynik.zakres).toBe("pelny");
    if (wynik.zakres !== "pelny") return;

    const pierwsze = wynik.zlecenia[0];
    expect(pierwsze).toBeDefined();
    expect(pierwsze?.opis).toBe(OPIS_DLUGI);
    expect(pierwsze).toHaveProperty("budzetMin");
    expect(pierwsze).toHaveProperty("budzetMax");
  });

  it("widzi promień wokół powiatu, nie dokładną lokalizację", () => {
    expect(widocznoscZlecenia(widzFirmy(zAbonamentem, true)).lokalizacja).toBe("powiat-i-promien");
  });
});

/** Przypadek 5 z docs/uprawnienia.md. */
describe("przypadek 5: firma nie widzi liczby ofert", () => {
  it("ani z abonamentem, ani bez", () => {
    expect(widocznoscZlecenia(widzFirmy(zAbonamentem, true)).liczbaOfert).toBe(false);
    expect(widocznoscZlecenia(widzFirmy(bezAbonamentu, false)).liczbaOfert).toBe(false);
  });

  it("pole z liczbą ofert nie pojawia się w żadnej odpowiedzi dla firmy", async () => {
    for (const [firma, abonament] of [
      [zAbonamentem, true],
      [bezAbonamentu, false],
    ] as const) {
      const wynik = await pobierzListeDlaWidza(widzFirmy(firma, abonament), {
        limit: 5,
        offset: 0,
      });
      for (const zlecenie of wynik.zlecenia) {
        expect(Object.keys(zlecenie)).not.toContain("liczbaOfert");
      }
    }
  });

  it("firma nie widzi też cen konkurencji", () => {
    expect(widocznoscZlecenia(widzFirmy(zAbonamentem, true)).cenyKonkurencji).toBe(false);
  });
});

/** Przypadek 9 z docs/uprawnienia.md. */
describe("przypadek 9: wygaśnięcie natychmiast przywraca ograniczenia", () => {
  it("ta sama firma przed i po przesunięciu daty dostaje inny zakres", async () => {
    // Przed: abonament aktywny, zakres pełny.
    const przed = await pobierzListeDlaWidza(
      widzFirmy(zAbonamentem, await maAktywnyAbonament(zAbonamentem.companyId)),
      { limit: 1, offset: 0 },
    );
    expect(przed.zakres).toBe("pelny");

    // Przesuwamy datę na wczoraj. Statusu nie ruszamy, bo w rzeczywistości
    // też nikt go nie rusza w chwili wygaśnięcia.
    const wczoraj = new Date();
    wczoraj.setDate(wczoraj.getDate() - 1);
    await db
      .update(subscriptions)
      .set({ expiresAt: wczoraj })
      .where(eq(subscriptions.companyId, zAbonamentem.companyId));

    try {
      // Po: bez żadnego zadania cyklicznego, bez restartu, bez czyszczenia cache.
      const aktywny = await maAktywnyAbonament(zAbonamentem.companyId);
      expect(aktywny).toBe(false);

      const po = await pobierzListeDlaWidza(widzFirmy(zAbonamentem, aktywny), {
        limit: 1,
        offset: 0,
      });
      expect(po.zakres).toBe("zajawka");
      expect(JSON.stringify(po.zlecenia)).not.toContain(FRAGMENT_ZA_ZAJAWKA);
    } finally {
      const zaRok = new Date();
      zaRok.setFullYear(zaRok.getFullYear() + 1);
      await db
        .update(subscriptions)
        .set({ expiresAt: zaRok })
        .where(
          and(
            eq(subscriptions.companyId, zAbonamentem.companyId),
            eq(subscriptions.status, "active"),
          ),
        );
    }
  });
});

/**
 * Ścieżka prawdziwa: od ciasteczka sesji do odpowiedzi API, przez
 * widzZZadania i czlonkostwoUzytkownika.
 *
 * Bez tego bloku testy budowały widza wprost i omijały wybór firmy. Właśnie tam
 * siedział błąd, przez który właściciel firmy z opłaconym abonamentem dostawał
 * zajawkę: wybierana była jego druga firma, ta bez abonamentu.
 */
describe("ścieżka przez sesję, nie przez ręcznie zbudowanego widza", () => {
  /**
   * Limity prób logowania są prawdziwe i obowiązują też testy. Konto z zasiewu
   * logujemy tu kilka razy, a licznik przeżywa kolejne uruchomienia zestawu,
   * więc bez tego zestaw zaczynał padać przy trzecim przebiegu z rzędu.
   *
   * Okno przesuwamy w przeszłość zamiast kasować wiersz. Tak wygląda wygaśnięcie
   * okna naprawdę i tak samo traktuje je kod produkcyjny, a zasada 5 i tak
   * zabrania kasowania.
   */
  async function przesunOknoLimitu(email: string): Promise<void> {
    const godzineTemu = new Date(Date.now() - 60 * 60 * 1000);
    await db
      .update(rateLimits)
      .set({ windowStart: godzineTemu })
      .where(eq(rateLimits.key, `logowanie:konto:${email.toLowerCase()}`));
  }

  async function zalogujIPobierz(email: string) {
    await przesunOknoLimitu(email);

    const logowanie = await auth.api.signInEmail({
      body: { email, password: "goscinnie-lokalnie-2026" },
      returnHeaders: true,
      // Własny adres na każde wywołanie, żeby wspólny licznik po IP nie zliczał
      // wszystkich testów w tym pliku do jednej puli.
      headers: new Headers({ "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200)}` }),
    });

    const ciasteczko = logowanie.headers.get("set-cookie");
    if (!ciasteczko) throw new Error(`Logowanie ${email} nie zwróciło ciasteczka.`);

    const odpowiedz = await pobierzListe(
      new Request("http://localhost:3000/api/zlecenia?limit=1", {
        headers: new Headers({ cookie: ciasteczko }),
      }),
    );

    return odpowiedz.json();
  }

  async function mailCzlonkaFirmy(slug: string): Promise<string> {
    const [wiersz] = await db
      .select({ email: users.email })
      .from(companies)
      .innerJoin(companyMembers, eq(companyMembers.companyId, companies.id))
      .innerJoin(users, eq(users.id, companyMembers.userId))
      .where(eq(companies.slug, slug))
      .limit(1);

    if (!wiersz) throw new Error(`Zasiew nie ma członka firmy ${slug}.`);
    return wiersz.email;
  }

  it("członek firmy z abonamentem dostaje pełny zakres, mimo drugiej firmy bez", async () => {
    // Ten człowiek jest właścicielem firmy bez abonamentu i zwykłym członkiem
    // firmy z abonamentem, a do tej pierwszej należy dłużej. Każde kryterium
    // poza abonamentem wskazuje firmę bez. Pełny zakres w odpowiedzi znaczy,
    // że pierwszeństwo firmy z aktywnym abonamentem działa.
    const dane = await zalogujIPobierz(await mailCzlonkaFirmy("firma-1"));
    expect(dane.zakres).toBe("pelny");
    expect(dane.zlecenia[0]).toHaveProperty("opis");
  });

  it("członek firmy bez aktywnego abonamentu dostaje zajawkę", async () => {
    const dane = await zalogujIPobierz(await mailCzlonkaFirmy("firma-2"));
    expect(dane.zakres).toBe("zajawka");
    expect(JSON.stringify(dane)).not.toContain(FRAGMENT_ZA_ZAJAWKA);
  });

  it("ten sam użytkownik pytany dwa razy dostaje ten sam zakres", async () => {
    // Wybór firmy musi być powtarzalny. Zakres skaczący między żądaniami
    // jest nie do odtworzenia ze zgłoszenia błędu.
    const email = await mailCzlonkaFirmy("firma-1");
    const pierwszy = await zalogujIPobierz(email);
    const drugi = await zalogujIPobierz(email);
    expect(pierwszy.zakres).toBe(drugi.zakres);
  });
});

/**
 * Test trwały, nie tylko naprawa jednego przypadku.
 *
 * Klasa błędu: klient płaci i nie dostaje tego, za co zapłacił. Taki błąd nie
 * wraca przez zgłoszenie, tylko przez brak odnowienia rok później, więc musi go
 * pilnować test, a nie czyjaś pamięć o jednej naprawionej sytuacji.
 *
 * Reguła jest ogólna: każda firma z aktywnym abonamentem daje swoim ludziom
 * zakres pełny, niezależnie od tego, do ilu innych firm należą i w jakiej
 * kolejności zostali do nich zapisani.
 */
describe("każda firma z abonamentem daje pełny zakres, bez względu na inne członkostwa", () => {
  it("wszyscy członkowie firm z aktywnym abonamentem dostają zakres pełny", async () => {
    const czlonkowie = await db
      .select({
        userId: companyMembers.userId,
        companyId: companyMembers.companyId,
        slug: companies.slug,
      })
      .from(companyMembers)
      .innerJoin(companies, eq(companies.id, companyMembers.companyId));

    // Instancja pozytywna: musi istnieć choć jedna firma z abonamentem,
    // inaczej pętla niżej nie wykonałaby ani jednego sprawdzenia.
    const zAktywnym = [];
    for (const czlonek of czlonkowie) {
      if (await maAktywnyAbonament(czlonek.companyId)) zAktywnym.push(czlonek);
    }
    expect(zAktywnym.length).toBeGreaterThan(0);

    for (const czlonek of zAktywnym) {
      const czlonkostwo = await czlonkostwoUzytkownika(czlonek.userId);

      expect(
        czlonkostwo?.abonament,
        `Użytkownik należy do firmy ${czlonek.slug} z aktywnym abonamentem, ` +
          "a system wybrał mu kontekst bez abonamentu. Płaci i nie widzi, za co.",
      ).toBe(true);
    }
  });

  it("liczba firm użytkownika nie zmienia tego, co widzi firma z abonamentem", async () => {
    // Porównanie wprost: człowiek w jednej firmie z abonamentem i człowiek
    // w dwóch, z których jedna ma abonament, mają dostać to samo.
    const wDwoch = await db
      .select({ userId: companyMembers.userId })
      .from(companyMembers)
      .groupBy(companyMembers.userId)
      .having(sql`count(*) > 1`);

    expect(wDwoch.length).toBeGreaterThan(0);

    for (const { userId } of wDwoch) {
      const czlonkostwa = await db
        .select({ companyId: companyMembers.companyId })
        .from(companyMembers)
        .where(eq(companyMembers.userId, userId));

      let maGdziekolwiekAbonament = false;
      for (const c of czlonkostwa) {
        if (await maAktywnyAbonament(c.companyId)) maGdziekolwiekAbonament = true;
      }

      const wybrane = await czlonkostwoUzytkownika(userId);
      expect(wybrane?.abonament).toBe(maGdziekolwiekAbonament);
    }
  });
});

describe("użytkownik należący do dwóch firm", () => {
  it("zasiew zawiera taki przypadek", async () => {
    const czlonkostwa = await db
      .select({ userId: companyMembers.userId, companyId: companyMembers.companyId })
      .from(companyMembers);

    const wgUzytkownika = new Map<string, number>();
    for (const c of czlonkostwa) {
      wgUzytkownika.set(c.userId, (wgUzytkownika.get(c.userId) ?? 0) + 1);
    }

    const wDwoch = [...wgUzytkownika.values()].filter((ile) => ile >= 2);
    expect(wDwoch.length).toBeGreaterThan(0);
  });
});

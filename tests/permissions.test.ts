/**
 * Testy reguły „co kto widzi”. CI uruchamia ten plik osobno i głośno,
 * bo to on chroni cały model przychodowy.
 *
 * Testy strzelają do handlerów endpointów i sprawdzają treść odpowiedzi API,
 * nie wyrenderowany HTML. Strona może wyglądać poprawnie, podczas gdy API
 * oddaje opis i budżet w danych, z których ona korzysta. To jest dokładnie ten
 * wyciek, który kosztuje.
 *
 * Wymagają działającej bazy z danymi zasiewowymi: pnpm db:up && pnpm db:reset.
 */
import { and, eq, isNotNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { GET as pobierzJedno } from "@/app/api/zlecenia/[id]/route";
import { GET as pobierzListe } from "@/app/api/zlecenia/route";
import { db } from "@/lib/db";
import { pobierzListeZlecen } from "@/lib/db/queries/requests";
import { requests } from "@/lib/db/schema/gielda";
import {
  KOD_HTTP,
  mozeZlozycOferte,
  mozeZobaczycKontakt,
  mozeZobaczycSzczegoly,
  NiezaimplementowanaGalazUprawnien,
  type Widz,
  widocznoscZlecenia,
  ZAJAWKA_OPISU_ZNAKOW,
} from "@/lib/permissions";

const ANONIM: Widz = { rodzaj: "anonim" };

/** Pola, których anonim nie ma prawa zobaczyć pod żadną nazwą. */
const POLA_ZAKAZANE = [
  "description",
  "opis",
  "budget",
  "budzet",
  "budgetMin",
  "budgetMax",
  "budget_min",
  "budget_max",
  "point",
  "authorUserId",
  "author_user_id",
];

function zadanie(sciezka: string): Request {
  return new Request(`http://localhost:3000${sciezka}`);
}

describe("kody HTTP niosące logikę biznesową", () => {
  it("brak abonamentu to 402, czyli ekran sprzedażowy, nie błąd", () => {
    expect(KOD_HTTP["brak-abonamentu"]).toBe(402);
  });

  it("druga oferta tej samej firmy to 409", () => {
    expect(KOD_HTTP["oferta-juz-zlozona"]).toBe(409);
  });

  it("wyczerpany limit planu Start to 429, czyli droga do wyższego planu", () => {
    expect(KOD_HTTP["limit-planu-wyczerpany"]).toBe(429);
  });
});

describe("domyślna odmowa: gałąź, której nie ma, nie przepuszcza", () => {
  // Najgroźniejszy błąd w tym projekcie to gałąź uprawnień, która jeszcze
  // nie istnieje i dlatego przepuszcza wszystko. Ten blok pilnuje, że każda
  // niezaimplementowana gałąź rzuca, zamiast zwracać cokolwiek.
  // Lista kurczy się z każdym plastrem. Klient i autor zeszły z niej razem
  // z sesjami, firma razem z abonamentami. Zostaje moderator, czekający
  // na panel moderacji.
  const niezaimplementowani: ReadonlyArray<readonly [string, Widz]> = [
    ["moderator", { rodzaj: "moderator", userId: "u5" }],
  ];

  for (const [nazwa, widz] of niezaimplementowani) {
    it(`widocznoscZlecenia rzuca dla widza: ${nazwa}`, () => {
      expect(() => widocznoscZlecenia(widz)).toThrow(NiezaimplementowanaGalazUprawnien);
    });

    it(`mozeZobaczycSzczegoly rzuca dla widza: ${nazwa}`, () => {
      expect(() => mozeZobaczycSzczegoly(widz)).toThrow(NiezaimplementowanaGalazUprawnien);
    });

    it(`mozeZlozycOferte rzuca dla widza: ${nazwa}`, () => {
      expect(() =>
        mozeZlozycOferte(widz, {
          requestId: "z1",
          jestJuzOferta: false,
          przyjmujeOferty: true,
          ofertWOkresie: 0,
          limitPlanu: 15,
        }),
      ).toThrow(NiezaimplementowanaGalazUprawnien);
    });

    it(`mozeZobaczycKontakt rzuca dla widza: ${nazwa}`, () => {
      expect(() => mozeZobaczycKontakt(widz, true)).toThrow(NiezaimplementowanaGalazUprawnien);
    });
  }

  it("zapytanie o listę rzuca dla widza, którego gałąź nie istnieje", async () => {
    const moderator: Widz = { rodzaj: "moderator", userId: "u5" };
    await expect(pobierzListeZlecen(moderator, { limit: 5, offset: 0 })).rejects.toThrow(
      NiezaimplementowanaGalazUprawnien,
    );
  });
});

describe("anonim i zalogowany klient: gałęzie zaimplementowane", () => {
  it("nie ma prawa do opisu ani do budżetu", () => {
    const widocznosc = widocznoscZlecenia(ANONIM);
    expect(widocznosc.opis.rodzaj).toBe("brak");
    expect(widocznosc.budzet).toBe(false);
  });

  it("widzi lokalizację wyłącznie z dokładnością do powiatu", () => {
    expect(widocznoscZlecenia(ANONIM).lokalizacja).toBe("powiat");
  });

  it("nie widzi liczby ofert ani cen konkurencji", () => {
    const widocznosc = widocznoscZlecenia(ANONIM);
    expect(widocznosc.liczbaOfert).toBe(false);
    expect(widocznosc.cenyKonkurencji).toBe(false);
  });

  it("zalogowany klient widzi dokładnie tyle co anonim", () => {
    // Samo zalogowanie się niczego nie odsłania. Dopiero autorstwo zlecenia
    // zmienia zakres, a to rozstrzyga się przy konkretnym zleceniu.
    const klient: Widz = { rodzaj: "klient", userId: "u1" };
    expect(widocznoscZlecenia(klient)).toEqual(widocznoscZlecenia(ANONIM));
  });

  it("autor widzi własny opis, budżet i liczbę ofert", () => {
    const autor: Widz = { rodzaj: "autor", userId: "u4" };
    const widocznosc = widocznoscZlecenia(autor);
    expect(widocznosc.opis.rodzaj).toBe("caly");
    expect(widocznosc.budzet).toBe(true);
    expect(widocznosc.liczbaOfert).toBe(true);
    expect(widocznosc.lokalizacja).toBe("dokladna");
  });

  it("autor nie składa ofert na własne zlecenie", () => {
    const autor: Widz = { rodzaj: "autor", userId: "u4" };
    expect(
      mozeZlozycOferte(autor, {
        requestId: "z1",
        jestJuzOferta: false,
        przyjmujeOferty: true,
        ofertWOkresie: 0,
        limitPlanu: null,
      }),
    ).toEqual({ wolno: false, powod: "brak-dostepu" });
  });

  it("nie dostaje danych kontaktowych i nie składa ofert", () => {
    expect(mozeZobaczycKontakt(ANONIM, true)).toEqual({ wolno: false, powod: "brak-dostepu" });
    expect(
      mozeZlozycOferte(ANONIM, {
        requestId: "z1",
        jestJuzOferta: false,
        przyjmujeOferty: true,
        ofertWOkresie: 0,
        limitPlanu: null,
      }),
    ).toEqual({ wolno: false, powod: "brak-dostepu" });
  });
});

/**
 * Przypadek 1 z docs/uprawnienia.md:
 * anonimowe zapytanie do API zlecenia nie zwraca `description` ani `budget`.
 */
describe("przypadek 1: anonimowe API nie oddaje opisu ani budżetu", () => {
  it("lista zleceń nie zawiera żadnego z pól zakazanych", async () => {
    const odpowiedz = await pobierzListe(zadanie("/api/zlecenia"));
    expect(odpowiedz.status).toBe(200);

    const dane = await odpowiedz.json();
    expect(Array.isArray(dane.zlecenia)).toBe(true);
    expect(dane.zlecenia.length).toBeGreaterThan(0);

    for (const zlecenie of dane.zlecenia) {
      for (const pole of POLA_ZAKAZANE) {
        expect(Object.keys(zlecenie)).not.toContain(pole);
      }
    }
  });

  it("surowa treść odpowiedzi listy nie zawiera opisu żadnego otwartego zlecenia", async () => {
    // Sprawdzenie po kluczach można obejść, zagnieżdżając dane głębiej,
    // więc patrzymy na cały tekst odpowiedzi.
    //
    // Szukanych fragmentów NIE wpisujemy tu na sztywno. Wcześniejsza wersja
    // szukała łańcuchów z zasiewu, a inny plik testowy nadpisywał opisy
    // wszystkich otwartych zleceń. Po jego przebiegu tych łańcuchów nie było
    // już w bazie i test przechodził, nie sprawdzając niczego.
    //
    // Opisy bierzemy z bazy w chwili uruchomienia i najpierw upewniamy się,
    // że instancja pozytywna w ogóle istnieje.
    const opisy = await db
      .select({ opis: requests.description })
      .from(requests)
      .where(eq(requests.status, "open"))
      .limit(20);

    const niepuste = opisy.map((w) => w.opis).filter((opis) => opis.length > 20);
    expect(
      niepuste.length,
      "W bazie nie ma ani jednego otwartego zlecenia z opisem. Bez instancji " +
        "pozytywnej ten test niczego nie dowodzi.",
    ).toBeGreaterThan(0);

    const odpowiedz = await pobierzListe(zadanie("/api/zlecenia?limit=50"));
    const tresc = await odpowiedz.text();

    for (const opis of niepuste) {
      expect(tresc).not.toContain(opis);
      // Fragment ze środka, na wypadek gdyby ktoś zwrócił opis obcięty.
      expect(tresc).not.toContain(opis.slice(5, 25));
    }
  });

  it("pojedyncze zlecenie też nie oddaje opisu ani budżetu", async () => {
    // Instancja pozytywna: w bazie musi istnieć otwarte zlecenie z wypełnionym
    // budżetem. Bez tego „odpowiedź nie zawiera budżetu” byłoby prawdą
    // także wtedy, gdyby budżetu nie miał nikt.
    const zBudzetem = await db
      .select({ id: requests.id })
      .from(requests)
      .where(and(eq(requests.status, "open"), isNotNull(requests.budgetMin)))
      .limit(1);

    expect(
      zBudzetem.length,
      "W bazie nie ma otwartego zlecenia z budżetem. Test negatywny byłby pusty.",
    ).toBe(1);

    const lista = await (await pobierzListe(zadanie("/api/zlecenia?limit=1"))).json();
    const pierwsze = lista.zlecenia[0];
    expect(pierwsze).toBeDefined();

    const odpowiedz = await pobierzJedno(zadanie(`/api/zlecenia/${pierwsze.id}`), {
      params: Promise.resolve({ id: pierwsze.id }),
    });
    expect(odpowiedz.status).toBe(200);

    const tresc = await odpowiedz.text();
    expect(tresc).not.toContain("Szukamy miejsca na przyjęcie");
    expect(tresc).not.toContain("budget");
    expect(tresc).not.toContain("budzet");

    const dane = JSON.parse(tresc);
    for (const pole of POLA_ZAKAZANE) {
      expect(Object.keys(dane.zlecenie)).not.toContain(pole);
    }
  });

  it("zlecenie wygasłe nie pojawia się na liście publicznej", async () => {
    const dane = await (await pobierzListe(zadanie("/api/zlecenia?limit=50"))).json();
    for (const zlecenie of dane.zlecenia) {
      expect(zlecenie.status).toBe("open");
    }
  });

  it("wygasłe zlecenie pobrane po identyfikatorze daje 404, a nie okrojone dane", async () => {
    // Zasiew ustawia zlecenie numer 2 jako wygasłe. Bierzemy je wprost z bazy,
    // bo przez API jest niewidoczne, i pytamy o nie po identyfikatorze.
    const wygasle = await db
      .select({ id: requests.id })
      .from(requests)
      .where(eq(requests.status, "expired"))
      .limit(1);

    const id = wygasle[0]?.id;
    expect(id).toBeDefined();
    if (!id) return;

    const odpowiedz = await pobierzJedno(zadanie(`/api/zlecenia/${id}`), {
      params: Promise.resolve({ id }),
    });
    expect(odpowiedz.status).toBe(404);
  });

  it("nieprawidłowy identyfikator daje 400, nie wyciek i nie 500", async () => {
    const odpowiedz = await pobierzJedno(zadanie("/api/zlecenia/nie-uuid"), {
      params: Promise.resolve({ id: "nie-uuid" }),
    });
    expect(odpowiedz.status).toBe(400);
  });
});

/**
 * Przypadki 3, 5 i 9 w wersji „na samej regule”, bez bazy.
 *
 * Ich pełne odpowiedniki, działające na firmach z zasiewu i na prawdziwym
 * stanie abonamentu, mieszkają w tests/abonament.test.ts. Tutaj zostaje to,
 * co da się rozstrzygnąć samym wywołaniem reguły.
 */
describe("przypadki 3 i 5 na poziomie samej reguły", () => {
  const bezAbonamentu: Widz = { rodzaj: "firma", userId: "u2", companyId: "f1", abonament: false };
  const zAbonamentem: Widz = { rodzaj: "firma", userId: "u3", companyId: "f2", abonament: true };

  it("stała zajawki wynosi 120 znaków", () => {
    expect(ZAJAWKA_OPISU_ZNAKOW).toBe(120);
  });

  it("firma bez abonamentu dostaje zajawkę: nie cały opis i nie nic", () => {
    expect(widocznoscZlecenia(bezAbonamentu).opis).toEqual({
      rodzaj: "zajawka",
      znakow: ZAJAWKA_OPISU_ZNAKOW,
    });
    expect(widocznoscZlecenia(bezAbonamentu).budzet).toBe(false);
  });

  it("firma z abonamentem widzi cały opis i budżet", () => {
    expect(widocznoscZlecenia(zAbonamentem).opis).toEqual({ rodzaj: "caly" });
    expect(widocznoscZlecenia(zAbonamentem).budzet).toBe(true);
  });

  it("żadna firma nie widzi liczby ofert ani cen konkurencji", () => {
    for (const widz of [bezAbonamentu, zAbonamentem]) {
      expect(widocznoscZlecenia(widz).liczbaOfert).toBe(false);
      expect(widocznoscZlecenia(widz).cenyKonkurencji).toBe(false);
    }
  });

  it("sam abonament nie odsłania kontaktu, dopiero shortlist", () => {
    expect(mozeZobaczycKontakt(zAbonamentem, false)).toEqual({
      wolno: false,
      powod: "brak-dostepu",
    });
    expect(mozeZobaczycKontakt(zAbonamentem, true)).toEqual({ wolno: true });
  });

  it("firma bez abonamentu pytająca o kontakt dostaje 402, nie 403", () => {
    // Powód „brak-abonamentu” to ekran sprzedażowy. Powód „brak-dostepu”
    // to ślepa ściana. Dla firmy bez abonamentu właściwy jest ten pierwszy.
    expect(mozeZobaczycKontakt(bezAbonamentu, true)).toEqual({
      wolno: false,
      powod: "brak-abonamentu",
    });
  });
});

/*
 * Przypadki 2, 4, 6, 7 i 8 mieszkają w tests/oferty.test.ts, bo wymagają
 * prawdziwych ofert w bazie i endpointu, który je tworzy.
 *
 * Wszystkie dziewięć przypadków z docs/uprawnienia.md jest pokrytych. Lista
 * `todo` w tym pliku jest pusta po raz pierwszy od pierwszego plastra i ma taka
 * zostać: nowy endpoint dotykający requests albo bids dokłada przypadek,
 * a nie kolejne todo.
 */

/**
 * Wystawianie zlecenia: `utworzZlecenie` z lib/db/queries/requests.ts.
 *
 * Reguła biznesowa: zlecenie wystawia zalogowany człowiek, autorem jest ten,
 * kto pyta, a nie to, co przyszło formularzem, i zlecenie zawsze ma punkt
 * na mapie oraz datę wygaśnięcia nie późniejszą niż dzień po wydarzeniu.
 *
 * Przypadek, który tu najbardziej boli: **firma też może wystawić zlecenie**.
 * Właściciel sali organizujący komunię córki jest jednocześnie firmą
 * i klientem. Ograniczenie tego prawa do gałęzi „klient” wygląda na
 * zaostrzenie uprawnień, a jest błędem rozpoznania widza.
 *
 * Wymaga działającej bazy z zasiewem.
 */
import { and, asc, eq, isNotNull, ne, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { OKAZJA_INNA } from "@/content/okazje";
import { db } from "@/lib/db";
import {
  type DaneNowegoZlecenia,
  utworzZlecenie,
  WAZNOSC_ZLECENIA_DNI,
} from "@/lib/db/queries/requests";
import { cities } from "@/lib/db/schema/geografia";
import { requests } from "@/lib/db/schema/gielda";
import { companyMembers, eventTypes } from "@/lib/db/schema/katalog";
import { users } from "@/lib/db/schema/tozsamosc";
import type { Widz } from "@/lib/permissions";

const ANONIM: Widz = { rodzaj: "anonim" };
const MODERATOR: Widz = { rodzaj: "moderator", userId: "11111111-1111-4111-8111-111111111111" };

/**
 * Miejscowość bez współrzędnych, zakładana na czas tego pliku i sprzątana
 * po nim. Sprzątanie nie jest kosmetyką: wiersz `cities` bez `point` blokuje
 * cofnięcie migracji 0006, a więc i drugie uruchomienie całego zestawu.
 */
const MIEJSCOWOSC_BEZ_PUNKTU = "test-zlecenie-bez-wspolrzednych";

/** Zlecenia założone przez ten plik. Po nich sprzątamy. */
const UTWORZONE: string[] = [];

async function klientZZasiewu(): Promise<Extract<Widz, { rodzaj: "klient" }>> {
  const [wiersz] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.role, "client"),
        sql`not exists (select 1 from ${companyMembers} where ${companyMembers.userId} = ${users.id})`,
      ),
    )
    .orderBy(users.email)
    .limit(1);

  if (!wiersz) throw new Error("Zasiew nie ma klienta bez firmy, a na nim stoi ten plik.");
  return { rodzaj: "klient", userId: wiersz.id };
}

/** Człowiek z zasiewu, który należy do firmy. Ten sam, który bywa autorem zlecenia. */
async function czlonekFirmy(): Promise<Extract<Widz, { rodzaj: "firma" }>> {
  const [wiersz] = await db
    .select({ userId: companyMembers.userId, companyId: companyMembers.companyId })
    .from(companyMembers)
    .orderBy(companyMembers.userId)
    .limit(1);

  if (!wiersz) throw new Error("Zasiew nie ma członkostwa w firmie, a na nim stoi ten plik.");
  return { rodzaj: "firma", userId: wiersz.userId, companyId: wiersz.companyId, abonament: true };
}

async function miejscowoscZPunktem(): Promise<{ id: string; punkt: string }> {
  const [wiersz] = await db
    .select({ id: cities.id, punkt: sql<string>`${cities.point}::text` })
    .from(cities)
    .where(isNotNull(cities.point))
    .orderBy(cities.slug)
    .limit(1);

  if (!wiersz) throw new Error("Zasiew nie ma miejscowości ze współrzędnymi.");
  return wiersz;
}

/**
 * Zwykła okazja ze słownika, czyli taka, która nie wymaga nazwy własnej.
 *
 * Dwie rzeczy, których tu wcześniej nie było, i obie okazały się konieczne:
 *
 *   - wykluczenie „innej okazji”. Migracja 0014 wstawia ten wiersz przed
 *     zasiewem, więc bez warunku pomocnik oddawał właśnie ją i każde
 *     zlecenie zbudowane tym pomocnikiem odbijało się o regułę „własna
 *     nazwa wymagana przy innej okazji”. Objaw wyglądał na awarię zapisu
 *     w jedenastu miejscach naraz, a był błędem w jednym pomocniku.
 *   - sortowanie. `limit(1)` bez `order by` oddaje wiersz, który baza akurat
 *     zwróci pierwszy, a to zależy od kolejności wstawiania i od tego,
 *     czy ktoś coś w międzyczasie zmienił. Test ma być powtarzalny.
 */
async function slugOkazji(): Promise<string> {
  const [wiersz] = await db
    .select({ slug: eventTypes.slug })
    .from(eventTypes)
    .where(ne(eventTypes.slug, OKAZJA_INNA.slug))
    .orderBy(asc(eventTypes.slug))
    .limit(1);
  if (!wiersz) throw new Error("Zasiew nie ma zwykłej okazji.");
  return wiersz.slug;
}

/** Data wydarzenia daleko w przyszłości: ponad `WAZNOSC_ZLECENIA_DNI` stąd. */
function dataZaRok(): string {
  const data = new Date();
  data.setFullYear(data.getFullYear() + 1);
  return data.toISOString().slice(0, 10);
}

/** Data wydarzenia bliska: wcześniejsza niż granica ważności. */
function dataZaTydzien(): string {
  const data = new Date();
  data.setDate(data.getDate() + 7);
  return data.toISOString().slice(0, 10);
}

async function wejscie(nadpisania: Partial<DaneNowegoZlecenia> = {}): Promise<DaneNowegoZlecenia> {
  const miejscowosc = await miejscowoscZPunktem();

  return {
    okazja: await slugOkazji(),
    innaOkazja: null,
    dataWydarzenia: dataZaRok(),
    liczbaOsob: 80,
    cityId: miejscowosc.id,
    opis: "Szukamy sali na komunię córki, osiemdziesięciu gości, przydałby się ogród.",
    budzetMin: null,
    budzetMax: null,
    ...nadpisania,
  };
}

async function liczbaZlecen(): Promise<number> {
  const [wiersz] = await db.select({ ile: sql<number>`count(*)::int` }).from(requests);
  return wiersz?.ile ?? 0;
}

beforeAll(async () => {
  await db
    .insert(cities)
    .values({
      name: "Testowa Bez Współrzędnych (zlecenia)",
      slug: MIEJSCOWOSC_BEZ_PUNKTU,
      powiat: "testowy",
      wojewodztwo: "testowe",
      rodzaj: "część miejscowości",
      point: null,
    })
    .onConflictDoNothing({ target: cities.slug });
});

afterAll(async () => {
  for (const id of UTWORZONE) await db.delete(requests).where(eq(requests.id, id));

  /*
   * Sprzątanie liczy się z tym, że test padł.
   *
   * Gdy kontrola współrzędnych przestanie działać, zlecenie na miejscowość
   * bez punktu **powstanie**, a test wywali się, zanim zdąży je zapamiętać.
   * Wiersz zostaje, klucz obcy nie pozwala usunąć miejscowości, a miejscowość
   * bez `point` blokuje cofnięcie migracji 0006. Następne `pnpm test` nie
   * przechodzi wtedy przygotowania bazy i wygląda to na awarię w miejscu,
   * które z tym plikiem nie ma nic wspólnego. Sprawdzone na własnej skórze.
   */
  const [bezPunktu] = await db
    .select({ id: cities.id })
    .from(cities)
    .where(eq(cities.slug, MIEJSCOWOSC_BEZ_PUNKTU))
    .limit(1);

  if (bezPunktu) {
    await db.delete(requests).where(eq(requests.cityId, bezPunktu.id));
    await db.delete(cities).where(eq(cities.id, bezPunktu.id));
  }
});

describe("kto może wystawić zlecenie", () => {
  it("anonim dostaje odmowę i nie powstaje żaden wiersz", async () => {
    const przed = await liczbaZlecen();

    const wynik = await utworzZlecenie(ANONIM, await wejscie());

    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.powod).toBe("brak-dostepu");
    // Sedno: odmowa to za mało, w bazie ma nie przybyć zlecenia.
    expect(await liczbaZlecen()).toBe(przed);
  });

  it("moderator dostaje odmowę, bo oceniałby własną treść", async () => {
    /*
     * Do czasu kolejki moderacji ten przypadek sprawdzał rzut: moderator
     * był ostatnim widzem bez gałęzi uprawnień. Gałąź powstała i jest
     * świadomą odmową, nie luką. To nie jest zakaz dla człowieka, tylko
     * dla roli: od wystawiania zleceń jest zwykłe konto klienta.
     */
    const wynik = await utworzZlecenie(MODERATOR, await wejscie());

    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.powod).toBe("brak-dostepu");
  });

  it("klient z zasiewu zapisuje zlecenie", async () => {
    const widz = await klientZZasiewu();

    const wynik = await utworzZlecenie(widz, await wejscie());

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;
    UTWORZONE.push(wynik.dane.id);

    const [zapisane] = await db
      .select({ autor: requests.authorUserId, status: requests.status })
      .from(requests)
      .where(eq(requests.id, wynik.dane.id))
      .limit(1);

    expect(zapisane?.autor).toBe(widz.userId);
    expect(zapisane?.status).toBe("open");
  });

  it("firma też może, bo właściciel sali bywa klientem u siebie w serwisie", async () => {
    const widz = await czlonekFirmy();

    const wynik = await utworzZlecenie(widz, await wejscie());

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;
    UTWORZONE.push(wynik.dane.id);

    const [zapisane] = await db
      .select({ autor: requests.authorUserId })
      .from(requests)
      .where(eq(requests.id, wynik.dane.id))
      .limit(1);

    // Autorem jest człowiek, nie firma. Gdyby zapisywało firmę, oferty
    // trafiałyby do niewłaściwej skrzynki.
    expect(zapisane?.autor).toBe(widz.userId);
  });
});

describe("czego zapis nie bierze z wejścia", () => {
  it("autor pochodzi z widza, nie z przesłanych danych", async () => {
    const widz = await klientZZasiewu();
    const ktosInny = await czlonekFirmy();

    /*
     * Wejście udaje formularz, który próbuje podstawić cudzego autora.
     * Typ go nie przewiduje, więc podajemy go obok typu — dokładnie tak,
     * jak zrobiłby to ktoś z zewnątrz, wysyłając dodatkowe pole.
     */
    const dane = { ...(await wejscie()), authorUserId: ktosInny.userId } as DaneNowegoZlecenia;

    const wynik = await utworzZlecenie(widz, dane);

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;
    UTWORZONE.push(wynik.dane.id);

    const [zapisane] = await db
      .select({ autor: requests.authorUserId })
      .from(requests)
      .where(eq(requests.id, wynik.dane.id))
      .limit(1);

    expect(zapisane?.autor).toBe(widz.userId);
    expect(zapisane?.autor).not.toBe(ktosInny.userId);
  });

  it("punkt zlecenia jest punktem wybranej miejscowości", async () => {
    const widz = await klientZZasiewu();
    const miejscowosc = await miejscowoscZPunktem();

    const wynik = await utworzZlecenie(widz, await wejscie({ cityId: miejscowosc.id }));

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;
    UTWORZONE.push(wynik.dane.id);

    const [zapisane] = await db
      .select({ punkt: sql<string>`${requests.point}::text` })
      .from(requests)
      .where(eq(requests.id, wynik.dane.id))
      .limit(1);

    expect(zapisane?.punkt).toBe(miejscowosc.punkt);
  });

  it("miejscowość bez współrzędnych to odmowa i zero wierszy", async () => {
    const widz = await klientZZasiewu();
    const [bezPunktu] = await db
      .select({ id: cities.id })
      .from(cities)
      .where(eq(cities.slug, MIEJSCOWOSC_BEZ_PUNKTU))
      .limit(1);

    expect(bezPunktu).toBeDefined();
    if (!bezPunktu) return;

    const przed = await liczbaZlecen();
    const wynik = await utworzZlecenie(widz, await wejscie({ cityId: bezPunktu.id }));

    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.powod).toBe("miejscowosc-bez-wspolrzednych");
    expect(await liczbaZlecen()).toBe(przed);
  });
});

describe("data wygaśnięcia", () => {
  it("nie jest późniejsza niż dzień po wydarzeniu", async () => {
    const widz = await klientZZasiewu();
    const data = dataZaTydzien();

    const wynik = await utworzZlecenie(widz, await wejscie({ dataWydarzenia: data }));

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;
    UTWORZONE.push(wynik.dane.id);

    const [zapisane] = await db
      .select({
        poWydarzeniu: sql<boolean>`${requests.expiresAt} <= (${data}::date + interval '1 day')`,
        wPrzyszlosci: sql<boolean>`${requests.expiresAt} > now()`,
      })
      .from(requests)
      .where(eq(requests.id, wynik.dane.id))
      .limit(1);

    // Wydarzenie jest za tydzień, więc to data wydarzenia, a nie miesiąc,
    // wyznacza koniec. Sztywne „plus trzydzieści dni” złamałoby ten warunek.
    expect(zapisane?.poWydarzeniu).toBe(true);
    expect(zapisane?.wPrzyszlosci).toBe(true);
  });

  it("dla odległego wydarzenia obowiązuje granica miesiąca", async () => {
    const widz = await klientZZasiewu();

    const wynik = await utworzZlecenie(widz, await wejscie({ dataWydarzenia: dataZaRok() }));

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;
    UTWORZONE.push(wynik.dane.id);

    const [zapisane] = await db
      .select({
        wGranicy: sql<boolean>`${requests.expiresAt} <= now() + make_interval(days => ${WAZNOSC_ZLECENIA_DNI})`,
      })
      .from(requests)
      .where(eq(requests.id, wynik.dane.id))
      .limit(1);

    expect(zapisane?.wGranicy).toBe(true);
  });
});

describe("budżet i okazja", () => {
  it("kwoty trafiają do bazy w groszach, a puste pole jako brak wartości", async () => {
    const widz = await klientZZasiewu();

    const wynik = await utworzZlecenie(
      widz,
      // Zod przelicza złotówki na grosze, więc tutaj są już grosze.
      await wejscie({ budzetMin: 150_000, budzetMax: null }),
    );

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;
    UTWORZONE.push(wynik.dane.id);

    const [zapisane] = await db
      .select({ min: requests.budgetMin, max: requests.budgetMax })
      .from(requests)
      .where(eq(requests.id, wynik.dane.id))
      .limit(1);

    expect(zapisane?.min).toBe(150_000);
    // Pusty budżet to „nie podano”, nie „zero złotych”.
    expect(zapisane?.max).toBeNull();
  });

  it("okazja spoza słownika to odmowa i zero wierszy", async () => {
    const widz = await klientZZasiewu();
    const przed = await liczbaZlecen();

    const wynik = await utworzZlecenie(widz, await wejscie({ okazja: "nie-ma-takiej-okazji" }));

    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.powod).toBe("nieznana-okazja");
    expect(await liczbaZlecen()).toBe(przed);
  });
});

/**
 * Druga bariera pod regułą „własna nazwa okazji dokładnie przy »inna«”.
 *
 * Pierwsza stoi w Zodzie i ma własny plik, lib/validators/zlecenia.test.ts.
 * Ta jest sprawdzana osobno, bo `utworzZlecenie` jest wywoływane także
 * poza formularzem i sama walidacja wejścia by tu nie wystarczyła.
 * Przypadki niżej omijają Zoda w ogóle: wołają zapytanie wprost, czyli
 * dokładnie tak, jak zrobiłby to przyszły import albo akcja z panelu.
 *
 * Warunku nie da się zapisać jako CHECK w bazie, bo sięga przez klucz
 * obcy do `event_types`. Ta funkcja jest jedynym miejscem, w którym żyje.
 */
describe("okazja wpisana własnymi słowami", () => {
  it("zapisuje nazwę i odczyt pokazuje ją zamiast nazwy ze słownika", async () => {
    const widz = await klientZZasiewu();

    const wynik = await utworzZlecenie(
      widz,
      await wejscie({ okazja: "inna", innaOkazja: "zjazd rocznika" }),
    );

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;
    UTWORZONE.push(wynik.dane.id);

    const [zapisane] = await db
      .select({
        wlasna: requests.customEventName,
        /*
         * Ten sam `coalesce`, którym jadą wszystkie odczyty zleceń.
         * Sprawdzamy go tutaj, bo bez niego giełda pokazałaby „Inna
         * okazja” przy każdym takim zleceniu i cała kolumna byłaby
         * zapisana, a niewidoczna.
         */
        pokazywana: sql<string>`coalesce(${requests.customEventName}, ${eventTypes.name})`,
      })
      .from(requests)
      .innerJoin(eventTypes, eq(requests.eventTypeId, eventTypes.id))
      .where(eq(requests.id, wynik.dane.id))
      .limit(1);

    expect(zapisane?.wlasna).toBe("zjazd rocznika");
    expect(zapisane?.pokazywana).toBe("zjazd rocznika");
  });

  it("okazja ze słownika zostawia kolumnę pustą, a odczyt bierze nazwę słownikową", async () => {
    /*
     * Instancja pozytywna obok testów negatywnych niżej. Bez niej „nigdzie
     * nie ma własnej nazwy” i „tu jej nie ma” dawałyby ten sam wynik,
     * a zapytanie zwracające zawsze `null` przechodziłoby komplet.
     */
    const widz = await klientZZasiewu();
    const slug = await slugOkazji();

    const wynik = await utworzZlecenie(widz, await wejscie({ okazja: slug, innaOkazja: null }));

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;
    UTWORZONE.push(wynik.dane.id);

    const [zapisane] = await db
      .select({
        wlasna: requests.customEventName,
        pokazywana: sql<string>`coalesce(${requests.customEventName}, ${eventTypes.name})`,
        slownikowa: eventTypes.name,
      })
      .from(requests)
      .innerJoin(eventTypes, eq(requests.eventTypeId, eventTypes.id))
      .where(eq(requests.id, wynik.dane.id))
      .limit(1);

    expect(zapisane?.wlasna).toBeNull();
    expect(zapisane?.pokazywana).toBe(zapisane?.slownikowa);
  });

  it("inna okazja bez nazwy to odmowa i zero wierszy", async () => {
    const widz = await klientZZasiewu();
    const przed = await liczbaZlecen();

    const wynik = await utworzZlecenie(widz, await wejscie({ okazja: "inna", innaOkazja: null }));

    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.powod).toBe("niezgodna-wlasna-okazja");
    expect(await liczbaZlecen()).toBe(przed);
  });

  it("inna okazja z nazwą z samych spacji to odmowa", async () => {
    // Zapytanie przycina samo, bo nie wolno mu zakładać, że ktokolwiek
    // zrobił to przed nim. Napis spacji jest pusty, więc para jest
    // niezgodna tak samo jak brak nazwy.
    const widz = await klientZZasiewu();
    const przed = await liczbaZlecen();

    const wynik = await utworzZlecenie(widz, await wejscie({ okazja: "inna", innaOkazja: "   " }));

    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.powod).toBe("niezgodna-wlasna-okazja");
    expect(await liczbaZlecen()).toBe(przed);
  });

  it("własna nazwa przy okazji ze słownika to odmowa i zero wierszy", async () => {
    const widz = await klientZZasiewu();
    const slug = await slugOkazji();
    const przed = await liczbaZlecen();

    const wynik = await utworzZlecenie(
      widz,
      await wejscie({ okazja: slug, innaOkazja: "zjazd rocznika" }),
    );

    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.powod).toBe("niezgodna-wlasna-okazja");
    expect(await liczbaZlecen()).toBe(przed);
  });

  it("wiersz słownika „inna” istnieje, bo wstawia go migracja 0014", async () => {
    /*
     * Zasiew go nie wstawia i nie powinien: wstawiłby duplikat slugu.
     * Ten test pilnuje, żeby nikt nie wyrzucił wstawki z migracji
     * w przekonaniu, że dubluje zasiew. Bez tego wiersza cała funkcja
     * odmawia z powodem „nieznana-okazja”.
     */
    const [wiersz] = await db
      .select({ nazwa: eventTypes.name })
      .from(eventTypes)
      .where(eq(eventTypes.slug, "inna"))
      .limit(1);

    expect(wiersz?.nazwa).toBe("Inna okazja");
  });
});

/**
 * Kreator zakładania firmy: cztery kroki, cztery zapisy.
 *
 * Reguła biznesowa, na której stoi cały ten plik: **firma, która przeszła
 * kreator, jest do znalezienia w katalogu**. Znaczy to trzy rzeczy naraz:
 *
 *   - ma kategorię, bo po niej katalog ją grupuje,
 *   - ma współrzędne, bo po nich działa wyszukiwanie po promieniu,
 *   - ma NIP, bo bez niego nie da się jej zweryfikować ani wystawić faktury.
 *
 * Przed tą zmianą żadna z tych trzech nie była zapisywana: kategoria ginęła
 * w komentarzu „dopracujemy w migracji”, lokalizacja nie była wywoływana wcale,
 * a firma zostawała z punktem (0 0), czyli na środku Zatoki Gwinejskiej.
 *
 * Testy pracują na użytkownikach z zasiewu, nie na własnych. Zasiew jest tym,
 * czego używa się przy pracy ręcznej, więc test, który buduje stan własną
 * ścieżką, jest ślepy na jego błędy.
 */
import { and, eq, isNull, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  pobierzFirmeKatalogu,
  pobierzFirmyKatalogu,
  pobierzMojeFirmy,
} from "@/lib/db/queries/katalog";
import {
  opublikujSzkic,
  pobierzSzkicFirmy,
  sprawdzGotowoscSzkicu,
  zapiszKategorieSzkicu,
  zapiszLokalizacjeSzkicu,
  zapiszOpisSzkicu,
  zapiszWeryfikacjeSzkicu,
} from "@/lib/db/queries/kreator";
import { subscriptions } from "@/lib/db/schema/abonament";
import { cities } from "@/lib/db/schema/geografia";
import {
  categories,
  companies,
  companyCategories,
  companyMembers,
  companyVerification,
} from "@/lib/db/schema/katalog";
import { users } from "@/lib/db/schema/tozsamosc";
import { NiezaimplementowanaGalazUprawnien, type Widz } from "@/lib/permissions";

/** Kategoria lokalowa z zasiewu. Ma własny plan, więc publikacja ma cennik. */
const KATEGORIA_LOKALU = "sala-weselna";

/**
 * Miejscowość bez współrzędnych, czyli jedna z 533 nieobecnych w PRNG.
 *
 * Zakładana i usuwana przez ten plik, a nie wstawiana do zasiewu, z jednego
 * konkretnego powodu: wiersz `cities` bez `point` **blokuje cofnięcie migracji
 * 0006**, która przywraca tej kolumnie `not null`. Zostawiony w bazie sprawia,
 * że `pnpm test` nie da się uruchomić drugi raz, bo przygotowanie zestawu
 * zaczyna od cofnięcia wszystkich migracji.
 *
 * Slug celowo nie jest prawdziwym wpisem TERYT, żeby nie wyglądał na dane,
 * których ktoś mógłby szukać w słowniku.
 */
const MIEJSCOWOSC_BEZ_PUNKTU = "test-bez-wspolrzednych";

/** Gałąź uprawnień, której nie ma. Każde zapytanie ma się o nią wyłożyć. */
const MODERATOR: Widz = {
  rodzaj: "moderator",
  userId: "11111111-1111-4111-8111-111111111111",
};

/**
 * Klient z zasiewu, który nie należy do żadnej firmy.
 *
 * Taki człowiek zakłada firmę pierwszym krokiem kreatora. Szukamy go
 * zapytaniem, a nie po adresie e-mail wpisanym na sztywno, żeby zmiana
 * proporcji ról w zasiewie nie wywaliła testu w niezrozumiały sposób.
 */
async function klientBezFirmy(): Promise<Widz> {
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

async function idMiejscowosci(slug: string): Promise<string> {
  const [wiersz] = await db
    .select({ id: cities.id })
    .from(cities)
    .where(eq(cities.slug, slug))
    .limit(1);

  if (!wiersz) throw new Error(`Zasiew nie ma miejscowości ${slug}.`);
  return wiersz.id;
}

/** Miejscowość ze współrzędnymi, czyli taka, na której da się postawić firmę. */
async function idMiejscowosciZPunktem(): Promise<string> {
  const [wiersz] = await db
    .select({ id: cities.id })
    .from(cities)
    .where(sql`${cities.point} is not null`)
    .orderBy(cities.slug)
    .limit(1);

  if (!wiersz) throw new Error("Zasiew nie ma miejscowości ze współrzędnymi.");
  return wiersz.id;
}

/** Współrzędne firmy wprost z bazy. `null`, gdy firma stoi na punkcie zerowym. */
async function wspolrzedneFirmy(companyId: string): Promise<{ lon: number; lat: number } | null> {
  const [wiersz] = await db
    .select({
      lon: sql<number>`st_x(${companies.point}::geometry)`,
      lat: sql<number>`st_y(${companies.point}::geometry)`,
    })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (!wiersz) return null;
  if (wiersz.lon === 0 && wiersz.lat === 0) return null;
  return wiersz;
}

async function kategorieFirmy(companyId: string): Promise<string[]> {
  const wiersze = await db
    .select({ slug: categories.slug })
    .from(companyCategories)
    .innerJoin(categories, eq(categories.id, companyCategories.categoryId))
    .where(and(eq(companyCategories.companyId, companyId), isNull(companyCategories.archivedAt)))
    .orderBy(categories.slug);

  return wiersze.map((w) => w.slug);
}

/**
 * Pełne przejście kreatora do kroku przed publikacją.
 *
 * Zwraca widza i identyfikator firmy, bo kolejne testy potrzebują obu.
 */
async function przejdzKreator(): Promise<{ widz: Widz; companyId: string }> {
  const widz = await klientBezFirmy();

  const kategoria = await zapiszKategorieSzkicu(widz, KATEGORIA_LOKALU);
  if (!kategoria.ok) throw new Error("Krok kategorii odmówił, a nie powinien.");
  const { companyId } = kategoria.dane;

  const opis = await zapiszOpisSzkicu(widz, companyId, {
    nazwa: "Dwór Pod Lipami",
    opis: "Dwór z 1890 roku, sala na 140 osób, park i miejsce na ognisko.",
    cenaOd: 18_000,
    pojemnoscMin: 40,
    pojemnoscMax: 140,
  });
  if (!opis.ok) throw new Error("Krok opisu odmówił, a nie powinien.");

  const lokalizacja = await zapiszLokalizacjeSzkicu(
    widz,
    companyId,
    await idMiejscowosciZPunktem(),
  );
  if (!lokalizacja.ok) throw new Error("Krok lokalizacji odmówił, a nie powinien.");

  const weryfikacja = await zapiszWeryfikacjeSzkicu(widz, companyId, {
    nip: "5260250274",
    telefon: "601234567",
  });
  if (!weryfikacja.ok) throw new Error("Krok weryfikacji odmówił, a nie powinien.");

  return { widz, companyId };
}

/** Data za rok, czyli abonament, który na pewno jeszcze trwa. */
function zaRok(): Date {
  const data = new Date();
  data.setFullYear(data.getFullYear() + 1);
  return data;
}

async function ileAbonamentow(companyId: string): Promise<number> {
  const [wiersz] = await db
    .select({ ile: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(eq(subscriptions.companyId, companyId));
  return wiersz?.ile ?? 0;
}

async function slugFirmy(companyId: string): Promise<string> {
  const [wiersz] = await db
    .select({ slug: companies.slug })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  if (!wiersz) throw new Error("Firma zniknęła w trakcie testu.");
  return wiersz.slug;
}

/**
 * Miejscowość bez współrzędnych istnieje tylko na czas tego pliku.
 *
 * Wstawiana tutaj, a nie w zasiewie, bo wiersz `cities` z `point is null`
 * uniemożliwia cofnięcie migracji 0006 i tym samym drugie uruchomienie
 * zestawu testów.
 */
beforeAll(async () => {
  await db
    .insert(cities)
    .values({
      name: "Testowa Bez Współrzędnych",
      slug: MIEJSCOWOSC_BEZ_PUNKTU,
      powiat: "testowy",
      wojewodztwo: "testowe",
      rodzaj: "część miejscowości",
      point: null,
    })
    .onConflictDoNothing({ target: cities.slug });
});

afterAll(async () => {
  /*
   * Kolejność ma znaczenie: szkic wskazuje miejscowość kluczem obcym, więc
   * dopóki istnieje, usunięcie miejscowości kończy się naruszeniem
   * ograniczenia. Zostawiony wiersz bez współrzędnych blokuje potem cofnięcie
   * migracji 0006 i następne uruchomienie zestawu nie przechodzi
   * przygotowania bazy — awaria w miejscu, które z tym plikiem nie ma
   * nic wspólnego.
   */
  await posprzatajPoSobie();
  await db.delete(cities).where(eq(cities.slug, MIEJSCOWOSC_BEZ_PUNKTU));
});

describe("krok kategorii", () => {
  it("zakłada szkic i zapisuje kategorię do company_categories", async () => {
    const widz = await klientBezFirmy();

    const wynik = await zapiszKategorieSzkicu(widz, KATEGORIA_LOKALU);

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;

    // To jest sedno: kategoria ma być w bazie, nie w komentarzu.
    expect(await kategorieFirmy(wynik.dane.companyId)).toEqual([KATEGORIA_LOKALU]);
  });

  it("dopisuje właściciela do company_members, bo z tego bierze się prawo zapisu", async () => {
    const widz = await klientBezFirmy();
    const wynik = await zapiszKategorieSzkicu(widz, KATEGORIA_LOKALU);
    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;

    const [czlonek] = await db
      .select({ role: companyMembers.role })
      .from(companyMembers)
      .where(eq(companyMembers.companyId, wynik.dane.companyId));

    expect(czlonek?.role).toBe("owner");
  });

  it("drugie przejście kroku nie zakłada drugiej firmy, tylko podmienia kategorię", async () => {
    const widz = await klientBezFirmy();

    const pierwsze = await zapiszKategorieSzkicu(widz, KATEGORIA_LOKALU);
    const drugie = await zapiszKategorieSzkicu(widz, "fotograf");

    expect(pierwsze.ok && drugie.ok).toBe(true);
    if (!pierwsze.ok || !drugie.ok) return;

    expect(drugie.dane.companyId).toBe(pierwsze.dane.companyId);
    expect(await kategorieFirmy(drugie.dane.companyId)).toEqual(["fotograf"]);

    const [ile] = await db
      .select({ ile: sql<number>`count(*)::int` })
      .from(companyMembers)
      .where(eq(companyMembers.userId, widz.rodzaj === "anonim" ? "" : widz.userId));

    expect(ile?.ile).toBe(1);
  });

  it("nie archiwizuje wiersza, tylko ustawia archived_at, bo zasada 5", async () => {
    const widz = await klientBezFirmy();
    const pierwsze = await zapiszKategorieSzkicu(widz, KATEGORIA_LOKALU);
    expect(pierwsze.ok).toBe(true);
    if (!pierwsze.ok) return;

    await zapiszKategorieSzkicu(widz, "fotograf");

    // Zdjęta kategoria zostaje w bazie z datą, a nie znika.
    const wszystkie = await db
      .select({ archivedAt: companyCategories.archivedAt })
      .from(companyCategories)
      .where(eq(companyCategories.companyId, pierwsze.dane.companyId));

    expect(wszystkie).toHaveLength(2);
    expect(wszystkie.filter((w) => w.archivedAt !== null)).toHaveLength(1);
  });

  it("odmawia kategorii spoza słownika, zamiast zakładać firmę bez kategorii", async () => {
    const widz = await klientBezFirmy();

    const wynik = await zapiszKategorieSzkicu(widz, "kategoria-ktorej-nie-ma");

    expect(wynik.ok).toBe(false);
    expect(await pobierzSzkicFirmy(widz)).toBeNull();
  });

  it("odmawia anonimowi, bo nie ma na co zapisać firmy", async () => {
    const wynik = await zapiszKategorieSzkicu({ rodzaj: "anonim" }, KATEGORIA_LOKALU);
    expect(wynik.ok).toBe(false);
  });
});

describe("krok lokalizacji", () => {
  it("zapisuje city_id i współrzędne z wiersza miejscowości", async () => {
    const widz = await klientBezFirmy();
    const szkic = await zapiszKategorieSzkicu(widz, KATEGORIA_LOKALU);
    expect(szkic.ok).toBe(true);
    if (!szkic.ok) return;

    const cityId = await idMiejscowosciZPunktem();
    const wynik = await zapiszLokalizacjeSzkicu(widz, szkic.dane.companyId, cityId);

    expect(wynik.ok).toBe(true);

    const [firma] = await db
      .select({ cityId: companies.cityId })
      .from(companies)
      .where(eq(companies.id, szkic.dane.companyId));

    expect(firma?.cityId).toBe(cityId);

    /*
     * Najważniejsze sprawdzenie w tym pliku: firma nie stoi na (0 0).
     *
     * Punkt zerowy leży w Zatoce Gwinejskiej, więc firma z takim punktem nie
     * wchodzi do żadnego wyszukiwania po promieniu liczonego z Polski,
     * a jednocześnie wygląda w bazie na poprawnie zapisaną.
     */
    const punkt = await wspolrzedneFirmy(szkic.dane.companyId);
    expect(punkt).not.toBeNull();

    const [miejscowosc] = await db
      .select({
        lon: sql<number>`st_x(${cities.point}::geometry)`,
        lat: sql<number>`st_y(${cities.point}::geometry)`,
      })
      .from(cities)
      .where(eq(cities.id, cityId));

    // Współrzędne firmy to współrzędne jej miejscowości, a nie cokolwiek innego.
    expect(punkt?.lon).toBeCloseTo(miejscowosc?.lon ?? Number.NaN, 6);
    expect(punkt?.lat).toBeCloseTo(miejscowosc?.lat ?? Number.NaN, 6);
  });

  it("odmawia miejscowości bez współrzędnych, zamiast stawiać firmę na (0 0)", async () => {
    const widz = await klientBezFirmy();
    const szkic = await zapiszKategorieSzkicu(widz, KATEGORIA_LOKALU);
    expect(szkic.ok).toBe(true);
    if (!szkic.ok) return;

    const wynik = await zapiszLokalizacjeSzkicu(
      widz,
      szkic.dane.companyId,
      await idMiejscowosci(MIEJSCOWOSC_BEZ_PUNKTU),
    );

    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.powod).toBe("miejscowosc-bez-wspolrzednych");

    // Odmowa znaczy „nic nie zapisano”, a nie „zapisano połowę”.
    expect(await wspolrzedneFirmy(szkic.dane.companyId)).toBeNull();
  });

  it("odmawia zapisu do cudzej firmy", async () => {
    const wlasciciel = await klientBezFirmy();
    const szkic = await zapiszKategorieSzkicu(wlasciciel, KATEGORIA_LOKALU);
    expect(szkic.ok).toBe(true);
    if (!szkic.ok) return;

    /*
     * Obcy to inny klient z zasiewu, też bez firmy. Gdyby o wyniku
     * rozstrzygało cokolwiek poza członkostwem, ten test by przeszedł
     * przez przypadek, więc szukamy kogoś, kto różni się tylko tym jednym.
     */
    const [innyUzytkownik] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.role, "client"),
          sql`${users.id} <> ${wlasciciel.rodzaj === "anonim" ? "" : wlasciciel.userId}`,
        ),
      )
      .orderBy(users.email)
      .limit(1);

    if (!innyUzytkownik) throw new Error("Zasiew ma tylko jednego klienta.");
    const obcy: Widz = { rodzaj: "klient", userId: innyUzytkownik.id };

    const wynik = await zapiszLokalizacjeSzkicu(
      obcy,
      szkic.dane.companyId,
      await idMiejscowosciZPunktem(),
    );

    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.powod).toBe("brak-dostepu");
    expect(await wspolrzedneFirmy(szkic.dane.companyId)).toBeNull();
  });
});

describe("krok NIP-u i telefonu", () => {
  it("zapisuje NIP i telefon do company_verification", async () => {
    const widz = await klientBezFirmy();
    const szkic = await zapiszKategorieSzkicu(widz, KATEGORIA_LOKALU);
    expect(szkic.ok).toBe(true);
    if (!szkic.ok) return;

    const wynik = await zapiszWeryfikacjeSzkicu(widz, szkic.dane.companyId, {
      nip: "5260250274",
      telefon: "601234567",
    });

    expect(wynik.ok).toBe(true);

    const [wiersz] = await db
      .select({
        nip: companyVerification.nip,
        telefon: companyVerification.telefon,
        verifiedAt: companyVerification.verifiedAt,
      })
      .from(companyVerification)
      .where(eq(companyVerification.companyId, szkic.dane.companyId));

    expect(wiersz?.nip).toBe("5260250274");
    expect(wiersz?.telefon).toBe("601234567");
    // O weryfikacji rozstrzyga moderacja, nie ten formularz.
    expect(wiersz?.verifiedAt).toBeNull();
  });

  it("powtórne przejście nadpisuje wiersz, a nie dokłada drugiego", async () => {
    const widz = await klientBezFirmy();
    const szkic = await zapiszKategorieSzkicu(widz, KATEGORIA_LOKALU);
    expect(szkic.ok).toBe(true);
    if (!szkic.ok) return;

    await zapiszWeryfikacjeSzkicu(widz, szkic.dane.companyId, {
      nip: "5260250274",
      telefon: "601234567",
    });
    await zapiszWeryfikacjeSzkicu(widz, szkic.dane.companyId, {
      nip: "1070034498",
      telefon: "602222222",
    });

    const wiersze = await db
      .select({ nip: companyVerification.nip })
      .from(companyVerification)
      .where(eq(companyVerification.companyId, szkic.dane.companyId));

    expect(wiersze).toHaveLength(1);
    expect(wiersze[0]?.nip).toBe("1070034498");
  });
});

describe("publikacja", () => {
  it("nie publikuje szkicu bez lokalizacji, kategorii ani NIP-u", async () => {
    const widz = await klientBezFirmy();
    const szkic = await zapiszKategorieSzkicu(widz, KATEGORIA_LOKALU);
    expect(szkic.ok).toBe(true);
    if (!szkic.ok) return;

    const gotowosc = await sprawdzGotowoscSzkicu(widz);
    expect(gotowosc.ok).toBe(true);
    if (!gotowosc.ok) return;

    // Kategoria jest, resztę trzeba jeszcze uzupełnić.
    expect(gotowosc.dane.braki).toContain("nazwa");
    expect(gotowosc.dane.braki).toContain("opis");
    expect(gotowosc.dane.braki).toContain("lokalizacja");
    expect(gotowosc.dane.braki).toContain("nip");
    expect(gotowosc.dane.braki).not.toContain("kategoria");
  });

  it("po komplecie danych nie zgłasza braków", async () => {
    const { widz } = await przejdzKreator();

    const gotowosc = await sprawdzGotowoscSzkicu(widz);
    expect(gotowosc.ok).toBe(true);
    if (!gotowosc.ok) return;
    expect(gotowosc.dane.braki).toEqual([]);
  });

  it("publikacja daje status active i abonament z planem swojej kategorii", async () => {
    const { widz, companyId } = await przejdzKreator();

    const zaMiesiac = new Date();
    zaMiesiac.setDate(zaMiesiac.getDate() + 30);

    const wynik = await opublikujSzkic(widz, companyId, zaMiesiac);
    expect(wynik.ok).toBe(true);

    const [firma] = await db
      .select({ status: companies.status })
      .from(companies)
      .where(eq(companies.id, companyId));

    expect(firma?.status).toBe("active");

    /*
     * Plan musi należeć do kategorii tej firmy.
     *
     * Wcześniej wpisywany był tu zerowy UUID, co naruszało klucz obcy
     * i wywalało publikację pięćsetką na ostatnim kliknięciu kreatora.
     */
    const [abonament] = await db
      .select({ planKategoria: categories.slug })
      .from(subscriptions)
      .innerJoin(
        categories,
        sql`${categories.id} = (select category_id from plans where id = ${subscriptions.planId})`,
      )
      .where(eq(subscriptions.companyId, companyId));

    expect(abonament?.planKategoria).toBe(KATEGORIA_LOKALU);
  });
});

describe("wznowienie po odświeżeniu strony", () => {
  it("pobierzSzkicFirmy oddaje to, co zapisały wcześniejsze kroki", async () => {
    const { widz } = await przejdzKreator();

    const szkic = await pobierzSzkicFirmy(widz);

    expect(szkic).not.toBeNull();
    expect(szkic?.nazwa).toBe("Dwór Pod Lipami");
    expect(szkic?.kategoria).toBe(KATEGORIA_LOKALU);
    expect(szkic?.maWspolrzedne).toBe(true);
    expect(szkic?.maNip).toBe(true);
    expect(szkic?.miejscowosc).not.toBeNull();
  });

  it("szkic bez lokalizacji nie podaje miejscowości, bo żadnej nie wybrano", async () => {
    const widz = await klientBezFirmy();
    await zapiszKategorieSzkicu(widz, KATEGORIA_LOKALU);

    const szkic = await pobierzSzkicFirmy(widz);

    expect(szkic?.maWspolrzedne).toBe(false);
    // Wiersz w city_id istnieje tylko po to, żeby wypełnić kolumnę not null.
    expect(szkic?.miejscowosc).toBeNull();
  });

  it("nie widzi szkicu innego użytkownika", async () => {
    const widz = await klientBezFirmy();
    await zapiszKategorieSzkicu(widz, KATEGORIA_LOKALU);

    /*
     * Test negatywny wymaga instancji pozytywnej gdzie indziej: szkic
     * **istnieje**, tylko nie należy do pytającego. Bez tego „nikt nie ma
     * szkicu” i „ten nie ma szkicu” dałyby ten sam wynik.
     */
    const inny = await klientBezFirmy();
    expect(await pobierzSzkicFirmy(inny)).toBeNull();
  });

  it("po publikacji oddaje firmę do poprawek, ze stanem active", async () => {
    const { widz, companyId } = await przejdzKreator();
    await opublikujSzkic(widz, companyId, zaRok());

    // Ten sam kreator służy do poprawek opublikowanego profilu.
    const szkic = await pobierzSzkicFirmy(widz);
    expect(szkic?.id).toBe(companyId);
    expect(szkic?.status).toBe("active");
  });

  it("nie oddaje firmy zawieszonej, bo jej poprawki nie są sprawą kreatora", async () => {
    const { widz, companyId } = await przejdzKreator();
    await db.update(companies).set({ status: "suspended" }).where(eq(companies.id, companyId));

    expect(await pobierzSzkicFirmy(widz)).toBeNull();
  });
});

describe("domyślna odmowa", () => {
  /*
   * Gałąź moderatora nie jest zaimplementowana w lib/permissions.ts, więc
   * każde zapytanie kreatora ma się o niego wyłożyć wyjątkiem. To samo
   * sprawdza tests/konwencja-zapytan.test.ts dla wszystkich eksportów modułu;
   * tutaj nazywamy wprost te, na których stoi zapis.
   */
  it("każdy krok rzuca na widzu bez zaimplementowanej gałęzi", async () => {
    await expect(zapiszKategorieSzkicu(MODERATOR, KATEGORIA_LOKALU)).rejects.toBeInstanceOf(
      NiezaimplementowanaGalazUprawnien,
    );
    await expect(pobierzSzkicFirmy(MODERATOR)).rejects.toBeInstanceOf(
      NiezaimplementowanaGalazUprawnien,
    );
    await expect(sprawdzGotowoscSzkicu(MODERATOR)).rejects.toBeInstanceOf(
      NiezaimplementowanaGalazUprawnien,
    );
  });
});

describe("slug", () => {
  it("powstaje z nazwy, bez polskich znaków", async () => {
    const widz = await klientBezFirmy();
    const szkic = await zapiszKategorieSzkicu(widz, KATEGORIA_LOKALU);
    expect(szkic.ok).toBe(true);
    if (!szkic.ok) return;

    const wynik = await zapiszOpisSzkicu(widz, szkic.dane.companyId, {
      nazwa: "Łąka Pod Żurawiem",
      opis: "Łąka nad rzeką, miejsce na namiot i ognisko, dojazd drogą gruntową.",
      cenaOd: null,
      pojemnoscMin: null,
      pojemnoscMax: null,
    });

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;
    expect(wynik.dane.slug).toBe("laka-pod-zurawiem");
  });

  it("druga firma o tej samej nazwie dostaje slug z licznikiem, a nie błąd", async () => {
    const dane = {
      nazwa: "Stodoła Nad Stawem",
      opis: "Stodoła z bali, sala na sto osób, staw i pomost na zdjęcia.",
      cenaOd: null,
      pojemnoscMin: null,
      pojemnoscMax: null,
    };

    const pierwszy = await klientBezFirmy();
    const szkicA = await zapiszKategorieSzkicu(pierwszy, KATEGORIA_LOKALU);
    expect(szkicA.ok).toBe(true);
    if (!szkicA.ok) return;
    const wynikA = await zapiszOpisSzkicu(pierwszy, szkicA.dane.companyId, dane);

    // Pierwsza firma musi wyjść ze stanu draft, inaczej drugi klient bez firmy
    // byłby tą samą osobą co pierwszy i test nie sprawdzałby kolizji.
    await db
      .update(companies)
      .set({ status: "active" })
      .where(eq(companies.id, szkicA.dane.companyId));

    const drugi = await klientBezFirmy();
    const szkicB = await zapiszKategorieSzkicu(drugi, KATEGORIA_LOKALU);
    expect(szkicB.ok).toBe(true);
    if (!szkicB.ok) return;
    const wynikB = await zapiszOpisSzkicu(drugi, szkicB.dane.companyId, dane);

    expect(wynikA.ok && wynikB.ok).toBe(true);
    if (!wynikA.ok || !wynikB.ok) return;

    expect(wynikA.dane.slug).toBe("stodola-nad-stawem");
    expect(wynikB.dane.slug).toBe("stodola-nad-stawem-2");
  });
});

/**
 * Każdy test zaczyna od stanu, w którym klient z zasiewu nie ma firmy.
 *
 * Testy zakładają firmy, więc bez tego drugi test w pliku dostawał innego
 * klienta niż pierwszy, a dziesiąty nie dostawał już żadnego. Sprzątamy
 * **tylko po sobie**: szkice utworzone przez ten plik, rozpoznawane po
 * prefiksie sluga albo po nazwach, których zasiew nie używa.
 */
/**
 * Usuwa firmy założone przez ten plik.
 *
 * Rozpoznajemy je po slugu, a nie po „wszystko, co jest draftem”: zasiew ma
 * własne szkice i wizytówki, a test, który je sprząta, psuje pozostałe pliki.
 */
async function posprzatajPoSobie(): Promise<void> {
  const nasze = await db
    .select({ id: companies.id })
    .from(companies)
    .where(sql`${companies.slug} like 'szkic-%' or ${companies.slug} like 'stodola-nad-stawem%'
      or ${companies.slug} like 'laka-pod-zurawiem%' or ${companies.slug} like 'dwor-pod-lipami%'`);

  for (const firma of nasze) {
    /*
     * Jedyne twarde usuwanie w tym projekcie poza runnerem migracji, i to
     * wyłącznie w teście, na danych, które ten sam test właśnie utworzył.
     * Zasada 5 dotyczy kodu aplikacji: dane biznesowe nie znikają z bazy
     * przez działanie serwisu. Sprzątanie po teście nią nie jest.
     */
    await db.delete(subscriptions).where(eq(subscriptions.companyId, firma.id));
    await db.delete(companyVerification).where(eq(companyVerification.companyId, firma.id));
    await db.delete(companyCategories).where(eq(companyCategories.companyId, firma.id));
    await db.delete(companyMembers).where(eq(companyMembers.companyId, firma.id));
    await db.delete(companies).where(eq(companies.id, firma.id));
  }
}

/** Każdy test zaczyna od stanu, w którym klient z zasiewu nie ma firmy. */
beforeEach(posprzatajPoSobie);

describe("poprawki opublikowanego profilu", () => {
  it("ponowna publikacja nie dokłada drugiego abonamentu", async () => {
    const { widz, companyId } = await przejdzKreator();
    await opublikujSzkic(widz, companyId, zaRok());
    await opublikujSzkic(widz, companyId, zaRok());

    expect(await ileAbonamentow(companyId)).toBe(1);
  });

  it("zmiana nazwy opublikowanej firmy nie zmienia adresu profilu", async () => {
    const { widz, companyId } = await przejdzKreator();
    await opublikujSzkic(widz, companyId, zaRok());
    const przed = await slugFirmy(companyId);

    const wynik = await zapiszOpisSzkicu(widz, companyId, {
      nazwa: "Stodoła nad Stawem",
      opis: "Nowa nazwa, ten sam obiekt i ten sam adres profilu w katalogu.",
      cenaOd: 18_000,
      pojemnoscMin: 40,
      pojemnoscMax: 140,
    });

    expect(wynik.ok).toBe(true);
    // Decyzja 005: slug jest niezmienny, bo linki do profilu krążą poza serwisem.
    expect(await slugFirmy(companyId)).toBe(przed);
  });
});

/**
 * Katalog: kto jest widoczny dla klientów.
 *
 * Reguła: w katalogu jest firma `active` z abonamentem, który jeszcze trwa.
 * Każdy test negatywny ma obok siebie firmę, która w katalogu jest, żeby
 * „nikogo nie ma” i „tej nie ma” nie dawały tego samego wyniku.
 */
describe("katalog", () => {
  const ANONIM: Widz = { rodzaj: "anonim" };

  it("szkicu nie ma w katalogu, opublikowana firma jest", async () => {
    const szkic = await przejdzKreator();
    const slugSzkicu = await slugFirmy(szkic.companyId);

    expect(await pobierzFirmeKatalogu(ANONIM, slugSzkicu)).toBeNull();

    await opublikujSzkic(szkic.widz, szkic.companyId, zaRok());
    const opublikowana = await pobierzFirmeKatalogu(ANONIM, slugSzkicu);

    expect(opublikowana?.nazwa).toBe("Dwór Pod Lipami");
    expect(opublikowana?.kategoria).toBe(KATEGORIA_LOKALU);
    expect(opublikowana?.pojemnoscMin).toBe(40);
    expect(opublikowana?.pojemnoscMax).toBe(140);
    expect(opublikowana?.szerokosc).not.toBeNull();
  });

  it("firma po wygaśnięciu abonamentu znika z katalogu, a druga z ważnym zostaje", async () => {
    const pierwsza = await przejdzKreator();
    await opublikujSzkic(pierwsza.widz, pierwsza.companyId, zaRok());

    const druga = await przejdzKreator();
    await opublikujSzkic(druga.widz, druga.companyId, zaRok());

    await db
      .update(subscriptions)
      .set({ expiresAt: new Date("2020-01-01T00:00:00Z") })
      .where(eq(subscriptions.companyId, pierwsza.companyId));

    const lista = await pobierzFirmyKatalogu(ANONIM, [KATEGORIA_LOKALU]);
    const slugi = lista.map((f) => f.slug);

    expect(slugi).toContain(await slugFirmy(druga.companyId));
    expect(slugi).not.toContain(await slugFirmy(pierwsza.companyId));
  });

  it("firma zawieszona znika z katalogu mimo ważnego abonamentu", async () => {
    const zawieszona = await przejdzKreator();
    await opublikujSzkic(zawieszona.widz, zawieszona.companyId, zaRok());
    const widoczna = await przejdzKreator();
    await opublikujSzkic(widoczna.widz, widoczna.companyId, zaRok());

    await db
      .update(companies)
      .set({ status: "suspended" })
      .where(eq(companies.id, zawieszona.companyId));

    const slugi = (await pobierzFirmyKatalogu(ANONIM, [KATEGORIA_LOKALU])).map((f) => f.slug);
    expect(slugi).toContain(await slugFirmy(widoczna.companyId));
    expect(slugi).not.toContain(await slugFirmy(zawieszona.companyId));
  });

  it("lista lokali nie podaje firmy z kategorią usługodawcy i odwrotnie", async () => {
    const { widz, companyId } = await przejdzKreator();
    await opublikujSzkic(widz, companyId, zaRok());
    const slug = await slugFirmy(companyId);

    const lokale = await pobierzFirmyKatalogu(ANONIM, [KATEGORIA_LOKALU]);
    const fotografowie = await pobierzFirmyKatalogu(ANONIM, ["fotograf"]);

    expect(lokale.map((f) => f.slug)).toContain(slug);
    expect(fotografowie.map((f) => f.slug)).not.toContain(slug);
  });

  it("panel pokazuje właścicielowi jego firmy, a obcemu nic z nich", async () => {
    const wlasciciel = await przejdzKreator();
    const slug = await slugFirmy(wlasciciel.companyId);

    const mojeSzkic = await pobierzMojeFirmy(wlasciciel.widz);
    expect(mojeSzkic.find((f) => f.slug === slug)).toMatchObject({
      status: "draft",
      wKatalogu: false,
    });

    await opublikujSzkic(wlasciciel.widz, wlasciciel.companyId, zaRok());
    const mojePo = await pobierzMojeFirmy(wlasciciel.widz);
    expect(mojePo.find((f) => f.slug === slug)).toMatchObject({
      status: "active",
      wKatalogu: true,
    });

    const obcy = await klientBezFirmy();
    expect((await pobierzMojeFirmy(obcy)).map((f) => f.slug)).not.toContain(slug);
    expect(await pobierzMojeFirmy(ANONIM)).toEqual([]);
  });
});

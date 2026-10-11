/**
 * Endpoint podpowiedzi miejscowości: /api/miejscowosci?q=
 *
 * Reguła biznesowa: **podpowiedź musi nieść identyfikator miejscowości**.
 * Bez niego formularz nie ma czym wypełnić `companies.city_id`, firma zostaje
 * bez lokalizacji i nie pojawia się w wyszukiwaniu po okolicy. Wcześniej
 * endpoint czytał z content/miejscowosci.json.gz, gdzie żadnych identyfikatorów
 * nie ma, bo plik powstaje z danych TERYT przed zasiewem bazy.
 *
 * Druga reguła, równie ważna: przeniesienie do bazy **nie miało pogorszyć
 * dopasowania**. To samo pole obsługuje wyszukiwarkę katalogu, więc „lodz"
 * nadal ma znajdować „Łódź", a fragment w środku nazwy nadal ma trafiać.
 *
 * Testy pracują na miejscowościach z zasiewu.
 */
import { like } from "drizzle-orm";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/miejscowosci/route";
import { db } from "@/lib/db";
import { cities } from "@/lib/db/schema/geografia";
import { PODPOWIEDZI } from "@/lib/miejscowosci";

/** Nazwa, której zasiew nie używa, więc dopasuje wyłącznie wiersze tego testu. */
const FRAZA_LIMITU = "Limitowo";

/** Jak wyżej, dla testu kolejności. Osobna, żeby testy sobie nie mieszały. */
const FRAZA_KOLEJNOSCI = "Kolejnosc";

type Podpowiedz = {
  id: string;
  slug: string;
  nazwa: string;
  rodzaj: string | null;
  gmina: string | null;
  powiat: string | null;
};

async function podpowiedzi(fraza: string): Promise<Podpowiedz[]> {
  const odpowiedz = await GET(
    new NextRequest(`http://localhost:3000/api/miejscowosci?q=${encodeURIComponent(fraza)}`),
  );
  return (await odpowiedz.json()) as Podpowiedz[];
}

/** Czy to w ogóle wygląda na UUID. Odróżnia identyfikator od sluga. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("identyfikator miejscowości", () => {
  it("każda podpowiedź ma cityId, bo bez niego nie ma czym zapisać lokalizacji", async () => {
    const wyniki = await podpowiedzi("Warsz");

    expect(wyniki.length).toBeGreaterThan(0);
    for (const wynik of wyniki) {
      expect(wynik.id, `podpowiedź ${wynik.nazwa} bez identyfikatora`).toMatch(UUID);
    }
  });

  it("identyfikator wskazuje na ten sam wiersz, co slug", async () => {
    const [warszawa] = await podpowiedzi("Warszawa");
    expect(warszawa?.slug).toBe("warszawa");

    // Ten sam wiersz zapytany drugi raz oddaje ten sam identyfikator.
    const [znowu] = await podpowiedzi("Warszawa");
    expect(znowu?.id).toBe(warszawa?.id);
  });
});

describe("dopasowanie takie jak w pliku, z którego to przeniesiono", () => {
  it("pomija polskie znaki, więc „lodz” znajduje „Łódź”", async () => {
    const wyniki = await podpowiedzi("lodz");
    expect(wyniki.map((w) => w.nazwa)).toContain("Łódź");
  });

  it("w drugą stronę też: „Łódź” znajduje „Łódź”", async () => {
    const wyniki = await podpowiedzi("Łódź");
    expect(wyniki.map((w) => w.nazwa)).toContain("Łódź");
  });

  it("dopasowuje fragment w środku nazwy, nie tylko początek", async () => {
    /*
     * „rard" leży w środku „Żyrardów" i nie jest jego początkiem, więc
     * dopasowanie po prefiksie tego nie znajdzie. Plik znajdował, bo szukał
     * fragmentu, i to zachowanie ma zostać.
     */
    const wyniki = await podpowiedzi("rard");
    expect(wyniki.map((w) => w.slug)).toContain("zyrardow");
  });

  it("fragment w środku działa też z polskimi znakami wpisanymi wprost", async () => {
    // „yrardó" z ogonkiem: fragment, nie prefiks, i z polskim znakiem.
    const wyniki = await podpowiedzi("yrardó");
    expect(wyniki.map((w) => w.slug)).toContain("zyrardow");
  });

  /*
   * Kolejność sprawdzamy na parze miejscowości ustawionej **przeciwnie** do
   * reguły, którą badamy.
   *
   * Zasiew ma sześć miast i żadna fraza nie trafia w nich jednocześnie
   * w początek jednej nazwy i w środek drugiej, więc „gda" oddawało Gdańsk
   * na pierwszym miejscu niezależnie od sortowania. O wyniku musi rozstrzygać
   * wyłącznie badane kryterium, więc pozostałe dwa wskazują tu odwrotnie:
   *
   *   trafienie od początku  →  rodzaj o najgorszej wadze, nazwa najdłuższa
   *   trafienie w środku     →  rodzaj o najlepszej wadze, nazwa najkrótsza
   *
   * Jeśli promowanie trafień od początku zniknie, wygra to drugie.
   */
  it("trafienie od początku nazwy idzie przed trafieniem w środku", async () => {
    await db.insert(cities).values([
      {
        name: `${FRAZA_KOLEJNOSCI} Wielka Bardzo Długa Nazwa`,
        slug: "kolejnosc-od-poczatku",
        powiat: "testowy",
        wojewodztwo: "testowe",
        // Najgorsza waga rodzaju: gdyby decydowała ona, ten wiersz byłby ostatni.
        rodzaj: "część miejscowości",
        point: { lon: 21, lat: 52 },
      },
      {
        name: `X${FRAZA_KOLEJNOSCI}`,
        slug: "kolejnosc-w-srodku",
        powiat: "testowy",
        wojewodztwo: "testowe",
        // Najlepsza waga rodzaju i najkrótsza nazwa, czyli dwa kryteria za nim.
        rodzaj: "miasto",
        point: { lon: 21, lat: 52 },
      },
    ]);

    try {
      const wyniki = await podpowiedzi(FRAZA_KOLEJNOSCI);

      expect(wyniki.map((w) => w.slug)).toContain("kolejnosc-w-srodku");
      expect(wyniki[0]?.slug).toBe("kolejnosc-od-poczatku");
    } finally {
      await db.delete(cities).where(like(cities.slug, "kolejnosc-%"));
    }
  });
});

describe("kształt odpowiedzi", () => {
  it("na jeden znak nie pyta bazy i oddaje pustą listę", async () => {
    expect(await podpowiedzi("w")).toEqual([]);
    expect(await podpowiedzi("")).toEqual([]);
  });

  /*
   * Limit sprawdzamy na własnych miejscowościach, a nie na zasiewie.
   *
   * Zasiew ma sześć miast, czyli mniej niż limit, więc „nie więcej niż osiem"
   * było prawdą niezależnie od kodu: ten test przechodził także po usunięciu
   * `.limit()` z zapytania. Test, który przechodzi zawsze, kosztuje tyle samo
   * czasu i daje fałszywe poczucie pokrycia, więc musi mieć na czym paść.
   */
  it("oddaje nie więcej niż tyle podpowiedzi, ile się mieści pod polem", async () => {
    const ile = PODPOWIEDZI + 3;

    await db.insert(cities).values(
      Array.from({ length: ile }, (_, i) => ({
        name: `${FRAZA_LIMITU} ${i + 1}`,
        slug: `${FRAZA_LIMITU.toLowerCase()}-${i + 1}`,
        powiat: "testowy",
        wojewodztwo: "testowe",
        rodzaj: "wieś",
        point: { lon: 21, lat: 52 },
      })),
    );

    try {
      const wyniki = await podpowiedzi(FRAZA_LIMITU);

      // Pasuje więcej, niż wolno oddać, więc limit ma się na czym pokazać.
      expect(wyniki.length).toBe(PODPOWIEDZI);
    } finally {
      await db.delete(cities).where(like(cities.slug, `${FRAZA_LIMITU.toLowerCase()}-%`));
    }
  });

  it("podaje gminę i powiat, bo „Nowa Wieś” występuje ponad trzysta razy", async () => {
    const [pierwsza] = await podpowiedzi("Warszawa");
    expect(pierwsza?.powiat).toBeTruthy();
    expect(pierwsza?.gmina).toBeTruthy();
  });

  it("nie wywala się na apostrofie ani na procencie w zapytaniu", async () => {
    // Znaki specjalne SQL i wzorca LIKE. Mają nie znaleźć nic i nie rzucić.
    await expect(podpowiedzi("o'brien")).resolves.toEqual([]);
    const procent = await podpowiedzi("%%");
    expect(Array.isArray(procent)).toBe(true);
  });
});

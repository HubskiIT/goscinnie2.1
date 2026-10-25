/**
 * Zdjęcia firmy: obróbka pliku i przypisanie do profilu.
 *
 * REGUŁY BIZNESOWE TEGO PLIKU:
 *
 * 1. firma ma najwyżej dziesięć zdjęć, a zdjęcie na pozycji zero jest tym
 *    z karty w katalogu;
 * 2. zdjęcia zmienia wyłącznie członek **tej** firmy;
 * 3. usunięcie zdjęcia to archiwizacja, nie skasowanie wiersza (zasada 5),
 *    a zwolniona pozycja wraca do użytku;
 * 4. z pliku znikają metadane, w tym współrzędne GPS — zdjęcie sali z telefonu
 *    niesie zwykle dokładną pozycję, a firmom pokazujemy powiat.
 *
 * Wymaga działającej bazy z zasiewem.
 */
import { and, eq, isNull, sql } from "drizzle-orm";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { dodajZdjecie, pobierzZdjeciaFirmy, usunZdjecie } from "@/lib/db/queries/zdjecia";
import { companyMembers, companyPhotos } from "@/lib/db/schema/katalog";
import { NiezaimplementowanaGalazUprawnien, type Widz } from "@/lib/permissions";
import { MAKS_BAJTOW, MAKS_BOK, MAKS_ZDJEC } from "@/lib/zdjecia/granice";
import { przygotujZdjecie } from "@/lib/zdjecia/obrobka";

const ANONIM: Widz = { rodzaj: "anonim" };
const MODERATOR: Widz = { rodzaj: "moderator", userId: "11111111-1111-4111-8111-111111111111" };

/** Zdjęcia dopisane przez ten plik. Po nich sprzątamy. */
const UTWORZONE: string[] = [];

/** Prawdziwy plik JPEG o zadanych wymiarach. */
async function jpeg(szerokosc: number, wysokosc: number): Promise<Buffer> {
  return sharp({
    create: {
      width: szerokosc,
      height: wysokosc,
      channels: 3,
      background: { r: 120, g: 90, b: 60 },
    },
  })
    .jpeg()
    .toBuffer();
}

/**
 * Czy blok EXIF zawiera wskaźnik na współrzędne GPS.
 *
 * Tag 0x8825 wskazuje blok GPS. Szukamy go po bajtach, bo `metadata()` oddaje
 * EXIF jako surowy bufor, a dociąganie czytnika EXIF-u dla jednego testu
 * byłoby nową zależnością.
 */
function maWskaznikGps(exif: Buffer | undefined): boolean {
  if (!exif) return false;

  for (let i = 0; i + 1 < exif.length; i += 1) {
    // Zapis little-endian, czyli młodszy bajt pierwszy.
    if (exif[i] === 0x25 && exif[i + 1] === 0x88) return true;
  }
  return false;
}

/**
 * Dwie firmy z zasiewu wraz z ich członkami. Na nich stoi cały plik.
 *
 * `pominCompanyId` odrzuca nie tylko tę firmę, ale **wszystkie firmy jej
 * członków**, i to jest sedno tego pomocnika.
 *
 * Zasiew ma ludzi należących do dwóch firm naraz, celowo, bo bez nich cała
 * klasa błędów w rozpoznawaniu widza jest niewidoczna. Przy samym porównaniu
 * `companyId !== pominCompanyId` zdarzało się, że „obca” firma była drugą
 * firmą tego samego człowieka. Wtedy dostęp był słusznie przyznany, a test
 * „członek jednej firmy nie dodaje zdjęcia innej” padał bez winy kodu.
 *
 * Padał w losowych przebiegach, bo identyfikatory firm są losowe przy każdym
 * zasiewie, więc `order by company_id` daje za każdym razem inną kolejność.
 * To nie jest usterka tej zmiany: tak samo zachowywał się ten plik wcześniej,
 * tylko rzadziej trafiał na pechową kolejność.
 *
 * ODDAJE WYŁĄCZNIE FIRMĘ BEZ ZDJĘĆ Z ZASIEWU. Testy korzystające z tego
 * pomocnika archiwizują zdjęcia przez `wyczysc` i dopisują swoje, więc muszą
 * dostać firmę, którą wolno dowolnie zmieniać. Bez tego warunku wylosowanie
 * firmy ze zdjęciami zasiewu kasowało stan, na którym stoi blok „zdjęcia
 * z zasiewu”, i trzy testy padały w co drugim przebiegu. Warunek siedzi tutaj,
 * a nie w kolejności testów w pliku, bo kolejność rozjedzie się przy pierwszym
 * dopisanym bloku i nikt tego nie zauważy.
 */
async function firmaZCzlonkiem(pominCompanyId?: string) {
  const wiersze = await db
    .select({ companyId: companyMembers.companyId, userId: companyMembers.userId })
    .from(companyMembers)
    .orderBy(companyMembers.companyId);

  // Ludzie, którzy mają cokolwiek do powiedzenia w pomijanej firmie.
  const zPominanej = new Set(
    wiersze.filter((w) => w.companyId === pominCompanyId).map((w) => w.userId),
  );

  const zeZdjeciamiZasiewu = new Set(
    (
      await db
        .selectDistinct({ companyId: companyPhotos.companyId })
        .from(companyPhotos)
        .where(sql`${companyPhotos.path} like '%zasiew-%'`)
    ).map((w) => w.companyId),
  );

  const wiersz = wiersze.find(
    (w) =>
      w.companyId !== pominCompanyId &&
      !zPominanej.has(w.userId) &&
      !zeZdjeciamiZasiewu.has(w.companyId),
  );
  if (!wiersz) throw new Error("Zasiew nie ma dość firm z członkami, a na nich stoi ten plik.");

  const widz: Widz = {
    rodzaj: "firma",
    userId: wiersz.userId,
    companyId: wiersz.companyId,
    abonament: true,
  };
  return { widz, companyId: wiersz.companyId };
}

async function zapamietaj(id: string): Promise<string> {
  UTWORZONE.push(id);
  return id;
}

afterAll(async () => {
  for (const id of UTWORZONE) await db.delete(companyPhotos).where(eq(companyPhotos.id, id));
});

describe("obróbka pliku", () => {
  it("skaluje długi bok do granicy i oddaje WebP", async () => {
    const wynik = await przygotujZdjecie(await jpeg(4000, 3000), "image/jpeg");

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;

    expect(wynik.zdjecie.szerokosc).toBe(MAKS_BOK);
    // Proporcje zachowane: 4000x3000 to 4:3, więc 1600 daje 1200.
    expect(wynik.zdjecie.wysokosc).toBe(1200);

    const rozpoznane = await sharp(wynik.zdjecie.dane).metadata();
    expect(rozpoznane.format).toBe("webp");
  });

  it("małego zdjęcia nie powiększa", async () => {
    // Powiększanie dokłada bajtów i nie dokłada szczegółów.
    const wynik = await przygotujZdjecie(await jpeg(400, 300), "image/jpeg");

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;
    expect(wynik.zdjecie.szerokosc).toBe(400);
  });

  it("obraca zdjęcie według znacznika orientacji z telefonu", async () => {
    /*
     * Telefon trzymany pionowo zapisuje piksele poziomo i dokłada znacznik
     * „obróć o 90 stopni”. Znacznik ginie przy zapisie razem z resztą
     * metadanych, więc obrócić trzeba piksele — inaczej zdjęcie sali leży
     * na boku na karcie w katalogu.
     */
    const pionowe = await sharp({
      create: { width: 900, height: 600, channels: 3, background: { r: 9, g: 9, b: 9 } },
    })
      // Orientacja nie jest zwykłym polem EXIF: `withExif` jej nie zapisze,
      // bo sharp trzyma ją osobno. Sprawdzone, oba warianty dawały 1.
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();

    // Atrapa musi nieść znacznik, inaczej test nie mierzyłby niczego.
    expect((await sharp(pionowe).metadata()).orientation).toBe(6);

    const wynik = await przygotujZdjecie(pionowe, "image/jpeg");

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;
    // Po obróceniu dłuższy bok jest pionowy: 900x600 staje się 600x900.
    expect(wynik.zdjecie.szerokosc).toBe(600);
    expect(wynik.zdjecie.wysokosc).toBe(900);
  });

  it("zdejmuje metadane, w tym współrzędne GPS", async () => {
    /*
     * Reguła o prywatności, nie o wadze pliku. Metadane znikają, bo sharp
     * ich domyślnie nie przepisuje — ten test pilnuje, żeby nikt nie dopisał
     * `withMetadata()` w dobrej wierze, chcąc zachować datę zrobienia zdjęcia.
     * Sprawdzone: dopisanie go wywala właśnie ten test.
     */
    const zGps = await sharp({
      create: { width: 800, height: 600, channels: 3, background: { r: 1, g: 2, b: 3 } },
    })
      .withExif({
        IFD0: { Copyright: "Gościnnie" },
        // Blok GPS to w libvips IFD3, nie osobne „GPS". Współrzędne mniej
        // więcej placu Zamkowego, byle dały się odczytać z pliku.
        IFD3: { GPSLatitudeRef: "N", GPSLatitude: "52/1 14/1 0/1" },
      })
      .jpeg()
      .toBuffer();

    /*
     * Atrapa musi naprawdę nieść współrzędne. Bez tego sprawdzenia test
     * przeszedłby także wtedy, gdyby `withExif` przestało je zapisywać —
     * a wtedy „na wyjściu nie ma metadanych" znaczyłoby tylko, że na wejściu
     * ich nie było.
     */
    const exifAtrapy = (await sharp(zGps).metadata()).exif;
    expect(exifAtrapy).toBeDefined();
    expect(maWskaznikGps(exifAtrapy)).toBe(true);

    const wynik = await przygotujZdjecie(zGps, "image/jpeg");

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;

    const rozpoznane = await sharp(wynik.zdjecie.dane).metadata();
    expect(rozpoznane.exif).toBeUndefined();
  });

  it("odrzuca format spoza listy", async () => {
    const wynik = await przygotujZdjecie(Buffer.from("cokolwiek"), "application/pdf");

    expect(wynik).toEqual({ ok: false, powod: "typ" });
  });

  it("odrzuca plik cięższy niż granica", async () => {
    const zaDuzy = Buffer.alloc(MAKS_BAJTOW + 1);

    expect(await przygotujZdjecie(zaDuzy, "image/jpeg")).toEqual({ ok: false, powod: "rozmiar" });
  });

  it("odrzuca plik, który podaje się za zdjęcie, a nim nie jest", async () => {
    // Poprawny typ w nagłówku, śmieci w środku. Odmowa, nie wyjątek.
    const wynik = await przygotujZdjecie(Buffer.from("to nie jest obrazek"), "image/jpeg");

    expect(wynik).toEqual({ ok: false, powod: "nieczytelne" });
  });
});

describe("kto może zmieniać zdjęcia", () => {
  it("anonim nie może dodać zdjęcia", async () => {
    const { companyId } = await firmaZCzlonkiem();

    const wynik = await dodajZdjecie(ANONIM, companyId, {
      sciezka: "x/0.webp",
      szerokosc: 10,
      wysokosc: 10,
      kluczWysylki: crypto.randomUUID(),
    });

    expect(wynik).toEqual({ ok: false, powod: "brak-dostepu" });
  });

  it("moderator rzuca, bo jego gałęzi uprawnień nie napisano", async () => {
    const { companyId } = await firmaZCzlonkiem();

    await expect(
      dodajZdjecie(MODERATOR, companyId, {
        sciezka: "x/0.webp",
        szerokosc: 10,
        wysokosc: 10,
        kluczWysylki: crypto.randomUUID(),
      }),
    ).rejects.toBeInstanceOf(NiezaimplementowanaGalazUprawnien);
  });

  it("członek jednej firmy nie dodaje zdjęcia innej", async () => {
    const swoja = await firmaZCzlonkiem();
    const obca = await firmaZCzlonkiem(swoja.companyId);

    const wynik = await dodajZdjecie(swoja.widz, obca.companyId, {
      sciezka: "obca/0.webp",
      szerokosc: 10,
      wysokosc: 10,
      kluczWysylki: crypto.randomUUID(),
    });

    expect(wynik).toEqual({ ok: false, powod: "brak-dostepu" });
  });

  it("nie usunie zdjęcia obcej firmy, nawet znając jego identyfikator", async () => {
    const obca = await firmaZCzlonkiem();
    const swoja = await firmaZCzlonkiem(obca.companyId);

    const dodane = await dodajZdjecie(obca.widz, obca.companyId, {
      sciezka: "obca/do-podebrania.webp",
      szerokosc: 10,
      wysokosc: 10,
      kluczWysylki: crypto.randomUUID(),
    });
    expect(dodane.ok).toBe(true);
    if (!dodane.ok) return;
    await zapamietaj(dodane.dane.id);

    const wynik = await usunZdjecie(swoja.widz, swoja.companyId, dodane.dane.id);

    expect(wynik.ok).toBe(false);
    // Zdjęcie ma dalej żyć w profilu obcej firmy.
    const zdjecia = await pobierzZdjeciaFirmy(ANONIM, obca.companyId);
    expect(zdjecia.map((z) => z.id)).toContain(dodane.dane.id);
  });
});

describe("pozycje i limit", () => {
  it("pierwsze zdjęcie trafia na pozycję zero, czyli na kartę w katalogu", async () => {
    const { widz, companyId } = await firmaZCzlonkiem();
    await wyczysc(companyId);

    const wynik = await dodajZdjecie(widz, companyId, {
      sciezka: "a/pierwsze.webp",
      szerokosc: 800,
      wysokosc: 600,
      kluczWysylki: crypto.randomUUID(),
    });

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;
    await zapamietaj(wynik.dane.id);
    expect(wynik.dane.pozycja).toBe(0);
  });

  it("jedenaste zdjęcie jest odrzucone", async () => {
    const { widz, companyId } = await firmaZCzlonkiem();
    await wyczysc(companyId);

    for (let i = 0; i < MAKS_ZDJEC; i += 1) {
      const wynik = await dodajZdjecie(widz, companyId, {
        sciezka: `a/${i}.webp`,
        szerokosc: 800,
        wysokosc: 600,
        kluczWysylki: crypto.randomUUID(),
      });
      expect(wynik.ok, `zdjęcie numer ${i} miało się zmieścić`).toBe(true);
      if (wynik.ok) await zapamietaj(wynik.dane.id);
    }

    const ponad = await dodajZdjecie(widz, companyId, {
      sciezka: "a/ponad.webp",
      szerokosc: 800,
      wysokosc: 600,
      kluczWysylki: crypto.randomUUID(),
    });

    expect(ponad).toEqual({ ok: false, powod: "limit-zdjec" });
  });

  it("usunięcie zwalnia pozycję, a wiersz zostaje w bazie", async () => {
    const { widz, companyId } = await firmaZCzlonkiem();
    await wyczysc(companyId);

    const pierwsze = await dodajZdjecie(widz, companyId, {
      sciezka: "a/glowne.webp",
      szerokosc: 800,
      wysokosc: 600,
      kluczWysylki: crypto.randomUUID(),
    });
    expect(pierwsze.ok).toBe(true);
    if (!pierwsze.ok) return;
    await zapamietaj(pierwsze.dane.id);

    expect((await usunZdjecie(widz, companyId, pierwsze.dane.id)).ok).toBe(true);

    /*
     * Zasada 5: wiersz zostaje, zmienia się data archiwizacji. Dzięki temu
     * pomyłkę da się cofnąć, a plik w Storage dalej ma właściciela.
     */
    const [wiersz] = await db
      .select({ archived: companyPhotos.archivedAt })
      .from(companyPhotos)
      .where(eq(companyPhotos.id, pierwsze.dane.id))
      .limit(1);
    expect(wiersz?.archived).not.toBeNull();

    // Pozycja zero wraca do użytku, inaczej firma nigdy nie podmieniłaby
    // zdjęcia głównego.
    const kolejne = await dodajZdjecie(widz, companyId, {
      sciezka: "a/nowe-glowne.webp",
      szerokosc: 800,
      wysokosc: 600,
      kluczWysylki: crypto.randomUUID(),
    });
    expect(kolejne.ok).toBe(true);
    if (!kolejne.ok) return;
    await zapamietaj(kolejne.dane.id);
    expect(kolejne.dane.pozycja).toBe(0);
  });

  it("lista pomija usunięte i idzie od głównego", async () => {
    const { widz, companyId } = await firmaZCzlonkiem();
    await wyczysc(companyId);

    for (const nazwa of ["zero", "jeden", "dwa"]) {
      const wynik = await dodajZdjecie(widz, companyId, {
        sciezka: `a/${nazwa}.webp`,
        szerokosc: 800,
        wysokosc: 600,
        kluczWysylki: crypto.randomUUID(),
      });
      if (wynik.ok) await zapamietaj(wynik.dane.id);
    }

    const przed = await pobierzZdjeciaFirmy(ANONIM, companyId);
    expect(przed.map((z) => z.pozycja)).toEqual([0, 1, 2]);

    const srodkowe = przed[1];
    expect(srodkowe).toBeDefined();
    if (!srodkowe) return;
    await usunZdjecie(widz, companyId, srodkowe.id);

    const po = await pobierzZdjeciaFirmy(ANONIM, companyId);
    expect(po.map((z) => z.pozycja)).toEqual([0, 2]);
  });
});

/**
 * Jedna próba wysyłki, jedno zdjęcie.
 *
 * REGUŁA: ponowione żądanie nie tworzy drugiego zdjęcia. Tak dublowały się
 * zdjęcia w kreatorze: zapis przechodził, interfejs milczał, a ponowna próba
 * wstawiała kopię, bo `path` niesie losowy człon i za każdym razem jest inny.
 *
 * Reguły pilnują DWIE NIEZALEŻNE BARIERY i każda ma tu własny przypadek,
 * padający po zdjęciu wyłącznie jej:
 *
 *   1. indeks `company_photos_company_upload_key_uniq` w bazie,
 *   2. `on conflict do nothing` wraz z doczytaniem wiersza w `dodajZdjecie`.
 *
 * Przypadek na barierę 1 wstawia wiersz **surowym SQL-em**, obchodząc
 * `dodajZdjecie`, bo inaczej o wyniku rozstrzygałaby bariera 2 i test nie
 * dowodziłby niczego o indeksie.
 *
 * ZASIEW JEST USTAWIONY POD BARIERĘ. Każdy z tych testów zaczyna od
 * `wyczysc`, więc firma ma wolne wszystkie dziesięć pozycji. Bez tego o
 * odmowie mógłby rozstrzygnąć limit zdjęć, a nie klucz próby, i jeden wynik
 * dałby się wytłumaczyć dwiema przyczynami.
 *
 * Bariery nie są w pełni rozłączne i trzeba o tym wiedzieć przy czytaniu
 * wyników: `on conflict` celuje w konkretny indeks, więc po jego usunięciu
 * z migracji wywala się każdy zapis, nie tylko powtórka. Zdjęcie indeksu
 * izoluje wyłącznie przypadek na surowym SQL-u, a przypadki na `dodajZdjecie`
 * izoluje zdjęcie samego `on conflict` przy zostawionym indeksie.
 */

/**
 * Zdjęcia z zasiewu, a nie utworzone przez ten test.
 *
 * Reszta pliku buduje stan własną ścieżką, więc jest ślepa na błędy samego
 * zasiewu, a z zasiewu korzysta każda praca ręczna. Ten blok czyta to, co
 * `lib/db/seed.ts` wstawił firmie z aktywnym abonamentem.
 *
 * KAŻDE SPRAWDZENIE JEST ZAWĘŻONE DO ŚCIEŻEK Z `zasiew-`. Wcześniejsze bloki
 * w tym pliku dopisują zdjęcia tej samej firmie, bo `firmaZCzlonkiem` wybiera
 * firmę z zasiewu. Liczenie wszystkich wierszy firmy dawało tu wynik zależny
 * od tego, co zrobiły testy wyżej, czyli dokładnie taki, jakiego ten plik
 * ma nie mieć.
 */
describe("zdjęcia z zasiewu", () => {
  /** Firma z aktywnym abonamentem, czyli ta, której zasiew daje zdjęcia. */
  async function firmaZZasiewu(): Promise<string> {
    const [wiersz] = await db
      .select({ companyId: companyPhotos.companyId })
      .from(companyPhotos)
      .where(sql`${companyPhotos.path} like '%zasiew-glowne.webp'`)
      .limit(1);

    if (!wiersz) throw new Error("Zasiew nie ma zdjęć firmy, a na nich stoi ten blok.");
    return wiersz.companyId;
  }

  /** Wiersze zasiewu tej firmy, bez tego, co dopisały testy wyżej. */
  async function wierszeZasiewu(companyId: string) {
    return db
      .select({
        sciezka: companyPhotos.path,
        pozycja: companyPhotos.position,
        klucz: companyPhotos.uploadKey,
        archiwum: companyPhotos.archivedAt,
      })
      .from(companyPhotos)
      .where(
        and(eq(companyPhotos.companyId, companyId), sql`${companyPhotos.path} like '%zasiew-%'`),
      )
      .orderBy(companyPhotos.path);
  }

  it("widoczne zdjęcie z zasiewu stoi na pozycji zero, czyli na karcie", async () => {
    const companyId = await firmaZZasiewu();

    // Przez zapytanie produkcyjne, bo to ono rozstrzyga, co widać.
    const widoczne = await pobierzZdjeciaFirmy(ANONIM, companyId);
    const glowne = widoczne.find((z) => z.sciezka.includes("zasiew-glowne"));
    const zastapione = widoczne.find((z) => z.sciezka.includes("zasiew-zastapione"));

    expect(glowne?.pozycja).toBe(0);
    // Trzeci wiersz zasiewu jest zarchiwizowany, więc tu go nie ma.
    expect(zastapione).toBeUndefined();
  });

  it("zarchiwizowane zdjęcie z zasiewu dalej leży w bazie, bo nic nie kasujemy", async () => {
    const wiersze = await wierszeZasiewu(await firmaZZasiewu());

    // Zasada 5: usunięcie zdjęcia to archiwizacja, nie zniknięcie wiersza.
    expect(wiersze).toHaveLength(3);
    expect(wiersze.filter((w) => w.archiwum !== null)).toHaveLength(1);
  });

  it("żywe i zarchiwizowane zdjęcie dzielą klucz próby, bo indeks liczy tylko żywe", async () => {
    const wiersze = await wierszeZasiewu(await firmaZZasiewu());
    const zKluczem = wiersze.filter((w) => w.klucz !== null);

    /*
     * Sedno: dwa wiersze z tym samym kluczem współistnieją, bo jeden jest
     * zarchiwizowany. Gdyby indeks przestał zawężać się do `archived_at is
     * null`, zasiew w ogóle by nie wszedł, więc ten przypadek jest tu
     * podwójnie: sprawdza warunek i tłumaczy, czemu zasiew tak wygląda.
     */
    expect(zKluczem).toHaveLength(2);
    expect(new Set(zKluczem.map((w) => w.klucz)).size).toBe(1);
    expect(zKluczem.filter((w) => w.archiwum === null)).toHaveLength(1);

    // Instancja rozróżniająca: wiersz sprzed migracji 0012 klucza nie ma,
    // więc „wszystkie mają klucz" i „te dwa mają" nie dają tu tego samego.
    expect(wiersze.filter((w) => w.klucz === null)).toHaveLength(1);
  });
});

describe("ponowiona wysyłka nie dubluje zdjęcia", () => {
  it("indeks w bazie odrzuca drugi wiersz z tym samym kluczem próby", async () => {
    const { companyId } = await firmaZCzlonkiem();
    await wyczysc(companyId);

    const klucz = crypto.randomUUID();

    // Surowy SQL, bez `on conflict`: sprawdzamy sam indeks, nie zapytanie.
    const wstaw = (pozycja: number, sciezka: string) =>
      db.execute(sql`
        insert into company_photos (company_id, path, position, width, height, upload_key)
        values (${companyId}, ${sciezka}, ${pozycja}, 800, 600, ${klucz})
        returning id
      `);

    const pierwszy = await wstaw(0, "a/surowe-pierwsze.webp");
    const idPierwszego = (pierwszy[0] as { id: string } | undefined)?.id;
    expect(idPierwszego).toBeDefined();
    if (idPierwszego) await zapamietaj(idPierwszego);

    /*
     * Pozycja jest inna, więc drugi wiersz nie odbija się od indeksu pozycji.
     * Odrzucić go ma wyłącznie indeks klucza próby.
     */
    await expect(wstaw(1, "a/surowe-drugie.webp")).rejects.toThrow();
  });

  it("drugie wywołanie z tym samym kluczem oddaje to samo zdjęcie, nie nowe", async () => {
    const { widz, companyId } = await firmaZCzlonkiem();
    await wyczysc(companyId);

    const klucz = crypto.randomUUID();
    const zdjecie = { szerokosc: 800, wysokosc: 600, kluczWysylki: klucz };

    const pierwsze = await dodajZdjecie(widz, companyId, {
      ...zdjecie,
      sciezka: "a/powtorka-pierwsza.webp",
    });
    expect(pierwsze.ok).toBe(true);
    if (!pierwsze.ok) return;
    await zapamietaj(pierwsze.dane.id);

    /*
     * Ścieżka jest inna, dokładnie jak przy prawdziwym ponowieniu: akcja
     * składa ją od nowa z losowym członem przed każdym zapisem. Rozstrzygać
     * ma klucz próby, nie ścieżka.
     */
    const drugie = await dodajZdjecie(widz, companyId, {
      ...zdjecie,
      sciezka: "a/powtorka-druga.webp",
    });

    // Sedno: wynik udany, ten sam wiersz, bez wyjątku i bez drugiego zdjęcia.
    expect(drugie.ok).toBe(true);
    if (!drugie.ok) return;
    expect(drugie.dane.id).toBe(pierwsze.dane.id);

    expect(await pobierzZdjeciaFirmy(ANONIM, companyId)).toHaveLength(1);
  });

  it("powtórka nie udaje limitu zdjęć, choć obie drogi oddają brak wiersza", async () => {
    const { widz, companyId } = await firmaZCzlonkiem();
    await wyczysc(companyId);

    const klucz = crypto.randomUUID();
    const pierwsze = await dodajZdjecie(widz, companyId, {
      sciezka: "a/nie-limit.webp",
      szerokosc: 800,
      wysokosc: 600,
      kluczWysylki: klucz,
    });
    if (pierwsze.ok) await zapamietaj(pierwsze.dane.id);

    const powtorka = await dodajZdjecie(widz, companyId, {
      sciezka: "a/nie-limit-druga.webp",
      szerokosc: 800,
      wysokosc: 600,
      kluczWysylki: klucz,
    });

    /*
     * `insert` nie oddaje wiersza w dwóch różnych sytuacjach: przy powtórce
     * i przy zajętych wszystkich pozycjach. Bez rozdzielenia tych przyczyn
     * firma z jednym zdjęciem widziałaby „masz już 10 zdjęć”.
     */
    expect(powtorka).not.toEqual({ ok: false, powod: "limit-zdjec" });
    expect(powtorka.ok).toBe(true);
  });

  it("inny klucz wstawia drugie zdjęcie, więc odmowa dotyczy powtórki, nie zapisu", async () => {
    /*
     * Instancja pozytywna obok negatywnej. Bez niej testy wyżej przechodziłyby
     * także wtedy, gdyby `dodajZdjecie` przestało wstawiać cokolwiek: „nic się
     * nie zapisuje” i „powtórka się nie zapisuje” dają ten sam wynik.
     */
    const { widz, companyId } = await firmaZCzlonkiem();
    await wyczysc(companyId);

    for (const nazwa of ["rozne-a", "rozne-b"]) {
      const wynik = await dodajZdjecie(widz, companyId, {
        sciezka: `a/${nazwa}.webp`,
        szerokosc: 800,
        wysokosc: 600,
        kluczWysylki: crypto.randomUUID(),
      });
      expect(wynik.ok, `zdjęcie ${nazwa} miało się zapisać`).toBe(true);
      if (wynik.ok) await zapamietaj(wynik.dane.id);
    }

    expect(await pobierzZdjeciaFirmy(ANONIM, companyId)).toHaveLength(2);
  });

  it("usunięte zdjęcie zwalnia klucz, bo indeks liczy tylko nieusunięte", async () => {
    const { widz, companyId } = await firmaZCzlonkiem();
    await wyczysc(companyId);

    const klucz = crypto.randomUUID();
    const pierwsze = await dodajZdjecie(widz, companyId, {
      sciezka: "a/zwolnienie-klucza.webp",
      szerokosc: 800,
      wysokosc: 600,
      kluczWysylki: klucz,
    });
    expect(pierwsze.ok).toBe(true);
    if (!pierwsze.ok) return;
    await zapamietaj(pierwsze.dane.id);

    await usunZdjecie(widz, companyId, pierwsze.dane.id);

    /*
     * Ten sam klucz po archiwizacji przechodzi. Inaczej firma, która usunęła
     * zdjęcie i wysyła je ponownie z tej samej karty w przeglądarce,
     * dostawałaby w odpowiedzi zarchiwizowany wiersz i nie widziała zdjęcia.
     */
    const ponownie = await dodajZdjecie(widz, companyId, {
      sciezka: "a/zwolnienie-klucza-druga.webp",
      szerokosc: 800,
      wysokosc: 600,
      kluczWysylki: klucz,
    });

    expect(ponownie.ok).toBe(true);
    if (!ponownie.ok) return;
    expect(ponownie.dane.id).not.toBe(pierwsze.dane.id);
    await zapamietaj(ponownie.dane.id);
  });
});

/** Archiwizuje wszystkie zdjęcia firmy, żeby test zaczynał od znanego stanu. */
async function wyczysc(companyId: string): Promise<void> {
  await db
    .update(companyPhotos)
    .set({ archivedAt: sql`now()` })
    .where(and(eq(companyPhotos.companyId, companyId), isNull(companyPhotos.archivedAt)));
}

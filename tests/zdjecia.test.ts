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
import {
  dodajZdjecie,
  MAKS_ZDJEC,
  pobierzZdjeciaFirmy,
  usunZdjecie,
} from "@/lib/db/queries/zdjecia";
import { companyMembers, companyPhotos } from "@/lib/db/schema/katalog";
import { NiezaimplementowanaGalazUprawnien, type Widz } from "@/lib/permissions";
import { MAKS_BAJTOW, MAKS_BOK, przygotujZdjecie } from "@/lib/zdjecia/obrobka";

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

/** Dwie firmy z zasiewu wraz z ich członkami. Na nich stoi cały plik. */
async function firmaZCzlonkiem(pominCompanyId?: string) {
  const wiersze = await db
    .select({ companyId: companyMembers.companyId, userId: companyMembers.userId })
    .from(companyMembers)
    .orderBy(companyMembers.companyId);

  const wiersz = wiersze.find((w) => w.companyId !== pominCompanyId);
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
    });

    expect(wynik).toEqual({ ok: false, powod: "brak-dostepu" });
  });

  it("moderator rzuca, bo jego gałęzi uprawnień nie napisano", async () => {
    const { companyId } = await firmaZCzlonkiem();

    await expect(
      dodajZdjecie(MODERATOR, companyId, { sciezka: "x/0.webp", szerokosc: 10, wysokosc: 10 }),
    ).rejects.toBeInstanceOf(NiezaimplementowanaGalazUprawnien);
  });

  it("członek jednej firmy nie dodaje zdjęcia innej", async () => {
    const swoja = await firmaZCzlonkiem();
    const obca = await firmaZCzlonkiem(swoja.companyId);

    const wynik = await dodajZdjecie(swoja.widz, obca.companyId, {
      sciezka: "obca/0.webp",
      szerokosc: 10,
      wysokosc: 10,
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
      });
      expect(wynik.ok, `zdjęcie numer ${i} miało się zmieścić`).toBe(true);
      if (wynik.ok) await zapamietaj(wynik.dane.id);
    }

    const ponad = await dodajZdjecie(widz, companyId, {
      sciezka: "a/ponad.webp",
      szerokosc: 800,
      wysokosc: 600,
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

/** Archiwizuje wszystkie zdjęcia firmy, żeby test zaczynał od znanego stanu. */
async function wyczysc(companyId: string): Promise<void> {
  await db
    .update(companyPhotos)
    .set({ archivedAt: sql`now()` })
    .where(and(eq(companyPhotos.companyId, companyId), isNull(companyPhotos.archivedAt)));
}

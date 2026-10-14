/**
 * Obróbka zdjęcia przed zapisaniem: skalowanie i zamiana na WebP.
 *
 * PO CO. Zdjęcie prosto z telefonu waży kilka megabajtów i ma cztery tysiące
 * pikseli szerokości. Karta w katalogu pokazuje je na trzystu. Bez obróbki
 * katalog ładowałby kilkadziesiąt megabajtów na jedną stronę wyników, a firma
 * musiałaby umieć sama przygotować plik — czyli połowa firm nie dodałaby
 * żadnego zdjęcia.
 *
 * Moduł jest czysty: dostaje bajty, oddaje bajty. Nie wie o bazie ani
 * o Storage, więc da się go sprawdzić bez jednego i drugiego.
 */
import sharp from "sharp";
import { MAKS_BAJTOW, MAKS_BOK, PRZYJMOWANE_TYPY } from "@/lib/zdjecia/granice";

export type Zdjecie = {
  dane: Buffer;
  szerokosc: number;
  wysokosc: number;
};

/** Czym się nie udało. */
export type PowodOdrzucenia = "typ" | "rozmiar" | "nieczytelne";

export type WynikObrobki = { ok: true; zdjecie: Zdjecie } | { ok: false; powod: PowodOdrzucenia };

/**
 * Skaluje do `MAKS_BOK` i zapisuje jako WebP.
 *
 * `withoutEnlargement` sprawia, że mały plik zostaje mały: powiększanie
 * dokłada bajtów i nie dokłada szczegółów.
 *
 * `rotate()` bez argumentu obraca zdjęcie według znacznika orientacji z EXIF-u.
 * Jest konieczne, bo metadane przy zapisie znikają: bez obrócenia zdjęcie
 * z telefonu trzymanego pionowo wyświetlałoby się położone na boku, skoro
 * znacznik mówiący „obróć” już go nie dogoni.
 *
 * METADANE ZNIKAJĄ SAME, bo sharp ich domyślnie nie przepisuje na wyjście.
 * Nie jest to zasługa `rotate()` ani naszego kodu, tylko domyślne zachowanie
 * biblioteki — i dlatego **nie wolno tu dopisać `withMetadata()`**. Zdjęcie
 * sali zrobione telefonem niesie zwykle dokładne współrzędne GPS, a cała
 * reguła „co kto widzi” stoi na tym, że obcy widzi powiat, nie adres.
 * Pilnuje tego test w tests/zdjecia.test.ts.
 */
export async function przygotujZdjecie(dane: Buffer, typ: string): Promise<WynikObrobki> {
  if (!(PRZYJMOWANE_TYPY as readonly string[]).includes(typ)) {
    return { ok: false, powod: "typ" };
  }

  if (dane.byteLength > MAKS_BAJTOW) return { ok: false, powod: "rozmiar" };

  try {
    const { data, info } = await sharp(dane)
      .rotate()
      .resize({ width: MAKS_BOK, height: MAKS_BOK, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });

    return { ok: true, zdjecie: { dane: data, szerokosc: info.width, wysokosc: info.height } };
  } catch {
    /*
     * Plik z poprawnym nagłówkiem typu, którego sharp nie umie otworzyć:
     * ucięty przy wysyłce, podmieniony rozszerzeniem, uszkodzony. Odmowa,
     * nie wyjątek — to jest wejście od człowieka, a nie awaria serwisu.
     */
    return { ok: false, powod: "nieczytelne" };
  }
}

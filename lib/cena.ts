/**
 * Cena wpisana w kreatorze jednym polem tekstowym.
 *
 * REGUŁA: wolno uprzątnąć zapis, nie wolno zmienić treści. „180 zł" i „180"
 * to ta sama cena zapisana inaczej, więc jednostkę i odstępy zdejmujemy.
 * „sto osiemdziesiąt" to nie cena i ma **zostać nietknięte**, żeby walidacja
 * na serwerze mogła odmówić.
 *
 * Wcześniej kreator robił `replace(/[^\d.,]/g, "")`, czyli wycinał z pola
 * wszystko poza cyframi. „sto osiemdziesiąt" zamieniało się w pusty napis,
 * a pusty napis znaczy „nie podano ceny": firma zapisywała się bez ceny
 * i nie dowiadywała się o tym nigdy. Cicha podmiana wpisanej treści jest
 * gorsza od odmowy, bo odmowę człowiek widzi.
 */

/** Odstępy, także nierozdzielające, i jednostka na końcu. */
const ODSTEPY = /[\s  ]/g;
const JEDNOSTKA_NA_KONCU = /(zł|zl|pln)$/i;

/**
 * Zapis ceny gotowy do wysłania na serwer.
 *
 * Nie rozstrzyga, czy cena jest poprawna: to robi Zod
 * (`kwotaZlotowkiOpcjonalna` w lib/validators/kwoty.ts), bo granice kwoty
 * i komunikaty mają jedno miejsce, a nie dwa.
 */
export function normalizujCene(tekst: string): string {
  return tekst.trim().replace(ODSTEPY, "").replace(JEDNOSTKA_NA_KONCU, "").replace(",", ".");
}

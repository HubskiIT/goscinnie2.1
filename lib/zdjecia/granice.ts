/**
 * Granice dotyczące zdjęć: ile, jak duże, w jakich formatach.
 *
 * DLACZEGO OSOBNY MODUŁ. Te same liczby muszą znać dwie strony: serwer, który
 * odmawia, i formularz, który o odmowie uprzedza. Gdyby formularz sięgnął po
 * nie do `obrobka.ts`, do paczki wysyłanej do przeglądarki weszłoby `sharp`,
 * a gdyby po `MAKS_ZDJEC` do `queries/zdjecia.ts` — połączenie z bazą.
 * Tu nie ma żadnego importu i to jest cała treść tej decyzji.
 *
 * Jedno źródło prawdy, nie dwa: liczba przepisana z palca do formularza
 * rozjeżdża się z serwerem przy pierwszej zmianie i wtedy człowiek dowiaduje
 * się o limicie dopiero po wysłaniu pliku.
 */

/** Ile zdjęć może mieć jedna firma: jedno główne i dziewięć w galerii. */
export const MAKS_ZDJEC = 10;

/** Dłuższy bok po skalowaniu. Powyżej tego katalog nic nie zyskuje. */
export const MAKS_BOK = 1600;

/**
 * Ile plik może ważyć **przed** obróbką.
 *
 * Było tu 8 MB i to była obietnica niemożliwa do spełnienia. Zdjęcie jedzie
 * do akcji serwerowej, a Vercel ucina ciało żądania na 4,5 MB na poziomie
 * infrastruktury, czego nie podnosi żadna opcja. Plik 8 MB nie miał jak
 * dojść: dostawał 413, zanim akcja się zaczęła, więc żadna z odmów
 * w `KOMUNIKAT_ODRZUCENIA` nigdy się dla niego nie pokazywała.
 *
 * 4 MB, a nie 4,5 MB, bo razem z bajtami zdjęcia jadą nagłówki części
 * multipart i nazwa pliku. Pół megabajta zapasu zostaje na ten narzut, patrz
 * `bodySizeLimit` w next.config.ts.
 *
 * Zdjęcie z telefonu regularnie waży więcej niż 4 MB, więc ta granica część
 * plików odrzuci. Właściwym wyjściem jest zmniejszanie zdjęcia w przeglądarce
 * przed wysłaniem, bo wtedy do akcji dociera kilkaset kilobajtów i limit
 * przestaje mieć znaczenie. Do tego czasu lepiej odmówić zrozumiale niż
 * obiecać 8 MB i zamilknąć.
 */
export const MAKS_BAJTOW = 4 * 1024 * 1024;

/** `MAKS_BAJTOW` w megabajtach, do pokazania człowiekowi. */
export const MAKS_MEGABAJTOW = Math.round(MAKS_BAJTOW / (1024 * 1024));

/**
 * Formaty przyjmowane od człowieka.
 *
 * HEIC jest tu, bo tak zapisuje iPhone i bez niego połowa właścicieli sal
 * dostawałaby odmowę przy pierwszym zdjęciu z telefonu. Wychodzi i tak
 * WebP, więc przeglądarka nigdy nie dostaje HEIC-a.
 */
export const PRZYJMOWANE_TYPY = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

/** Lista typów do atrybutu `accept` w polu wyboru pliku. */
export const ACCEPT_ZDJEC = PRZYJMOWANE_TYPY.join(",");

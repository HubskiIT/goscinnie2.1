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

/** Ile plik może ważyć **przed** obróbką. Zdjęcie z telefonu regularnie tyle waży. */
export const MAKS_BAJTOW = 8 * 1024 * 1024;

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

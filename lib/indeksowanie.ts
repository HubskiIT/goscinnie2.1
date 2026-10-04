/**
 * Czy wpuszczamy roboty wyszukiwarek.
 *
 * DOMYŚLNIE NIE. Wartość musi być ustawiona jawnie, żeby indeksowanie ruszyło,
 * bo kierunek pomyłki ma być bezpieczny: brak zmiennej na nowym środowisku
 * oznacza serwis zamknięty, a nie otwarty.
 *
 * DLACZEGO TO NIE JEST OSTROŻNOŚĆ, TYLKO STRATEGIA
 *
 * Katalog zapełniamy przed wpuszczeniem ruchu. Sześćset cienkich profili bez
 * opisów i bez zdjęć, zaindeksowanych teraz, to najkrótsza droga do filtra
 * jakościowego, z którego wychodzi się miesiącami. Strony mają być dostępne
 * pod linkiem i niewidoczne w wyszukiwarce.
 *
 * Zdejmujemy to świadomie, jedną zmienną środowiskową, bez wdrożenia.
 */
export const WARTOSC_WLACZAJACA = "wlaczone";

export function indeksowanieWlaczone(): boolean {
  return process.env.INDEKSOWANIE === WARTOSC_WLACZAJACA;
}

/** Nagłówek wysyłany przy każdej odpowiedzi, dopóki indeksowanie jest wyłączone. */
export const NAGLOWEK_ROBOTOW = "X-Robots-Tag";
export const WARTOSC_NAGLOWKA = "noindex, nofollow, noarchive";

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

/**
 * Znacznik `robots` w `<head>`, trzecia bariera obok nagłówka i robots.txt.
 *
 * DLACZEGO TO MIESZKA TUTAJ, A NIE W `app/layout.tsx`
 *
 * Bo tam stała wartość `{ index: false, follow: false }` wpisana na sztywno
 * i **nie czytała flagi wcale**. Nagłówek i robots.txt słuchały zmiennej,
 * metadane nie, więc ustawienie `INDEKSOWANIE` zdejmowało dwie bariery
 * z trzech, a każda strona dalej miała `noindex` w treści. Google czyta
 * znacznik ze strony tak samo chętnie jak nagłówek, więc serwis zostawał
 * zamknięty, tylko już bez śladu w robots.txt, który by to wyjaśniał.
 *
 * To jest dokładnie ta sama pomyłka, przed którą ostrzega komentarz
 * w `app/robots.ts`, popełniona o jedno piętro wyżej. Trzy bariery, jedna
 * zmienna, jedno miejsce, które ją czyta.
 */
export function robotyWMetadanych(): {
  index: boolean;
  follow: boolean;
  nocache?: boolean;
  googleBot?: { index: boolean; follow: boolean; "max-image-preview": "large" };
} {
  if (!indeksowanieWlaczone()) {
    return { index: false, follow: false, nocache: true };
  }

  return {
    index: true,
    follow: true,
    // Bez tego Google pokazuje w wynikach miniaturę wielkości znaczka
    // pocztowego. Katalog miejsc sprzedaje się zdjęciem sali.
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  };
}

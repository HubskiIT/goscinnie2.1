import type { MetadataRoute } from "next";
import { adresAplikacji } from "@/lib/adres";
import { indeksowanieWlaczone } from "@/lib/indeksowanie";

/**
 * robots.txt, sterowany tą samą zmienną co nagłówek X-Robots-Tag.
 *
 * Serwis jest zamknięty dla wyszukiwarek do czasu wejścia pierwszej prawdziwej
 * firmy: sześćset cienkich profili zaindeksowanych teraz to najkrótsza droga
 * do filtra jakościowego, z którego wychodzi się miesiącami.
 *
 * Wcześniej ten plik **nie czytał flagi wcale** i zwracał `disallow: "/"`
 * niezależnie od ustawienia. Skutek byłby taki, że zdjęcie blokady jedną
 * zmienną środowiskową, jak obiecuje lib/indeksowanie.ts, usuwałoby tylko
 * nagłówek, a robots.txt dalej odsyłał roboty z niczym. Blokada zdjęta
 * w połowie jest gorsza od blokady pełnej, bo wygląda na zdjętą.
 */
export default function robots(): MetadataRoute.Robots {
  if (!indeksowanieWlaczone()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /*
       * Otwieramy katalog, nie panel. Te ścieżki wymagają sesji albo zwracają
       * dane maszynowo, więc w wynikach wyszukiwania nie mają czego szukać.
       */
      disallow: ["/api/", "/panel/", "/moje", "/wiadomosci", "/weryfikacja", "/nowe-haslo"],
    },
    /*
     * Wskazanie mapy witryny, wyłącznie w gałęzi otwartej.
     *
     * Adres musi być bezwzględny, bo robots.txt tak ma w specyfikacji i
     * ścieżki względnej nikt tu nie odczyta. Stąd `adresAplikacji()`,
     * a nie wpisany na stałe `https://goscinnie.pl/sitemap.xml`: ten sam
     * kod ma dawać poprawny adres na produkcji, na podglądzie i lokalnie.
     *
     * W gałęzi zamkniętej tej linii nie ma i to jest celowe. Robot, który
     * ma zakaz wstępu na całość, nie powinien dostawać jednocześnie
     * zaproszenia do spisu wszystkich podstron.
     */
    sitemap: new URL("/sitemap.xml", adresAplikacji()).href,
  };
}

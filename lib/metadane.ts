/**
 * Metadane jednej strony: tytuł, opis, adres kanoniczny i Open Graph.
 *
 * DLACZEGO TO JEST FUNKCJA, A NIE TRZY POLA WPISANE W KAŻDEJ STRONIE
 *
 * Metadane w App Routerze dziedziczą się **całymi obiektami, nie polami**.
 * Strona, która dopisze do siebie samo `openGraph: { url }`, zastępuje tym
 * cały `openGraph` z `app/layout.tsx`, czyli gubi `siteName`, `locale`, typ
 * i opis. Efekt jest gorszy niż brak zmiany: link wklejony w komunikator
 * pokazuje goły adres, bo karta podglądu nie ma z czego powstać.
 *
 * Dlatego adres kanoniczny i Open Graph wychodzą zawsze razem, z jednego
 * miejsca, komplet za każdym razem.
 *
 * DLACZEGO ADRES KANONICZNY JEST TU WYMAGANY
 *
 * `/lokale` przyjmuje sześć parametrów wyszukiwania: `rodzaj`, `m`, `km`,
 * `goscie`, `termin` i `u`. Każda kombinacja to dla wyszukiwarki osobny adres
 * z niemal tą samą treścią, a samych znaczników udogodnień jest kilkanaście.
 * Bez adresu kanonicznego katalog zgłasza do indeksu setki wariantów jednej
 * strony i sam sobie odbiera pozycję. Ścieżka bez parametrów rozstrzyga to
 * raz na zawsze, więc typ nie pozwala jej pominąć.
 */
import type { Metadata } from "next";

interface Opis {
  /** Tytuł bez marki. Markę dokłada szablon z `app/layout.tsx`. */
  tytul: string;
  opis: string;
  /**
   * Ścieżka kanoniczna, zawsze bez parametrów zapytania.
   *
   * Względna, nie bezwzględna: Next rozwija ją po `metadataBase`, więc ten
   * sam kod daje poprawny adres lokalnie, na podglądzie i na produkcji.
   */
  sciezka: string;
}

export function metadaneStrony({ tytul, opis, sciezka }: Opis): Metadata {
  return {
    title: tytul,
    description: opis,
    alternates: { canonical: sciezka },
    openGraph: {
      type: "website",
      locale: "pl_PL",
      siteName: "Gościnnie",
      title: tytul,
      description: opis,
      url: sciezka,
    },
    twitter: {
      card: "summary_large_image",
      title: tytul,
      description: opis,
    },
  };
}

/**
 * Metadane strony, której w indeksie być nie ma: logowanie, rejestracja, panel.
 *
 * `follow: true` jest celowe. Strona nie ma się pokazywać w wynikach, ale
 * linki z niej, czyli cała stopka z katalogiem, mają dalej prowadzić roboty
 * w głąb serwisu. `nofollow` zamykałoby drogę do stron, które indeksujemy.
 *
 * Nie czyta flagi `INDEKSOWANIE`, bo tu kierunek jest stały: te strony są
 * zamknięte także po otwarciu katalogu.
 */
export function metadaneBezIndeksu(tytul: string, opis: string): Metadata {
  return {
    title: tytul,
    description: opis,
    robots: { index: false, follow: true },
  };
}

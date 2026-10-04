import { type Lokal, pobierzLokale } from "@/content/ogloszenia";

/**
 * Stan wyszukiwarki żyje w adresie, nie w pamięci komponentu.
 * Dzięki temu adres wklejony w nowej karcie daje ten sam wynik,
 * a formularz działa bez JavaScriptu jako zwykły GET.
 */
export interface KryteriaLokali {
  rodzaj: string | null;
  miejscowosc: string | null;
  promienKm: number;
  goscie: number | null;
  termin: string | null;
  /** Filtry dodatkowe: ogród, nocleg, parking. Też w adresie. */
  udogodnienia: readonly string[];
}

export const PROMIENIE_KM = [0, 10, 25, 50] as const;
const DOMYSLNY_PROMIEN_KM = 25;

/** Nazwy parametrów są krótkie, bo wchodzą w adres i w linki z okazji. */
export const PARAMETRY = {
  rodzaj: "rodzaj",
  miejscowosc: "m",
  promien: "km",
  goscie: "goscie",
  termin: "termin",
  udogodnienie: "u",
} as const;

type Wejscie = Record<string, string | string[] | undefined>;

function jeden(wartosc: string | string[] | undefined): string | null {
  if (wartosc === undefined) return null;
  const tekst = Array.isArray(wartosc) ? wartosc[0] : wartosc;
  if (tekst === undefined) return null;
  const przyciete = tekst.trim();
  return przyciete === "" ? null : przyciete;
}

function liczba(wartosc: string | string[] | undefined): number | null {
  const tekst = jeden(wartosc);
  if (tekst === null) return null;
  const n = Number.parseInt(tekst, 10);
  return Number.isNaN(n) ? null : n;
}

function wiele(wartosc: string | string[] | undefined): readonly string[] {
  if (wartosc === undefined) return [];
  const lista = Array.isArray(wartosc) ? wartosc : [wartosc];
  return lista.map((t) => t.trim()).filter((t) => t !== "");
}

export function odczytajKryteria(parametry: Wejscie): KryteriaLokali {
  const promien = liczba(parametry[PARAMETRY.promien]);
  return {
    rodzaj: jeden(parametry[PARAMETRY.rodzaj]),
    miejscowosc: jeden(parametry[PARAMETRY.miejscowosc]),
    promienKm:
      promien !== null && PROMIENIE_KM.includes(promien as (typeof PROMIENIE_KM)[number])
        ? promien
        : DOMYSLNY_PROMIEN_KM,
    goscie: liczba(parametry[PARAMETRY.goscie]),
    termin: jeden(parametry[PARAMETRY.termin]),
    udogodnienia: wiele(parametry[PARAMETRY.udogodnienie]),
  };
}

/**
 * Filtrowanie po stronie serwera. Do wejścia bazy pracuje na content/,
 * a odległość liczymy po polu `odlegloscOdCentrumKm`, bo do PostGIS
 * jeszcze daleko.
 */
export function wyszukajLokale(kryteria: KryteriaLokali): readonly Lokal[] {
  return pobierzLokale().filter((lokal) => {
    if (kryteria.rodzaj !== null && lokal.rodzaj !== kryteria.rodzaj) return false;
    if (kryteria.goscie !== null) {
      if (lokal.pojemnoscMax !== null && lokal.pojemnoscMax < kryteria.goscie) return false;
      if (lokal.pojemnoscMin !== null && lokal.pojemnoscMin > kryteria.goscie) return false;
    }
    if (
      kryteria.udogodnienia.length > 0 &&
      !kryteria.udogodnienia.every((u) => lokal.udogodnienia.includes(u))
    ) {
      return false;
    }
    if (kryteria.miejscowosc !== null && kryteria.promienKm === 0) {
      return lokal.miejscowosc.nazwa.toLowerCase() === kryteria.miejscowosc.toLowerCase();
    }
    return true;
  });
}

/** Buduje adres listy z przełączonym jednym udogodnieniem. Filtr to link, nie przycisk. */
export function adresZPrzelaczonym(kryteria: KryteriaLokali, udogodnienie: string): string {
  const parametry = new URLSearchParams();
  if (kryteria.rodzaj !== null) parametry.set(PARAMETRY.rodzaj, kryteria.rodzaj);
  if (kryteria.miejscowosc !== null) parametry.set(PARAMETRY.miejscowosc, kryteria.miejscowosc);
  parametry.set(PARAMETRY.promien, String(kryteria.promienKm));
  if (kryteria.goscie !== null) parametry.set(PARAMETRY.goscie, String(kryteria.goscie));
  if (kryteria.termin !== null) parametry.set(PARAMETRY.termin, kryteria.termin);
  const wybrane = kryteria.udogodnienia.includes(udogodnienie)
    ? kryteria.udogodnienia.filter((u) => u !== udogodnienie)
    : [...kryteria.udogodnienia, udogodnienie];
  for (const u of wybrane) parametry.append(PARAMETRY.udogodnienie, u);
  return `/lokale?${parametry.toString()}`;
}

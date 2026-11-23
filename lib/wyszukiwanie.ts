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
 * Czy człowiek cokolwiek zawęził.
 *
 * Rozstrzyga o treści stanu pustego: „nic nie pasuje do tych filtrów" i „nie
 * ma jeszcze ani jednego wpisu" to dwie różne wiadomości i tylko jedna z nich
 * jest w danej chwili prawdziwa. Pokazanie niewłaściwej albo każe szukającemu
 * czyścić filtry, których nie ustawił, albo wmawia mu pusty katalog, gdy wpisy
 * są, tylko odfiltrowane.
 *
 * `promienKm` celowo się tu nie liczy: ma wartość domyślną, więc jest ustawiony
 * zawsze, także wtedy, gdy nikt go nie dotknął. Gdyby wchodził do tej sumy,
 * funkcja zwracałaby prawdę przy każdym wejściu na listę i drugi komunikat
 * nie pokazałby się nigdy.
 */
export function czySaFiltry(kryteria: KryteriaLokali): boolean {
  return (
    kryteria.rodzaj !== null ||
    kryteria.miejscowosc !== null ||
    kryteria.goscie !== null ||
    kryteria.termin !== null ||
    kryteria.udogodnienia.length > 0
  );
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

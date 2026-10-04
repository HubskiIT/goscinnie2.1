import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

/**
 * Miejscowości Polski z TERYT i PRNG, budowane skryptem scripts/miejscowosci.mjs.
 *
 * Plik czytamy raz na proces, po stronie serwera. Do przeglądarki nie trafia
 * nic poza ośmioma podpowiedziami na zapytanie.
 *
 * Po wejściu bazy ten moduł zastąpi tabela `miejscowosci` i zapytanie z PostGIS.
 * Trasa podpowiedzi i adresy się nie zmienią.
 */
export interface Miejscowosc {
  /** Identyfikator SIMC z rejestru TERYT. */
  id: string;
  slug: string;
  nazwa: string;
  rodzaj: string;
  gmina: string;
  powiat: string;
  wojewodztwo: string;
  szerokosc: number | null;
  dlugosc: number | null;
}

type Wiersz = [string, string, string, string, string, string, string, [number, number] | null];

interface Wpis extends Miejscowosc {
  /** Nazwa bez polskich znaków, żeby „lodz" znalazło Łódź. */
  szukaj: string;
}

/** Miasta przed wsiami, reszta na końcu. Kolejność podpowiedzi, punkt 5.2.4 planu. */
const WAGA_RODZAJU: Record<string, number> = {
  miasto: 0,
  wieś: 1,
  osada: 2,
  kolonia: 2,
  przysiółek: 2,
  "dzielnica Warszawy": 3,
  "część miasta": 4,
  "część miejscowości": 5,
};

export function bezZnakow(tekst: string): string {
  return tekst.toLowerCase().replaceAll("ł", "l").normalize("NFD").replace(/[̀-ͯ]/g, "");
}

let indeks: readonly Wpis[] | null = null;

function wczytaj(): readonly Wpis[] {
  if (indeks !== null) return indeks;
  const sciezka = join(process.cwd(), "content", "miejscowosci.json.gz");
  const wiersze = JSON.parse(gunzipSync(readFileSync(sciezka)).toString()) as Wiersz[];
  indeks = wiersze.map(([id, slug, nazwa, rodzaj, gmina, powiat, wojewodztwo, punkt]) => ({
    id,
    slug,
    nazwa,
    rodzaj,
    gmina,
    powiat,
    wojewodztwo,
    szerokosc: punkt === null ? null : punkt[0],
    dlugosc: punkt === null ? null : punkt[1],
    szukaj: bezZnakow(nazwa),
  }));
  return indeks;
}

export function pobierzMiejscowosc(slug: string): Miejscowosc | undefined {
  return wczytaj().find((m) => m.slug === slug);
}

/**
 * Podpowiedzi do pola miejscowości. Najpierw nazwy zaczynające się od frazy,
 * potem zawierające ją, a w obu grupach miasta przed wsiami.
 */
export function podpowiedzMiejscowosci(fraza: string, ile = 8): readonly Miejscowosc[] {
  const szukana = bezZnakow(fraza.trim());
  if (szukana.length < 2) return [];

  const trafienia: { wpis: Wpis; odPoczatku: boolean }[] = [];
  for (const wpis of wczytaj()) {
    const pozycja = wpis.szukaj.indexOf(szukana);
    if (pozycja === -1) continue;
    trafienia.push({ wpis, odPoczatku: pozycja === 0 });
    // Przy krótkich frazach trafień są dziesiątki tysięcy. Tyle wystarczy,
    // żeby po posortowaniu zostało osiem sensownych.
    if (trafienia.length >= 2000) break;
  }

  trafienia.sort((a, b) => {
    if (a.odPoczatku !== b.odPoczatku) return a.odPoczatku ? -1 : 1;
    const wagaA = WAGA_RODZAJU[a.wpis.rodzaj] ?? 9;
    const wagaB = WAGA_RODZAJU[b.wpis.rodzaj] ?? 9;
    if (wagaA !== wagaB) return wagaA - wagaB;
    if (a.wpis.nazwa.length !== b.wpis.nazwa.length) {
      return a.wpis.nazwa.length - b.wpis.nazwa.length;
    }
    return a.wpis.nazwa.localeCompare(b.wpis.nazwa, "pl");
  });

  return trafienia.slice(0, ile).map(({ wpis }) => wpis);
}

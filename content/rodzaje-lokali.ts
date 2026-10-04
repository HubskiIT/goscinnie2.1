import type { KlasaCenowa } from "@/content/kategorie";

/**
 * Rodzaje lokali: pierwsze pole wyszukiwarki.
 *
 * Zmiana kierunku z punktu 3 planu: klient szuka lokalu, nie okazji.
 * Okazja schodzi do filtrów dodatkowych i do stron /okazje/[okazja].
 *
 * Lista czeka na zatwierdzenie przez właściciela (punkt 10.1 planu).
 * Slug wchodzi w adres: /lokale/[rodzaj]/[miejscowosc].
 */
export interface RodzajLokalu {
  slug: string;
  nazwa: string;
  /**
   * Klasa cenowa z content/cennik.ts. Cennik wymienia wprost sale, hotele,
   * dwory i catering pełny (A) oraz restauracje i agroturystykę (B).
   * Pozostałe rodzaje czekają na potwierdzenie przez właściciela.
   */
  klasa: KlasaCenowa;
  /** Liczba mnoga do nagłówków stron pod wyszukiwarkę. */
  nazwaMnoga: string;
}

export const RODZAJE_LOKALI: readonly RodzajLokalu[] = [
  { slug: "sala-weselna", nazwa: "Sala weselna", nazwaMnoga: "Sale weselne", klasa: "A" },
  { slug: "sala-bankietowa", nazwa: "Sala bankietowa", nazwaMnoga: "Sale bankietowe", klasa: "A" },
  { slug: "restauracja", nazwa: "Restauracja", nazwaMnoga: "Restauracje", klasa: "B" },
  { slug: "dwor-palac", nazwa: "Dwór lub pałac", nazwaMnoga: "Dwory i pałace", klasa: "A" },
  { slug: "hotel", nazwa: "Hotel", nazwaMnoga: "Hotele", klasa: "A" },
  { slug: "dom-weselny", nazwa: "Dom weselny", nazwaMnoga: "Domy weselne", klasa: "A" },
  { slug: "stodola", nazwa: "Stodoła", nazwaMnoga: "Stodoły", klasa: "A" },
  { slug: "agroturystyka", nazwa: "Agroturystyka", nazwaMnoga: "Agroturystyki", klasa: "B" },
  { slug: "ogrod-plener", nazwa: "Ogród i plener", nazwaMnoga: "Ogrody i plenery", klasa: "B" },
  { slug: "klub", nazwa: "Klub", nazwaMnoga: "Kluby", klasa: "B" },
  {
    slug: "sala-konferencyjna",
    nazwa: "Sala konferencyjna",
    nazwaMnoga: "Sale konferencyjne",
    klasa: "B",
  },
] as const;

export function pobierzRodzajeLokali(): readonly RodzajLokalu[] {
  return RODZAJE_LOKALI;
}

export function pobierzRodzajLokalu(slug: string): RodzajLokalu | undefined {
  return RODZAJE_LOKALI.find((r) => r.slug === slug);
}

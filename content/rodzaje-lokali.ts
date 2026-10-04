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
  /** Liczba mnoga do nagłówków stron pod wyszukiwarkę. */
  nazwaMnoga: string;
}

export const RODZAJE_LOKALI: readonly RodzajLokalu[] = [
  { slug: "sala-weselna", nazwa: "Sala weselna", nazwaMnoga: "Sale weselne" },
  { slug: "sala-bankietowa", nazwa: "Sala bankietowa", nazwaMnoga: "Sale bankietowe" },
  { slug: "restauracja", nazwa: "Restauracja", nazwaMnoga: "Restauracje" },
  { slug: "dwor-palac", nazwa: "Dwór lub pałac", nazwaMnoga: "Dwory i pałace" },
  { slug: "hotel", nazwa: "Hotel", nazwaMnoga: "Hotele" },
  { slug: "dom-weselny", nazwa: "Dom weselny", nazwaMnoga: "Domy weselne" },
  { slug: "stodola", nazwa: "Stodoła", nazwaMnoga: "Stodoły" },
  { slug: "agroturystyka", nazwa: "Agroturystyka", nazwaMnoga: "Agroturystyki" },
  { slug: "ogrod-plener", nazwa: "Ogród i plener", nazwaMnoga: "Ogrody i plenery" },
  { slug: "klub", nazwa: "Klub", nazwaMnoga: "Kluby" },
  { slug: "sala-konferencyjna", nazwa: "Sala konferencyjna", nazwaMnoga: "Sale konferencyjne" },
] as const;

export function pobierzRodzajeLokali(): readonly RodzajLokalu[] {
  return RODZAJE_LOKALI;
}

export function pobierzRodzajLokalu(slug: string): RodzajLokalu | undefined {
  return RODZAJE_LOKALI.find((r) => r.slug === slug);
}

/**
 * Kategorie usługodawców ze specyfikacji Gościnnie.
 *
 * Firma może mieć kilka kategorii, ale jedna jest główna i to ona wyznacza
 * klasę cenową. Bez podkategorii i bez liczników: 46 podkategorii, które
 * wcześniej stały w UslugodawcyScreen, było zmyślonych.
 *
 * Slug wchodzi w adres: /uslugodawcy/[kategoria]/[miejscowosc].
 *
 * Kategorie lokalowe (restauracje, agroturystyka) nie są tutaj. Trafiają
 * do lokali, nie do usługodawców.
 */
export type KlasaCenowa = "A" | "B" | "C";

export interface Kategoria {
  slug: string;
  nazwa: string;
  klasa: KlasaCenowa;
}

export const KATEGORIE_USLUGODAWCOW: readonly Kategoria[] = [
  { slug: "catering", nazwa: "Catering", klasa: "A" },
  { slug: "zespol-muzyczny", nazwa: "Zespół muzyczny", klasa: "B" },
  { slug: "fotograf", nazwa: "Fotograf", klasa: "B" },
  { slug: "film", nazwa: "Film i wideo", klasa: "B" },
  { slug: "wodzirej", nazwa: "Wodzirej", klasa: "B" },
  { slug: "dekoracje", nazwa: "Dekoracje", klasa: "B" },
  { slug: "dj", nazwa: "DJ", klasa: "C" },
  { slug: "barman", nazwa: "Barman", klasa: "C" },
  { slug: "animator", nazwa: "Animator dla dzieci", klasa: "C" },
  { slug: "fotobudka", nazwa: "Fotobudka", klasa: "C" },
  { slug: "transport", nazwa: "Transport gości", klasa: "C" },
  { slug: "tort", nazwa: "Tort i słodki stół", klasa: "C" },
  { slug: "zaproszenia", nazwa: "Zaproszenia i papeteria", klasa: "C" },
  { slug: "florysta", nazwa: "Florysta", klasa: "C" },
] as const;

export function pobierzKategorie(): readonly Kategoria[] {
  return KATEGORIE_USLUGODAWCOW;
}

export function pobierzKategorie_(slug: string): Kategoria | undefined {
  return KATEGORIE_USLUGODAWCOW.find((k) => k.slug === slug);
}

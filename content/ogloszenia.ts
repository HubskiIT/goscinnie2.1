/**
 * Jedyne miejsce z treścią ogłoszeń.
 *
 * Typy są zgodne z przyszłym schematem bazy (docs/schemat.md, obszar katalog),
 * żeby po wejściu Drizzle zmieniło się wyłącznie wnętrze funkcji dostępu,
 * a nie ekrany.
 *
 * Zasady, których tu pilnujemy:
 * - Po jednym ogłoszeniu w każdej sekcji (punkt 6 planu).
 * - Żadnych ocen, liczby opinii ani liczników. Opinie wracają dopiero
 *   z tokenem po zrealizowanej imprezie.
 * - Każde ogłoszenie jest przykładowe, dopóki nie zastąpi go prawdziwa firma.
 *   Stąd `przykladowe: true` i etykieta na kartach oraz `noindex` w robots.
 */

export type StatusFirmy = "draft" | "active" | "visitcard" | "suspended";

export interface Miejscowosc {
  nazwa: string;
  gmina: string;
  powiat: string;
  wojewodztwo: string;
  /** Odległość od centrum miasta wojewódzkiego w kilometrach. */
  odlegloscOdCentrumKm: number;
}

export interface Lokal {
  slug: string;
  nazwa: string;
  status: StatusFirmy;
  przykladowe: boolean;
  miejscowosc: Miejscowosc;
  /** Grosze. Wymagane do publikacji, docs/schemat.md. */
  cenaOdGrosze: number | null;
  jednostkaCeny: string;
  pojemnoscMin: number | null;
  pojemnoscMax: number | null;
  opis: string;
  udogodnienia: readonly string[];
  /** Okazje, które lokal przyjmuje. Firma zaznacza je sama w kreatorze. */
  okazje: readonly string[];
}

export interface Uslugodawca {
  slug: string;
  nazwa: string;
  status: StatusFirmy;
  przykladowe: boolean;
  /** Slug z content/kategorie.ts. Główna kategoria wyznacza klasę cenową. */
  kategoriaGlowna: string;
  miejscowosc: Miejscowosc;
  zasiegDojazduKm: number;
  cenaOdGrosze: number | null;
  jednostkaCeny: string;
  opis: string;
  udogodnienia: readonly string[];
}

export interface Zlecenie {
  /** Identyfikator losowy, nie kolejny numer: adres nie może zdradzać danych klienta. */
  id: string;
  przykladowe: boolean;
  okazja: string;
  data: string;
  liczbaGosci: number;
  /** Publicznie pokazujemy wyłącznie powiat, nigdy dokładnej miejscowości. */
  powiat: string;
  opis: string;
  budzetGrosze: number | null;
}

export interface Impreza {
  slug: string;
  przykladowe: boolean;
  nazwa: string;
  okazja: string;
  /** Format ISO, żeby dzień tygodnia liczył się z daty, a nie był wpisany ręcznie. */
  data: string;
  godzinaOd: string;
  godzinaDo: string;
  lokalSlug: string;
  cenaBiletuGrosze: number;
  opis: string;
  dlaDoroslych: boolean;
}

const KOBIERZYCE: Miejscowosc = {
  nazwa: "Kobierzyce",
  gmina: "Kobierzyce",
  powiat: "wrocławski",
  wojewodztwo: "dolnośląskie",
  odlegloscOdCentrumKm: 18,
};

const TRZEBNICA: Miejscowosc = {
  nazwa: "Trzebnica",
  gmina: "Trzebnica",
  powiat: "trzebnicki",
  wojewodztwo: "dolnośląskie",
  odlegloscOdCentrumKm: 24,
};

const WROCLAW: Miejscowosc = {
  nazwa: "Wrocław",
  gmina: "Wrocław",
  powiat: "Wrocław",
  wojewodztwo: "dolnośląskie",
  odlegloscOdCentrumKm: 0,
};

const LOKALE: readonly Lokal[] = [
  {
    slug: "dwor-pod-lipami",
    nazwa: "Dwór pod Lipami",
    status: "active",
    przykladowe: true,
    miejscowosc: KOBIERZYCE,
    cenaOdGrosze: 18000,
    jednostkaCeny: "za osobę",
    pojemnoscMin: 40,
    pojemnoscMax: 140,
    opis:
      "Dwór z 1902 roku z salą balową na 140 osób i ogrodem na 40 gości. " +
      "Prowadzimy obiekt rodzinnie od czternastu lat.",
    udogodnienia: ["ogród", "nocleg dla 40 osób", "sala na wyłączność", "parking"],
    okazje: ["wesele", "komunia", "chrzciny", "urodziny", "stypa", "event-firmowy"],
  },
  {
    slug: "stary-spichlerz",
    nazwa: "Stary Spichlerz",
    // Wpis z rejestru, którego firma jeszcze nie przejęła. Zgodnie z punktem 9.8
    // planu pokazujemy tylko nazwę, kategorię i miejscowość: bez adresu i telefonu.
    status: "visitcard",
    przykladowe: true,
    miejscowosc: TRZEBNICA,
    cenaOdGrosze: null,
    jednostkaCeny: "",
    pojemnoscMin: null,
    pojemnoscMax: null,
    opis: "",
    udogodnienia: [],
    okazje: [],
  },
];

const USLUGODAWCY: readonly Uslugodawca[] = [
  {
    slug: "studio-lipowa",
    nazwa: "Studio Lipowa",
    status: "active",
    przykladowe: true,
    kategoriaGlowna: "fotograf",
    miejscowosc: WROCLAW,
    zasiegDojazduKm: 120,
    cenaOdGrosze: 420000,
    jednostkaCeny: "za dzień zdjęciowy",
    opis:
      "Reportaż z całego dnia, bez pozowanych scen. Zdjęcia oddajemy " +
      "w ciągu czterech tygodni.",
    udogodnienia: ["reportaż", "sesja plenerowa", "dwie osoby na planie"],
  },
];

const ZLECENIA: readonly Zlecenie[] = [
  {
    id: "k7m2x9",
    przykladowe: true,
    okazja: "komunia",
    data: "2027-05-16",
    liczbaGosci: 45,
    powiat: "wrocławski",
    opis:
      "Szukam sali na komunię córki. Potrzebny osobny kąt dla dzieci " +
      "i możliwość wjazdu wózkiem.",
    budzetGrosze: null,
  },
];

const IMPREZY: readonly Impreza[] = [
  {
    slug: "andrzejki-pod-lipami",
    przykladowe: true,
    nazwa: "Andrzejki pod Lipami",
    okazja: "andrzejki",
    data: "2026-11-28",
    godzinaOd: "19:00",
    godzinaDo: "03:00",
    lokalSlug: "dwor-pod-lipami",
    cenaBiletuGrosze: 18000,
    opis: "Wieczór andrzejkowy z kolacją, wróżbami i lanym woskiem. " + "Impreza dla dorosłych.",
    dlaDoroslych: true,
  },
];

export function pobierzLokale(): readonly Lokal[] {
  return LOKALE;
}

export function pobierzLokal(slug: string): Lokal | undefined {
  return LOKALE.find((l) => l.slug === slug);
}

export function pobierzUslugodawcow(): readonly Uslugodawca[] {
  return USLUGODAWCY;
}

export function pobierzUslugodawce(slug: string): Uslugodawca | undefined {
  return USLUGODAWCY.find((u) => u.slug === slug);
}

export function pobierzZlecenia(): readonly Zlecenie[] {
  return ZLECENIA;
}

export function pobierzZlecenie(id: string): Zlecenie | undefined {
  return ZLECENIA.find((z) => z.id === id);
}

export function pobierzImprezy(): readonly Impreza[] {
  return IMPREZY;
}

export function pobierzImpreze(slug: string): Impreza | undefined {
  return IMPREZY.find((i) => i.slug === slug);
}

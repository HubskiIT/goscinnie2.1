/**
 * Typy ogłoszeń i puste tablice atrap.
 *
 * Nazwa pliku jest starsza od jego roli. Kiedyś leżała tu treść całego
 * serwisu, bo baza jeszcze nie istniała. Dziś treść pochodzi z bazy, przez
 * `lib/katalog.ts` i `lib/db/queries/`, a tutaj zostały dwie rzeczy: typy,
 * z których korzystają ekrany, i puste tablice po atrapach. Powód ich
 * opróżnienia stoi niżej, przy samych tablicach.
 *
 * Typy są zgodne ze schematem bazy (docs/schemat.md, obszar katalog), więc
 * ekranom jest wszystko jedno, skąd przyszedł wpis.
 *
 * Zasady, których tu pilnujemy:
 * - Żadnych ocen, liczby opinii ani liczników. Opinie wracają dopiero
 *   z tokenem po zrealizowanej imprezie.
 * - Wpis z tego pliku jest atrapą, nie firmą. Stąd `przykladowe: true`,
 *   etykieta na kartach i `noindex` w robots. Tablice są puste, więc dziś
 *   nie dotyczy to żadnego wpisu, ale reguła obowiązuje każdy, który by tu
 *   wrócił.
 */

export type StatusFirmy = "draft" | "active" | "visitcard" | "suspended";

export interface Miejscowosc {
  /** Slug z rejestru TERYT, content/miejscowosci.json.gz. */
  slug: string;
  nazwa: string;
  gmina: string;
  powiat: string;
  wojewodztwo: string;
  /**
   * Odległość od centrum miasta wojewódzkiego w kilometrach. `null` dla firm
   * z bazy: kreator jej nie zbiera, a wpisywanie jej na oko byłoby zmyślaniem.
   */
  odlegloscOdCentrumKm: number | null;
}

export interface Lokal {
  slug: string;
  nazwa: string;
  /** Slug z content/rodzaje-lokali.ts. Pierwsze pole wyszukiwarki. */
  rodzaj: string;
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
  /**
   * Publiczny adres zdjęcia z karty.
   *
   * Opcjonalne, bo przykładowe ogłoszenia z tego pliku zdjęć nie mają i nigdy
   * nie będą miały: to atrapy, a nie prawdziwe firmy. Wypełniają je wyłącznie
   * firmy z bazy, przez lib/katalog.ts.
   */
  zdjecie?: string | null;
}

export interface Uslugodawca {
  slug: string;
  nazwa: string;
  status: StatusFirmy;
  przykladowe: boolean;
  /** Slug z content/kategorie.ts. Główna kategoria wyznacza klasę cenową. */
  kategoriaGlowna: string;
  miejscowosc: Miejscowosc;
  /** `null` dla firm z bazy, dopóki kreator nie pyta o zasięg dojazdu. */
  zasiegDojazduKm: number | null;
  cenaOdGrosze: number | null;
  jednostkaCeny: string;
  opis: string;
  udogodnienia: readonly string[];
  /** Jak w `Lokal`: wypełniają je wyłącznie firmy z bazy. */
  zdjecie?: string | null;
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

/*
 * TABLICE SĄ PUSTE I TO JEST STAN DOCELOWY.
 *
 * Do listopada 2026 leżało tu sześć atrap: dwa lokale, usługodawca, zlecenie
 * i impreza, każde z `przykladowe: true` i plakietką na karcie. Miały pokazywać
 * działanie serwisu, zanim pojawią się prawdziwe wpisy. Przestały być potrzebne
 * z chwilą, gdy katalog ruszył na prawdziwych firmach: atrapa na liście obok
 * czyjejś firmy wygląda jak konkurencja, której nie ma, a odwiedzający nie ma
 * jak odróżnić oferty od dekoracji.
 *
 * MECHANIZM ZOSTAJE, I TO CELOWO. Pole `przykladowe`, `EtykietaPrzykladu`
 * i `noindex` dla takich wpisów nie znikają razem z danymi. Wpisanie atrapy
 * z powrotem to dopisanie jednego obiektu do właściwej tablicy, a nie
 * odtwarzanie wyciętej warstwy. Gdyby mechanizm poszedł razem z treścią,
 * pierwsza prośba o podgląd oznaczałaby pisanie go od nowa.
 *
 * Wszystko, co widać teraz na ekranach, pochodzi z bazy przez `lib/katalog.ts`
 * i `lib/db/queries/`. Pusta tablica znaczy pusty katalog i każdy ekran musi
 * to znieść: stany puste są wymagane przez CLAUDE.md i mają na to testy.
 */

const LOKALE: readonly Lokal[] = [];

const USLUGODAWCY: readonly Uslugodawca[] = [];

const ZLECENIA: readonly Zlecenie[] = [];

const IMPREZY: readonly Impreza[] = [];

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

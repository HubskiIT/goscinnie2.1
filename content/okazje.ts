/**
 * Okazje.
 *
 * Po zmianie kierunku z punktu 3 planu okazja nie jest filtrem wejściowym.
 * Jest podpowiedzią, po co tu przyjść, i wejściem z wyszukiwarki na frazy
 * w rodzaju „sala na komunię Wrocław".
 *
 * `rodzajeLokali` i `kategorieUslugodawcow` wskazują slugi z sąsiednich
 * plików. To nie są liczby ani obietnice, tylko powiązania między słownikami.
 *
 * Teksty opisowe pisze właściciel (punkt 10.2 planu). Dopóki ich nie ma,
 * strona okazji pokazuje to, co wynika z danych, i nie udaje poradnika.
 */
export interface Okazja {
  slug: string;
  nazwa: string;
  /** Nazwa w zdaniu „sala na ...". Odmiana wpisana, bo okazji jest jedenaście. */
  naCo: string;
  rodzajeLokali: readonly string[];
  kategorieUslugodawcow: readonly string[];
  /** Tekst od właściciela. Pusty oznacza: sekcji nie pokazujemy. */
  opis: string;
}

export const OKAZJE: readonly Okazja[] = [
  {
    slug: "wesele",
    nazwa: "Wesele",
    naCo: "wesele",
    rodzajeLokali: ["sala-weselna", "dwor-palac", "stodola", "dom-weselny", "hotel"],
    kategorieUslugodawcow: [
      "catering",
      "zespol-muzyczny",
      "fotograf",
      "film",
      "wodzirej",
      "dekoracje",
    ],
    opis: "",
  },
  {
    slug: "komunia",
    nazwa: "Komunia",
    naCo: "komunię",
    rodzajeLokali: ["sala-bankietowa", "restauracja", "dwor-palac", "agroturystyka"],
    kategorieUslugodawcow: ["catering", "fotograf", "tort", "animator"],
    opis: "",
  },
  {
    slug: "chrzciny",
    nazwa: "Chrzciny",
    naCo: "chrzciny",
    rodzajeLokali: ["restauracja", "sala-bankietowa", "agroturystyka"],
    kategorieUslugodawcow: ["catering", "fotograf", "tort"],
    opis: "",
  },
  {
    slug: "urodziny",
    nazwa: "Urodziny",
    naCo: "urodziny",
    rodzajeLokali: ["restauracja", "klub", "sala-bankietowa", "ogrod-plener"],
    kategorieUslugodawcow: ["catering", "dj", "animator", "tort", "fotobudka"],
    opis: "",
  },
  {
    slug: "osiemnastka",
    nazwa: "Osiemnastka",
    naCo: "osiemnastkę",
    rodzajeLokali: ["klub", "sala-bankietowa", "restauracja"],
    kategorieUslugodawcow: ["dj", "fotobudka", "barman", "tort"],
    opis: "",
  },
  {
    slug: "rocznica",
    nazwa: "Rocznica",
    naCo: "rocznicę",
    rodzajeLokali: ["restauracja", "dwor-palac", "sala-bankietowa"],
    kategorieUslugodawcow: ["catering", "fotograf", "zespol-muzyczny", "tort"],
    opis: "",
  },
  {
    slug: "stypa",
    nazwa: "Stypa",
    naCo: "stypę",
    rodzajeLokali: ["restauracja", "sala-bankietowa"],
    kategorieUslugodawcow: ["catering"],
    opis: "",
  },
  {
    slug: "spotkanie-firmowe",
    nazwa: "Spotkanie firmowe",
    naCo: "spotkanie firmowe",
    rodzajeLokali: ["sala-konferencyjna", "hotel", "restauracja", "dwor-palac"],
    kategorieUslugodawcow: ["catering", "fotograf", "transport"],
    opis: "",
  },
  {
    slug: "wigilia-firmowa",
    nazwa: "Wigilia firmowa",
    naCo: "wigilię firmową",
    rodzajeLokali: ["restauracja", "sala-bankietowa", "hotel", "dwor-palac"],
    kategorieUslugodawcow: ["catering", "dj", "fotograf", "transport"],
    opis: "",
  },
  {
    slug: "andrzejki",
    nazwa: "Andrzejki",
    naCo: "andrzejki",
    rodzajeLokali: ["klub", "restauracja", "sala-bankietowa", "stodola"],
    kategorieUslugodawcow: ["dj", "barman", "fotobudka"],
    opis: "",
  },
  {
    slug: "sylwester",
    nazwa: "Sylwester",
    naCo: "sylwestra",
    rodzajeLokali: ["klub", "hotel", "restauracja", "sala-bankietowa", "dwor-palac"],
    kategorieUslugodawcow: ["catering", "dj", "zespol-muzyczny", "barman"],
    opis: "",
  },
] as const;

/**
 * Slug okazji wpisywanej przez klienta własnymi słowami.
 *
 * DLACZEGO POZA `OKAZJE`, A NIE JAKO DWUNASTA POZYCJA LISTY. Ta lista
 * napędza trzy rzeczy, do których „inna” nie pasuje:
 *
 *   - sitemapę i strony lądowania `/okazje/[okazja]`, a strona „inna”
 *     nie ma czego pokazać: nie wskazuje żadnych rodzajów lokali ani
 *     kategorii usługodawców, bo z założenia nie wiadomo, czego dotyczy,
 *   - pasek filtrów katalogu, gdzie „inna” nie zawęziłaby niczego,
 *   - kafelki okazji na stronie głównej.
 *
 * W bazie jest zwykłym wierszem `event_types`, więc `requests.event_type_id`
 * dalej ma dokąd wskazywać i nie trzeba rozluźniać klucza obcego. Nazwę
 * wpisaną przez klienta trzyma osobna kolumna `requests.custom_event_name`.
 */
export const OKAZJA_INNA = {
  slug: "inna",
  nazwa: "Inna okazja",
} as const;

/** Ile znaków może mieć okazja wpisana własnymi słowami. */
export const MAKS_ZNAKOW_INNEJ_OKAZJI = 60;

/** Najkrótsza sensowna nazwa okazji. „Bal” ma trzy znaki, „Dzień dziecka” więcej. */
export const MIN_ZNAKOW_INNEJ_OKAZJI = 3;

export function pobierzOkazje(): readonly Okazja[] {
  return OKAZJE;
}

export function pobierzOkazje_(slug: string): Okazja | undefined {
  return OKAZJE.find((o) => o.slug === slug);
}

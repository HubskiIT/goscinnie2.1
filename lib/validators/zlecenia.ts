/**
 * Walidacja wejścia dla zleceń. Zod na granicy, zgodnie z zasadą 4.
 * Ten sam schemat daje walidację i typ, więc nie ma dwóch źródeł prawdy.
 */
import { z } from "zod";
import { MAKS_ZNAKOW_INNEJ_OKAZJI, MIN_ZNAKOW_INNEJ_OKAZJI, OKAZJA_INNA } from "@/content/okazje";
import { kwotaZlotowkiOpcjonalna } from "@/lib/validators/kwoty";

/** Górna granica liczby osób. Stadion to nie wesele. */
export const MAKS_OSOB = 100_000;

/** Górny limit stronicowania. Chroni bazę przed żądaniem o dziesięć tysięcy wierszy. */
export const MAKS_LIMIT = 50;
export const DOMYSLNY_LIMIT = 20;

export const parametryListyZlecen = z.object({
  limit: z.coerce.number().int().min(1).max(MAKS_LIMIT).default(DOMYSLNY_LIMIT),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ParametryListyZlecen = z.infer<typeof parametryListyZlecen>;

/** Identyfikator zlecenia w ścieżce. UUID, nie dowolny tekst. */
export const identyfikatorZlecenia = z.uuid();

/**
 * Nowe zlecenie wystawiane przez klienta.
 *
 * Czego tu NIE MA i dlaczego:
 *
 * - **autora**. Bierze się z sesji w `utworzZlecenie`. Identyfikator autora
 *   przysłany z formularza jest wejściem, nie tożsamością.
 * - **współrzędnych**. Punkt bierzemy z wiersza miejscowości, nigdy
 *   z przeglądarki. To samo uzasadnienie co przy `daneLokalizacji` kreatora.
 * - **promienia**. Promień jest parametrem wyszukiwania po stronie firmy,
 *   a nie własnością zlecenia. W tabeli `requests` nie ma na niego kolumny
 *   i nie powinno być.
 * - **imienia i adresu**. Kontakt jest w koncie autora i odsłania go dopiero
 *   krótka lista.
 */
export const daneNowegoZlecenia = z
  .object({
    /** Slug okazji ze słownika, nie UUID: formularz nie zna `event_types.id`. */
    okazja: z
      .string()
      .trim()
      .min(1, "Wybierz okazję.")
      .max(64)
      .regex(/^[a-z0-9-]+$/, "Nieprawidłowa okazja."),

    /*
     * Okazja wpisana własnymi słowami. Puste pole zamieniamy na `null`
     * jeszcze przed sprawdzeniem zgodności z `okazja` niżej, żeby
     * formularz wysyłający pustego stringa i formularz niewysyłający
     * pola wcale dawały ten sam wynik. Bez tego wybór okazji ze słownika
     * przy pustym, ale obecnym polu tekstowym wywalałby się na regule
     * „własna nazwa tylko przy innej okazji”.
     */
    innaOkazja: z.preprocess((wartosc) => {
      if (typeof wartosc !== "string") return null;
      const przycieta = wartosc.trim();
      return przycieta === "" ? null : przycieta;
    }, z.string().nullable()),

    dataWydarzenia: z
      .string()
      .trim()
      .min(1, "Podaj datę wydarzenia.")
      .refine((w) => !Number.isNaN(Date.parse(w)), "Podaj datę w formacie rok-miesiąc-dzień.")
      .refine((w) => {
        const dzisiaj = new Date();
        dzisiaj.setHours(0, 0, 0, 0);
        return new Date(w) >= dzisiaj;
      }, "Data wydarzenia nie może być z przeszłości."),

    liczbaOsob: z.coerce
      .number({ message: "Podaj liczbę osób." })
      .int("Liczba osób musi być całkowita.")
      .min(1, "Musi być co najmniej jedna osoba.")
      .max(MAKS_OSOB, "Ta liczba wygląda na pomyłkę."),

    /*
     * Identyfikator miejscowości ze słownika, nie wpisany tekst. Z wiersza
     * `cities` bierzemy współrzędne, bez których żadne wyszukiwanie po
     * promieniu nie znajdzie tego zlecenia.
     */
    cityId: z.uuid({ message: "Wybierz miejscowość z listy podpowiedzi." }),

    opis: z
      .string()
      .trim()
      .min(20, "Opisz w kilku zdaniach, czego szukasz. Krótki opis daje przypadkowe oferty.")
      .max(2000, "Opis jest za długi."),

    budzetMin: kwotaZlotowkiOpcjonalna("Budżet"),
    budzetMax: kwotaZlotowkiOpcjonalna("Budżet"),
  })
  .refine(
    (dane) =>
      dane.budzetMin === null || dane.budzetMax === null || dane.budzetMin <= dane.budzetMax,
    { message: "Budżet od nie może być większy niż budżet do.", path: ["budzetMin"] },
  )
  /*
   * Reguła jest dwustronna i obie strony mają znaczenie.
   *
   * Brak nazwy przy „innej okazji” dałby zlecenie podpisane „Inna okazja”
   * i niczym więcej, czyli dokładnie to, czego to pole miało uniknąć.
   *
   * Nazwa przy okazji ze słownika jest groźniejsza, choć wygląda niewinnie:
   * zlecenie miałoby wtedy dwie nazwy, jedną ze słownika i jedną wpisaną,
   * a każde miejsce pokazujące okazję musiałoby rozstrzygać, która wygrywa.
   * Odmowa tutaj zamyka tę furtkę na granicy, zamiast rozsiewać warunek
   * po ekranach.
   */
  .refine((dane) => dane.okazja === OKAZJA_INNA.slug || dane.innaOkazja === null, {
    message: "Własną nazwę okazji podaje się tylko przy wyborze „Inna okazja”.",
    path: ["innaOkazja"],
  })
  .refine((dane) => dane.okazja !== OKAZJA_INNA.slug || dane.innaOkazja !== null, {
    message: "Napisz, co to za okazja.",
    path: ["innaOkazja"],
  })
  .refine((dane) => dane.innaOkazja === null || dane.innaOkazja.length >= MIN_ZNAKOW_INNEJ_OKAZJI, {
    message: `Nazwa okazji musi mieć co najmniej ${MIN_ZNAKOW_INNEJ_OKAZJI} znaki.`,
    path: ["innaOkazja"],
  })
  .refine(
    (dane) => dane.innaOkazja === null || dane.innaOkazja.length <= MAKS_ZNAKOW_INNEJ_OKAZJI,
    {
      message: `Nazwa okazji jest za długa, zmieść się w ${MAKS_ZNAKOW_INNEJ_OKAZJI} znakach.`,
      path: ["innaOkazja"],
    },
  );

export type DaneNowegoZlecenia = z.infer<typeof daneNowegoZlecenia>;

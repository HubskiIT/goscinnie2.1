/**
 * Walidacja imprezy. Zod na granicy, zgodnie z zasadą 4.
 *
 * Czego tu NIE MA i dlaczego:
 *
 * - **firmy**. Bierze się z sesji w `utworzImpreze`. Identyfikator firmy
 *   przysłany z formularza jest wejściem, nie uprawnieniem; przyjęty stąd
 *   pozwoliłby dopisać imprezę do cudzego lokalu.
 * - **sluga**. Składa go serwer z nazwy, tak samo jak przy firmie.
 *   Przysłany z przeglądarki byłby adresem do wybrania przez obcego,
 *   a slug jest niezmienny i wchodzi w link.
 * - **miejscowości**. Impreza odbywa się w lokalu i dziedziczy jego miejsce.
 */
import { z } from "zod";
import { MAKS_ZNAKOW_INNEJ_OKAZJI, MIN_ZNAKOW_INNEJ_OKAZJI, OKAZJA_INNA } from "@/content/okazje";
import { kwotaZlotowkiOpcjonalna } from "@/lib/validators/kwoty";

/** Jak daleko w przód wolno zapowiedzieć imprezę. */
export const MAKS_DNI_W_PRZOD = 730;

const godzina = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Godzina w formacie 20:00.");

export const daneNowejImprezy = z
  .object({
    nazwa: z.string().trim().min(3, "Nazwa jest za krótka.").max(120, "Nazwa jest za długa."),

    okazja: z
      .string()
      .trim()
      .min(1, "Wybierz okazję.")
      .max(64)
      .regex(/^[a-z0-9-]+$/, "Nieprawidłowa okazja."),

    innaOkazja: z.preprocess((wartosc) => {
      if (typeof wartosc !== "string") return null;
      const przycieta = wartosc.trim();
      return przycieta === "" ? null : przycieta;
    }, z.string().nullable()),

    data: z
      .string()
      .trim()
      .min(1, "Podaj datę.")
      .refine((w) => !Number.isNaN(Date.parse(w)), "Podaj datę w formacie rok-miesiąc-dzień.")
      .refine((w) => {
        const dzisiaj = new Date();
        dzisiaj.setHours(0, 0, 0, 0);
        return new Date(w) >= dzisiaj;
      }, "Impreza z przeszłości nie jest zapowiedzią.")
      .refine((w) => {
        const granica = new Date();
        granica.setDate(granica.getDate() + MAKS_DNI_W_PRZOD);
        return new Date(w) <= granica;
      }, "Ta data jest zbyt odległa."),

    godzinaOd: godzina,

    /*
     * Koniec bywa pusty i to jest poprawna odpowiedź. „Gramy do ostatniego
     * gościa” jest częstsze niż podana godzina, a wpisana na siłę byłaby
     * obietnicą, której nikt nie składał.
     */
    godzinaDo: z.preprocess((wartosc) => {
      if (typeof wartosc !== "string") return null;
      return wartosc.trim() === "" ? null : wartosc.trim();
    }, godzina.nullable()),

    /** Puste znaczy wstęp wolny, nie „nie podano”. */
    cenaBiletu: kwotaZlotowkiOpcjonalna("Cena biletu"),

    opis: z
      .string()
      .trim()
      .min(20, "Opisz w kilku zdaniach, co się będzie działo.")
      .max(2000, "Opis jest za długi."),

    dlaDoroslych: z.preprocess((wartosc) => wartosc === "on" || wartosc === "true", z.boolean()),
  })
  /*
   * Ta sama dwustronna reguła co przy zleceniu: własna nazwa okazji
   * istnieje dokładnie wtedy, gdy wybrano „inna”. Powielona świadomie,
   * bo to dwa różne formularze z własnymi komunikatami, a nie jedno
   * wejście w dwóch miejscach.
   */
  .refine((d) => d.okazja === OKAZJA_INNA.slug || d.innaOkazja === null, {
    message: "Własną nazwę okazji podaje się tylko przy wyborze „Inna okazja”.",
    path: ["innaOkazja"],
  })
  .refine((d) => d.okazja !== OKAZJA_INNA.slug || d.innaOkazja !== null, {
    message: "Napisz, co to za okazja.",
    path: ["innaOkazja"],
  })
  .refine(
    (d) =>
      d.innaOkazja === null ||
      (d.innaOkazja.length >= MIN_ZNAKOW_INNEJ_OKAZJI &&
        d.innaOkazja.length <= MAKS_ZNAKOW_INNEJ_OKAZJI),
    {
      message: `Nazwa okazji ma mieć od ${MIN_ZNAKOW_INNEJ_OKAZJI} do ${MAKS_ZNAKOW_INNEJ_OKAZJI} znaków.`,
      path: ["innaOkazja"],
    },
  )
  /*
   * Koniec po początku. Porównanie samych godzin, więc impreza trwająca
   * po północy zostawia koniec pusty; to samo ograniczenie co w bazie
   * i tam stoi jego pełne uzasadnienie.
   */
  .refine((d) => d.godzinaDo === null || d.godzinaDo > d.godzinaOd, {
    message: "Koniec ma być po początku. Przy imprezie po północy zostaw to pole puste.",
    path: ["godzinaDo"],
  });

export type DaneNowejImprezy = z.infer<typeof daneNowejImprezy>;

/** Identyfikator imprezy w ścieżce. UUID, nie dowolny tekst. */
export const identyfikatorImprezy = z.uuid();

/**
 * Walidacja decyzji moderacyjnej. Zod na granicy, zgodnie z zasadą 4.
 *
 * Osobny plik, a nie schemat przy akcji, bo plik akcji ma na górze
 * `"use server"` i wolno mu eksportować wyłącznie funkcje asynchroniczne.
 * Schemat zamknięty w takim pliku jest nietestowalny, a to jest dokładnie
 * ten kawałek, który warto sprawdzić bez bazy.
 */
import { z } from "zod";

/** Ile znaków może mieć komentarz do odmowy. */
export const MAKS_ZNAKOW_POWODU = 1000;

/**
 * Najkrótszy komentarz, który uznajemy za napisany.
 *
 * Dziesięć znaków odsiewa „nie” i „źle”, i tylko tyle ma robić. To nie
 * jest ocena jakości uzasadnienia, bo tej maszyna nie zrobi; to granica
 * między komentarzem a jego brakiem.
 */
export const MIN_ZNAKOW_POWODU = 10;

export const daneDecyzjiModeracji = z
  .object({
    zgloszenieId: z.uuid({ message: "Nieprawidłowe zgłoszenie." }),
    decyzja: z.enum(["zgoda", "odmowa"], { message: "Wybierz, co robimy z tym wpisem." }),
    powod: z
      .string()
      .trim()
      .max(MAKS_ZNAKOW_POWODU, "Komentarz jest za długi.")
      .optional()
      .transform((w) => w ?? ""),
  })
  /*
   * Odmowa bez powodu jest zakazana na granicy, a nie tylko odradzana
   * w interfejsie. Wpis odesłany bez komentarza wraca pytaniem „dlaczego”,
   * na które i tak trzeba odpowiedzieć ręcznie, więc wymuszenie powodu
   * tutaj oszczędza tę rozmowę właścicielowi i moderatorowi naraz.
   */
  .refine((d) => d.decyzja !== "odmowa" || d.powod.length >= MIN_ZNAKOW_POWODU, {
    message: `Napisz właścicielowi, co poprawić. Co najmniej ${MIN_ZNAKOW_POWODU} znaków.`,
    path: ["powod"],
  })
  /*
   * Druga strona tej samej reguły. Komentarz dopięty do zgody zapisałby
   * się w kolumnie `reason`, której CHECK w bazie pozwala być niepustą
   * wyłącznie przy odmowie, więc wpadłby tam błąd bazy zamiast błędu pola.
   * Lepiej odmówić tutaj i powiedzieć, o co chodzi.
   */
  .refine((d) => d.decyzja !== "zgoda" || d.powod === "", {
    message: "Komentarz zapisujemy tylko przy odesłaniu wpisu do poprawki.",
    path: ["powod"],
  });

export type DaneDecyzjiModeracji = z.infer<typeof daneDecyzjiModeracji>;

import { z } from "zod";

export const daneZapytaniaDoFirmy = z.object({
  companySlug: z.string().trim().min(1, "Nieprawidłowa firma."),
  imie: z.string().trim().min(2, "Podaj swoje imię.").max(80, "Imię jest za długie."),
  telefon: z.preprocess(
    (w) => (typeof w === "string" && w.trim() === "" ? null : w),
    z.string().trim().max(24, "Numer telefonu jest za długi.").nullable(),
  ),
  dataWydarzenia: z.preprocess(
    (w) => (typeof w === "string" && w.trim() === "" ? null : w),
    z
      .string()
      .trim()
      .refine((w) => !Number.isNaN(Date.parse(w)), "Podaj poprawną datę.")
      .nullable(),
  ),
  liczbaOsob: z.preprocess(
    (w) => (typeof w === "string" && w.trim() === "" ? null : w),
    z.coerce
      .number({ message: "Liczba osób musi być liczbą." })
      .int("Liczba osób musi być całkowita.")
      .min(1, "Podaj co najmniej 1 osobę.")
      .max(10000, "Liczba osób wygląda na pomyłkę.")
      .nullable(),
  ),
  wiadomosc: z
    .string()
    .trim()
    .min(10, "Napisz co najmniej 10 znaków, o co pytasz.")
    .max(2000, "Wiadomość jest za długa."),
});

export type DaneZapytaniaDoFirmy = z.infer<typeof daneZapytaniaDoFirmy>;

export const daneOdpowiedziNaZapytanie = z.object({
  zapytanieId: z.uuid({ message: "Nieprawidłowe zapytanie." }),
  odpowiedz: z
    .string()
    .trim()
    .min(5, "Napisz co najmniej 5 znaków odpowiedzi.")
    .max(2000, "Odpowiedź jest za długa."),
});

export type DaneOdpowiedziNaZapytanie = z.infer<typeof daneOdpowiedziNaZapytanie>;

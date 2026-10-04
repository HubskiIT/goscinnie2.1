import { z } from "zod";

/**
 * Schematy wejścia formularzy. Jedno miejsce, w którym opisujemy, co jest
 * poprawne, używane przez akcje serwerowe.
 *
 * Komunikaty są po polsku i mówią, co zrobić, a nie co się stało.
 */

const WYMAGANE = "To pole jest wymagane.";

const tekst = (min: number, max: number, etykieta: string) =>
  z
    .string()
    .trim()
    .min(min, min === 1 ? WYMAGANE : `${etykieta} musi mieć co najmniej ${min} znaków.`)
    .max(max, `${etykieta} może mieć najwyżej ${max} znaków.`);

const email = z.string().trim().min(1, WYMAGANE).email("To nie wygląda na adres e-mail.").max(254);

/** Data wydarzenia nie może być z przeszłości. */
const dataWydarzenia = z
  .string()
  .trim()
  .min(1, WYMAGANE)
  .refine((w) => !Number.isNaN(Date.parse(w)), "Podaj datę w formacie rok-miesiąc-dzień.")
  .refine((w) => {
    const dzisiaj = new Date();
    dzisiaj.setHours(0, 0, 0, 0);
    return new Date(w) >= dzisiaj;
  }, "Data wydarzenia nie może być z przeszłości.");

const liczbaGosci = z.coerce
  .number({ message: "Podaj liczbę gości." })
  .int("Liczba gości musi być całkowita.")
  .min(1, "Musi być co najmniej jeden gość.")
  .max(5000, "To za dużo jak na jedną uroczystość.");

/** NIP: dziesięć cyfr z poprawną cyfrą kontrolną. */
const nip = z
  .string()
  .trim()
  .transform((w) => w.replace(/[\s-]/g, ""))
  .refine((w) => /^\d{10}$/.test(w), "NIP ma dziesięć cyfr.")
  .refine((w) => {
    const wagi = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    const suma = wagi.reduce((acc, waga, i) => acc + waga * Number(w[i]), 0);
    return suma % 11 === Number(w[9]);
  }, "Ten NIP ma błędną cyfrę kontrolną.");

/** Telefon komórkowy w formacie polskim, z numerem kierunkowym albo bez. */
const telefon = z
  .string()
  .trim()
  .transform((w) => w.replace(/[\s-]/g, "").replace(/^\+48/, ""))
  .refine((w) => /^\d{9}$/.test(w), "Numer komórkowy ma dziewięć cyfr.");

export const schematZapytania = z.object({
  "q-okazja": tekst(1, 60, "Okazja"),
  "q-data": dataWydarzenia,
  "q-osoby": liczbaGosci,
  "q-tresc": tekst(20, 2000, "Treść zapytania"),
  "q-imie": tekst(2, 80, "Imię"),
  "q-mail": email,
});

export const schematZlecenia = z.object({
  "z-miasto": tekst(2, 80, "Miejscowość"),
  "z-promien": z.coerce.number().int().min(0).max(300),
  "z-data": dataWydarzenia,
  "z-osoby": liczbaGosci,
  "z-opis": tekst(20, 2000, "Opis"),
  "z-budzet": z.string().trim().max(40).optional(),
  "z-imie": tekst(2, 80, "Imię"),
  "z-mail": email,
});

export const schematKontaktu = z.object({
  "k-temat": tekst(3, 120, "Temat"),
  "k-mail": email,
  "k-tresc": tekst(20, 2000, "Treść wiadomości"),
});

export const schematZgloszenia = z.object({
  "z-adres": tekst(3, 200, "Adres wpisu"),
  "z-powod": tekst(10, 1000, "Powód zgłoszenia"),
});

export const schematRejestracji = z.object({
  "f-email": email,
  "f-haslo": tekst(10, 200, "Hasło"),
  "f-kategoria": tekst(1, 60, "Kategoria"),
  "f-nazwa": tekst(2, 120, "Nazwa"),
  "f-miejscowosc": tekst(2, 120, "Miejscowość"),
  "f-opis": tekst(20, 2000, "Opis"),
  // docs/tokeny.md zasada 2: karta bez ceny nie przechodzi moderacji
  "f-cena": tekst(1, 20, "Cena od"),
  "f-pojemnosc": z.string().trim().max(20).optional(),
  "f-nip": nip,
  "f-telefon": telefon,
});

export const schematOferty = z.object({
  "o-cena": tekst(1, 40, "Cena"),
  "o-zakres": tekst(20, 2000, "Zakres oferty"),
  "o-waznosc": dataWydarzenia,
});

export const schematAbonamentu = z.object({
  "a-nazwa": tekst(2, 200, "Nazwa podmiotu"),
  "a-nip": nip,
  "a-ulica": tekst(3, 120, "Ulica i numer"),
  "a-kod-miasto": tekst(3, 120, "Kod pocztowy i miasto"),
  "a-email": email,
});

export const schematLogowania = z.object({
  "log-mail": email,
  "log-haslo": z.string().min(1, WYMAGANE),
});

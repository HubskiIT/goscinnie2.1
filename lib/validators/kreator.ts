/**
 * Walidacja kolejnych kroków kreatora zakładania firmy.
 *
 * Każdy krok ma własny schemat, bo każdy jest osobną akcją serwerową i osobnym
 * zapisem. Jeden wielki schemat na całą firmę wymagałby trzymania częściowych
 * danych gdzieś poza bazą do samego końca, a wtedy odświeżenie przeglądarki
 * w kroku czwartym kosztowałoby wszystko, co wpisano wcześniej.
 */
import { z } from "zod";

/** Górna granica ceny. Chroni przed pomyłką o trzy zera przy wpisywaniu. */
export const MAKS_CENA_ZLOTOWKI = 1_000_000;

/** Górna granica pojemności. Stadion to nie sala weselna. */
export const MAKS_POJEMNOSC = 100_000;

/**
 * Krok 1: rodzaj ogłoszenia i kategoria.
 *
 * `kategoria` to **slug** ze słownika, nie UUID. Formularz nie ma skąd znać
 * identyfikatorów z tabeli `categories`, a `slug` jest w niej unikalny.
 * Wcześniejsza wersja wymagała tu UUID-a i dlatego krok nigdy nie przechodził
 * walidacji: ekran przysyłał slug w rodzaju „sala-weselna”.
 */
export const daneKategorii = z.object({
  kategoria: z
    .string()
    .trim()
    .min(1, "Wybierz rodzaj ogłoszenia.")
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Nieprawidłowy rodzaj ogłoszenia."),
  rodzaj: z.enum(["lokal", "usluga"], { message: "Wybierz, czy to lokal, czy usługa." }),
});

export type DaneKategorii = z.infer<typeof daneKategorii>;

/**
 * Cena w **złotówkach**, bo tyle wpisuje człowiek. Do groszy przeliczamy na
 * granicy, w jednym miejscu, a nie w komponencie i osobno w zapytaniu.
 * Pusta wartość znaczy „do uzupełnienia”, nie „za darmo”.
 */
const cenaZlotowki = z
  .union([
    z.literal(""),
    z.coerce
      .number({ message: "Cena musi być liczbą." })
      .positive("Cena musi być większa od zera.")
      .max(MAKS_CENA_ZLOTOWKI, "Ta cena wygląda na pomyłkę."),
  ])
  .transform((wartosc) => (wartosc === "" ? null : Math.round(wartosc * 100)));

const pojemnosc = z
  .union([
    z.literal(""),
    z.coerce
      .number({ message: "Pojemność musi być liczbą." })
      .int("Pojemność musi być liczbą całkowitą.")
      .min(1, "Pojemność musi być większa od zera.")
      .max(MAKS_POJEMNOSC, "Ta pojemność wygląda na pomyłkę."),
  ])
  .transform((wartosc) => (wartosc === "" ? null : wartosc));

/** Krok 2: nazwa, opis, cena i pojemność. */
export const daneOpisu = z
  .object({
    nazwa: z
      .string()
      .trim()
      .min(2, "Nazwa musi mieć co najmniej 2 znaki.")
      .max(120, "Nazwa jest za długa."),
    opis: z
      .string()
      .trim()
      .min(20, "Opis musi mieć co najmniej 20 znaków.")
      .max(2000, "Opis jest za długi."),
    cenaOd: cenaZlotowki,
    pojemnoscMin: pojemnosc,
    pojemnoscMax: pojemnosc,
  })
  .refine(
    (dane) =>
      dane.pojemnoscMin === null ||
      dane.pojemnoscMax === null ||
      dane.pojemnoscMin <= dane.pojemnoscMax,
    {
      message: "Pojemność minimalna nie może być większa od maksymalnej.",
      path: ["pojemnoscMin"],
    },
  );

export type DaneOpisu = z.infer<typeof daneOpisu>;

/**
 * Krok 2, część druga: miejscowość.
 *
 * Przysyłany jest **wyłącznie** identyfikator miejscowości ze słownika.
 * Współrzędnych z formularza nie przyjmujemy wcale: przeglądarka nie ma skąd
 * znać położenia sali, a punkt przysłany z klienta byłby polem, które da się
 * ustawić dowolnie i tym samym wejść w wyniki wyszukiwania po promieniu dla
 * cudzego miasta. Punkt bierzemy z wiersza `cities`.
 */
export const daneLokalizacji = z.object({
  cityId: z.string().uuid("Wybierz miejscowość z listy podpowiedzi."),
});

export type DaneLokalizacji = z.infer<typeof daneLokalizacji>;

/** Wagi cyfr NIP-u do sumy kontrolnej. Kolejność ma znaczenie. */
const WAGI_NIP = [6, 5, 7, 2, 3, 4, 5, 6, 7] as const;

/**
 * Suma kontrolna NIP-u.
 *
 * Reszta z dzielenia przez 11 równa 10 nie daje poprawnej cyfry kontrolnej,
 * więc taki numer nie istnieje. Bez tego warunku NIP o sumie dającej resztę 10
 * przechodziłby, gdy dziesiąta cyfra była zerem.
 */
function sumaKontrolnaNipZgadzaSie(cyfry: string): boolean {
  const suma = WAGI_NIP.reduce((acc, waga, i) => acc + waga * Number(cyfry[i]), 0);
  const reszta = suma % 11;
  return reszta !== 10 && reszta === Number(cyfry[9]);
}

/**
 * Krok 3: NIP i telefon.
 *
 * Oba normalizujemy tutaj, na granicy: do bazy trafiają same cyfry. Inaczej
 * ten sam numer zapisany raz z kreskami, raz bez, dałby dwa różne wiersze
 * i pytanie „czy ten NIP już ktoś zgłosił” przestałoby cokolwiek znaczyć.
 */
export const daneWeryfikacji = z.object({
  nip: z
    .string()
    .trim()
    .transform((w) => w.replace(/[\s-]/g, ""))
    .refine((w) => /^\d{10}$/.test(w), "NIP ma dziesięć cyfr.")
    .refine(sumaKontrolnaNipZgadzaSie, "Ten NIP ma błędną cyfrę kontrolną."),
  telefon: z
    .string()
    .trim()
    .transform((w) => w.replace(/[\s-]/g, "").replace(/^(\+48|0048)/, ""))
    .refine((w) => /^\d{9}$/.test(w), "Numer telefonu ma dziewięć cyfr."),
});

export type DaneWeryfikacji = z.infer<typeof daneWeryfikacji>;

/**
 * Walidacja danych konta. Zod na granicy, ten sam schemat po stronie
 * formularza i po stronie serwera.
 */
import { z } from "zod";

/**
 * Dwanaście znaków, bez wymogu wielkich liter, cyfr i znaków specjalnych.
 *
 * Wymuszanie składu haseł daje hasła gorsze, nie lepsze: ludzie dopisują
 * wykrzyknik na końcu i zamieniają „o” na zero, a to jest pierwsza rzecz,
 * jaką sprawdza łamacz. Długość realnie podnosi koszt ataku.
 */
export const MINIMALNA_DLUGOSC_HASLA = 12;

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: "To nie wygląda na adres e-mail." }));

export const haslo = z
  .string()
  .min(MINIMALNA_DLUGOSC_HASLA, `Hasło musi mieć co najmniej ${MINIMALNA_DLUGOSC_HASLA} znaków.`)
  // Górna granica chroni przed żądaniem, które każe argon2id przemielić
  // megabajt tekstu. Bez niej samo hashowanie staje się wektorem ataku.
  .max(200, "Hasło jest za długie.");

export const daneRejestracji = z.object({
  imie: z.string().trim().min(2, "Podaj imię.").max(80),
  email,
  haslo,
});

export const daneLogowania = z.object({
  email,
  haslo: z.string().min(1, "Podaj hasło."),
});

export const daneResetuHasla = z.object({
  email,
});

export type DaneRejestracji = z.infer<typeof daneRejestracji>;
export type DaneLogowania = z.infer<typeof daneLogowania>;
export type DaneResetuHasla = z.infer<typeof daneResetuHasla>;

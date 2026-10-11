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

/**
 * Zakładanie konta w kreatorze firmy: adres i hasło, bez imienia.
 *
 * Kreator nie pyta o imię, bo pyta o nazwę firmy w trzecim kroku, a to dwie
 * różne rzeczy: jeden człowiek może prowadzić dwie firmy. `daneRejestracji`
 * wyżej obsługuje zakładanie konta klienta, gdzie imię ma sens.
 */
export const daneRejestracjiFirmy = z.object({
  email,
  haslo,
});

export const daneLogowania = z.object({
  email,
  haslo: z.string().min(1, "Podaj hasło."),
  /**
   * „Pamiętaj mnie na tym urządzeniu".
   *
   * Niezaznaczone pole wyboru **nie trafia do FormData wcale**, więc brak
   * klucza znaczy „nie”, a nie „nie podano”. Stąd `optional` z domyślną
   * wartością, a nie `boolean`.
   */
  pamietaj: z
    .union([z.literal("on"), z.literal("")])
    .optional()
    .transform((w) => w === "on"),
});

export const daneResetuHasla = z.object({
  email,
});

/** Długość kodu potwierdzającego adres. Musi zgadzać się z `otpLength` wtyczki. */
export const DLUGOSC_KODU = 6;

export const daneWeryfikacji = z.object({
  email,
  kod: z
    .string()
    .trim()
    // Ludzie przepisują kod z maila razem ze spacjami, które wkleja się
    // razem z nim. Zdejmujemy je, zamiast odrzucać poprawny kod.
    .transform((w) => w.replace(/\s/g, ""))
    .refine((w) => w.length === DLUGOSC_KODU, `Kod ma ${DLUGOSC_KODU} cyfr.`)
    .refine((w) => /^\d+$/.test(w), "Kod składa się z samych cyfr."),
});

export const daneWyslaniaKodu = z.object({ email });

export type DaneWeryfikacji = z.infer<typeof daneWeryfikacji>;
export type DaneWyslaniaKodu = z.infer<typeof daneWyslaniaKodu>;

/** Ustawienie nowego hasła z linku. Token pochodzi z adresu, nie od człowieka. */
export const daneNowegoHasla = z.object({
  token: z.string().trim().min(1, "Brak tokenu. Otwórz link z wiadomości jeszcze raz."),
  haslo,
});

export type DaneNowegoHasla = z.infer<typeof daneNowegoHasla>;

export type DaneRejestracji = z.infer<typeof daneRejestracji>;
export type DaneRejestracjiFirmy = z.infer<typeof daneRejestracjiFirmy>;
export type DaneLogowania = z.infer<typeof daneLogowania>;
export type DaneResetuHasla = z.infer<typeof daneResetuHasla>;

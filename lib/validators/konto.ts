/**
 * Walidacja danych konta. Zod na granicy, ten sam schemat po stronie
 * formularza i po stronie serwera.
 *
 * Same reguły hasła leżą w `lib/haslo.ts`, nie tutaj. Ten plik po nich
 * iteruje, a nie powtarza ich własnymi słowami: lista pod polem w formularzu
 * i komunikaty stąd mają pochodzić z jednej tablicy, inaczej ekran ogłasza
 * jedno, a serwer egzekwuje drugie.
 */

import { z } from "zod";
import { MAKSYMALNA_DLUGOSC_HASLA, REGULY_HASLA } from "@/lib/haslo";

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: "To nie wygląda na adres e-mail." }));

export const haslo = z
  .string()
  .max(MAKSYMALNA_DLUGOSC_HASLA, "Hasło jest za długie.")
  .superRefine((wartosc, kontekst) => {
    for (const regula of REGULY_HASLA) {
      if (regula.spelnia(wartosc)) continue;
      kontekst.addIssue({ code: "custom", message: `Hasło musi mieć ${regula.opis}.` });
    }
  });

/**
 * Zgodność hasła z powtórzeniem.
 *
 * Komunikat trafia pod pole `haslo2` przez `path`, a nie pod zbiorczy klucz
 * błędów bez ścieżki. Bez tego ląduje w panelu „Popraw te pola” bez żadnego
 * wskazania, którego pola dotyczy.
 *
 * Treść jest samoopisowa, bo panel pokazuje same komunikaty, bez etykiet pól.
 */
const ZGODNOSC_HASEL = {
  message: "Hasła nie są identyczne. Wpisz to samo hasło w obu polach.",
  path: ["haslo2"],
};

const haslaZgodne = (dane: { haslo: string; haslo2: string }) => dane.haslo === dane.haslo2;

/**
 * Zakładanie konta w kreatorze firmy: adres i hasło, bez imienia.
 *
 * Kreator nie pyta o imię, bo pyta o nazwę firmy w trzecim kroku, a to dwie
 * różne rzeczy: jeden człowiek może prowadzić dwie firmy.
 */
export const daneRejestracjiFirmy = z
  .object({
    email,
    haslo,
    haslo2: z.string(),
  })
  .refine(haslaZgodne, ZGODNOSC_HASEL);

/**
 * Zakładanie konta klienta, czyli człowieka szukającego sali albo usługodawcy.
 *
 * Te same trzy pola co u firmy i celowo ani jednego więcej. Imienia nie pytamy
 * tutaj: na tym ekranie nie jest do niczego potrzebne, a pole, które można
 * uzupełnić później, nie ma prawa stać między człowiekiem a kontem. Zbiera
 * je profil na /moje.
 */
export const daneRejestracjiKlienta = z
  .object({
    email,
    haslo,
    haslo2: z.string(),
  })
  .refine(haslaZgodne, ZGODNOSC_HASEL);

/**
 * Profil klienta edytowany na /moje.
 *
 * Adresu e-mail tu nie ma: jest tożsamością konta, a jego zmiana wymaga
 * ponownego potwierdzenia skrzynki, czyli osobnej ścieżki.
 *
 * Telefon normalizujemy na granicy do dziewięciu cyfr, tym samym transformem
 * co w kreatorze firmy. Inaczej ten sam numer zapisany raz z kreskami, raz
 * z plusem i raz bez, dałby trzy różne wartości dla jednego człowieka.
 * Puste pole znaczy „nie podaję” i trafia do bazy jako brak wartości.
 */
export const daneProfiluKlienta = z.object({
  imie: z.string().trim().min(2, "Podaj imię.").max(80, "To imię jest za długie."),
  telefon: z
    .string()
    .trim()
    .transform((w) => w.replace(/[\s-]/g, "").replace(/^(\+48|0048)/, ""))
    .refine((w) => w === "" || /^\d{9}$/.test(w), "Numer telefonu ma dziewięć cyfr.")
    .transform((w) => (w === "" ? null : w)),
});

export type DaneProfiluKlienta = z.infer<typeof daneProfiluKlienta>;

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

/**
 * Kod zwrócony przez better-auth, zanim włożymy go do maila.
 *
 * Granica jak każda inna, choć po drugiej stronie jest biblioteka, a nie
 * człowiek. `createVerificationOTP` zwraca kod **bez** `ctx.json`
 * (email-otp/routes.mjs:143), więc przy `asResponse: false` kształt odpowiedzi
 * jest obietnicą, a nie gwarancją. Niesprawdzony kształt kończy się mailem
 * z pustą ramką albo z wklejonym `[object Object]` zamiast kodu — i to jest
 * awaria, której nie widać w logach, bo wysyłka się udaje.
 */
export const kodZBiblioteki = z
  .string({ message: "Biblioteka zwróciła kod w nieoczekiwanej postaci." })
  .trim()
  .regex(new RegExp(`^\\d{${DLUGOSC_KODU}}$`), `Kod z biblioteki ma mieć ${DLUGOSC_KODU} cyfr.`);

export type DaneWeryfikacji = z.infer<typeof daneWeryfikacji>;
export type DaneWyslaniaKodu = z.infer<typeof daneWyslaniaKodu>;

/** Ustawienie nowego hasła z linku. Token pochodzi z adresu, nie od człowieka. */
export const daneNowegoHasla = z
  .object({
    token: z.string().trim().min(1, "Brak tokenu. Otwórz link z wiadomości jeszcze raz."),
    haslo,
    haslo2: z.string(),
  })
  .refine(haslaZgodne, ZGODNOSC_HASEL);

export type DaneNowegoHasla = z.infer<typeof daneNowegoHasla>;

export type DaneRejestracjiFirmy = z.infer<typeof daneRejestracjiFirmy>;
export type DaneRejestracjiKlienta = z.infer<typeof daneRejestracjiKlienta>;
export type DaneLogowania = z.infer<typeof daneLogowania>;
export type DaneResetuHasla = z.infer<typeof daneResetuHasla>;

"use server";

/**
 * Potwierdzenie adresu e-mail kodem z wiadomości.
 *
 * Kod sprawdza better-auth przez wtyczkę emailOTP, a nie ten plik. Tu zostaje
 * walidacja wejścia i tłumaczenie odpowiedzi na komunikat w formularzu.
 *
 * CO TU BYŁO WCZEŚNIEJ, ŻEBY NIKT TEGO NIE PRZYWRÓCIŁ
 *
 * Poprzednia wersja **nie sprawdzała kodu w ogóle**. Znajdowała konto po
 * adresie z formularza i ustawiała `email_verified` na prawdę, więc dowolne
 * sześć cyfr potwierdzało dowolny cudzy adres. Wystarczyło znać czyjś e-mail,
 * żeby przejąć jego konto w trakcie zakładania.
 *
 * Drugi powód, dla którego to nie mogło działać inaczej: szablon maila
 * dostawał długi token better-auth, a pole w formularzu przyjmuje sześć cyfr.
 * Prawdziwy token nie miał jak przejść walidacji, więc cały krok trzymał się
 * wyłącznie na tym, że kod był ignorowany.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { StanFormularza } from "@/lib/formularze";
import { bledyZod } from "@/lib/formularze";
import { daneWeryfikacji, daneWyslaniaKodu } from "@/lib/validators/konto";

/** Dokąd trafia człowiek po potwierdzeniu adresu: prosto w kreator firmy. */
const PO_WERYFIKACJI = "/rejestracja-firmy?krok=2";

export async function zweryfikujEmail(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = daneWeryfikacji.safeParse(wejscie);

  if (!wynik.success) return bledyZod(wynik.error, wejscie);

  try {
    /*
     * Weryfikacja kodu **i** zalogowanie w jednym kroku.
     *
     * `verifyEmailOTP` zakłada sesję, więc człowiek po potwierdzeniu adresu
     * wchodzi wprost do kreatora. Bez tego trafiałby na ekran logowania
     * i wpisywał hasło, które podał minutę wcześniej.
     */
    await auth.api.verifyEmailOTP({
      body: { email: wynik.data.email, otp: wynik.data.kod },
      headers: await headers(),
      asResponse: false,
    });
  } catch (blad) {
    return bladWeryfikacji(blad, wynik.data.email);
  }

  // Poza blokiem try: przekierowanie w Next.js działa przez wyjątek, więc
  // w środku zostałoby złapane jako błąd weryfikacji.
  redirect(PO_WERYFIKACJI);
}

/**
 * Ponowne wysłanie kodu.
 *
 * Osobna akcja, bo to osobny przycisk: kod wygasa po kwadransie, a maile
 * potrafią przyjść z opóźnieniem albo wylądować w spamie. Limit żądań
 * pilnuje better-auth, nie ten formularz.
 */
export async function wyslijKodPonownie(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = daneWyslaniaKodu.safeParse(wejscie);

  if (!wynik.success) return bledyZod(wynik.error, wejscie);

  try {
    await auth.api.sendVerificationOTP({
      body: { email: wynik.data.email, type: "email-verification" },
      headers: await headers(),
    });
  } catch (blad) {
    /*
     * Przy zbyt częstym klikaniu better-auth odpowiada 429. To jedyny
     * przypadek, o którym warto powiedzieć wprost, bo inaczej człowiek
     * klika dalej i nie rozumie, czemu nic nie przychodzi.
     */
    if (kodHttp(blad) === 429) {
      return {
        status: "informacja",
        tresc: "Kod był już wysyłany przed chwilą. Odczekaj minutę i spróbuj ponownie.",
      };
    }

    /*
     * Pozostałe błędy kwitujemy tak samo jak sukces.
     *
     * „Nie ma takiego konta" powiedziane wprost zamienia ten formularz
     * w sprawdzarkę, czy dany adres jest zarejestrowany.
     */
    console.error("Ponowne wysłanie kodu:", blad);
  }

  return {
    status: "informacja",
    tresc: "Jeśli ten adres czeka na potwierdzenie, kod właśnie poleciał ponownie.",
  };
}

/** Odpowiedź better-auth na zły, wygasły albo zużyty kod. */
function bladWeryfikacji(blad: unknown, email: string): StanFormularza {
  const status = kodHttp(blad);

  if (status === 429) {
    return komunikat("kod", "Za dużo prób. Poproś o nowy kod i spróbuj za chwilę.");
  }

  /*
   * Zły kod, kod wygasły i kod już zużyty dostają **ten sam** komunikat.
   *
   * Rozróżnienie podpowiadałoby, czy trafiono w istniejące zgłoszenie, a przy
   * sześciu cyfrach taka podpowiedź jest realną pomocą dla zgadującego.
   */
  console.error(`Weryfikacja adresu ${email}:`, blad);
  return komunikat("kod", "Kod jest nieprawidłowy albo stracił ważność. Poproś o nowy.");
}

/** Kod HTTP z błędu better-auth, gdy go niesie. */
function kodHttp(blad: unknown): number | null {
  if (typeof blad !== "object" || blad === null) return null;
  const status = (blad as { status?: unknown; statusCode?: unknown }).statusCode;
  return typeof status === "number" ? status : null;
}

function komunikat(pole: string, tresc: string): StanFormularza {
  return { status: "bledy", bledy: { [pole]: [tresc] }, wartosci: {} };
}

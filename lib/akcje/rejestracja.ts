"use server";

/**
 * Zakładanie konta w pierwszym kroku kreatora firmy.
 *
 * Konto tworzy better-auth, on też wysyła kod potwierdzający adres, bo wtyczka
 * emailOTP ma włączone `sendVerificationOnSignUp`. Ten plik nie dotyka ani
 * haseł, ani sesji.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { bledyZod, type StanFormularza } from "@/lib/formularze";
import { daneRejestracjiFirmy } from "@/lib/validators/konto";

export async function zarejestrujFirme(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = daneRejestracjiFirmy.safeParse(wejscie);

  if (!wynik.success) return bledyZod(wynik.error, wejscie);

  const { email, haslo } = wynik.data;

  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password: haslo,
        /*
         * Nazwa konta to na razie część adresu przed małpą.
         *
         * Prawdziwa nazwa firmy pojawia się dopiero w trzecim kroku kreatora
         * i trafia do `companies.name`. Te dwie rzeczy są osobne celowo:
         * jeden człowiek może prowadzić dwie firmy, więc nazwa firmy nie
         * może być nazwą konta.
         */
        name: email.split("@")[0] ?? "Użytkownik",
      },
      headers: await headers(),
      asResponse: false,
    });
  } catch (blad) {
    return bladRejestracji(blad, email);
  }

  // Poza blokiem try: przekierowanie w Next.js działa przez wyjątek.
  redirect(`/weryfikacja?email=${encodeURIComponent(email)}`);
}

/**
 * Odmowa zakładania konta.
 *
 * ZAJĘTY ADRES NIE TRAFIA TUTAJ i to jest zamierzone zachowanie better-auth,
 * sprawdzone na działającej bazie: ponowne zakładanie konta na istniejący
 * adres **nie rzuca błędem**, nie tworzy drugiego konta i nie nadpisuje hasła.
 * Kończy się po cichu, tak jakby się udało.
 *
 * Powód jest ten sam, dla którego logowanie odmawia jednakowo przy złym
 * adresie i złym haśle: formularz rejestracji, który mówi „ten adres jest
 * zajęty", jest sprawdzarką, czy ktoś ma u nas konto. Wystarczy wpisywać
 * adresy i czytać odpowiedzi.
 *
 * Dla człowieka, który ma już konto i próbuje założyć drugie, wyjściem jest
 * odnośnik „mam już konto" na ekranie z kodem, a nie komunikat tutaj.
 *
 * Zostaje więc wyłącznie awaria: baza nie odpowiada, poczta nie działa.
 */
function bladRejestracji(blad: unknown, email: string): StanFormularza {
  console.error(`Zakładanie konta dla ${email}:`, blad);
  return {
    status: "bledy",
    bledy: { _: ["Nie udało się założyć konta. Spróbuj ponownie za chwilę."] },
    wartosci: { email },
  };
}

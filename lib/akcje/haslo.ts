"use server";

/**
 * Reset hasła: prośba o link i ustawienie nowego hasła.
 *
 * Link wysyła better-auth, token sprawdza better-auth, nowe hasło haszuje
 * better-auth. Tu zostaje walidacja wejścia i pilnowanie, żeby odpowiedź
 * nie zdradzała, czy konto o podanym adresie istnieje.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { bledyZod, type StanFormularza } from "@/lib/formularze";
import { daneNowegoHasla, daneResetuHasla } from "@/lib/validators/konto";

/**
 * Odpowiedź na prośbę o reset.
 *
 * Jedna i ta sama treść niezależnie od tego, czy konto istnieje. To jest
 * przypadek 20 z docs/uprawnienia.md: inaczej ten formularz staje się
 * sprawdzarką, czy dany adres jest u nas zarejestrowany, i to sprawdzarką
 * wygodniejszą od logowania, bo nie trzeba nawet zgadywać hasła.
 */
const ZAWSZE_TO_SAMO =
  "Jeśli na ten adres jest konto, wysłaliśmy link do ustawienia nowego hasła. " +
  "Link jest ważny godzinę.";

export async function poprosONoweHaslo(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = daneResetuHasla.safeParse(wejscie);

  if (!wynik.success) return bledyZod(wynik.error, wejscie);

  try {
    await auth.api.requestPasswordReset({
      body: {
        email: wynik.data.email,
        redirectTo: "/nowe-haslo",
      },
      headers: await headers(),
    });
  } catch (blad) {
    /*
     * Błąd połykamy celowo i odpowiadamy tak samo jak przy powodzeniu.
     *
     * „Nie ma takiego konta" powiedziane wprost łamie przypadek 20. Awarię
     * poczty czy bazy widać w logach, a człowiek i tak nic z nią nie zrobi
     * poza spróbowaniem ponownie.
     */
    console.error(`Prośba o reset hasła dla ${wynik.data.email}:`, blad);
  }

  return { status: "informacja", tresc: ZAWSZE_TO_SAMO };
}

export async function ustawNoweHaslo(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = daneNowegoHasla.safeParse(wejscie);

  if (!wynik.success) return bledyZod(wynik.error, wejscie);

  try {
    await auth.api.resetPassword({
      body: { newPassword: wynik.data.haslo, token: wynik.data.token },
      headers: await headers(),
    });
  } catch (blad) {
    console.error("Ustawianie nowego hasła:", blad);
    return {
      status: "bledy",
      bledy: {
        _: [
          "Ten link stracił ważność albo został już użyty. " +
            "Poproś o nowy na ekranie logowania.",
        ],
      },
      wartosci: {},
    };
  }

  /*
   * Po zmianie hasła wysyłamy na logowanie, a nie logujemy od razu.
   *
   * Kto zmienia hasło, często robi to dlatego, że ktoś inny mógł mieć dostęp
   * do konta. Świeże, jawne zalogowanie jest wtedy właściwym zakończeniem,
   * a nie sesją założoną w tle przy okazji.
   */
  redirect("/logowanie?haslo=zmienione");
}

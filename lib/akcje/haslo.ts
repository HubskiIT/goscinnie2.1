"use server";

/**
 * Zmiana zapomnianego hasła: prośba o kod i ustawienie nowego hasła.
 *
 * Kod wysyła `lib/konto/kody.ts`, a nie better-auth, bo biblioteka wołała
 * wysyłkę przez warstwę połykającą błędy. Tutaj zostaje walidacja wejścia,
 * limity i pilnowanie, żeby odpowiedź nie zdradzała, czy konto o podanym
 * adresie istnieje.
 *
 * Patrz docs/decyzje/011.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  adresIp,
  kluczKodu,
  kluczKoduIp,
  LIMIT_KODU_PO_IP,
  LIMIT_KODU_PO_KONCIE,
  zuzyjProbe,
} from "@/lib/auth/limity";
import { bledyZod, type StanFormularza } from "@/lib/formularze";
import { wyslijKodResetuHasla } from "@/lib/konto/kody";
import { KONTAKT_EMAIL } from "@/lib/serwis";
import { daneNowegoHaslaKodem, daneResetuHasla } from "@/lib/validators/konto";

/**
 * Odpowiedź na prośbę o kod.
 *
 * Jedna i ta sama treść niezależnie od tego, czy konto istnieje i czy wysyłka
 * się udała. To jest przypadek 20 z docs/uprawnienia.md: inaczej ten formularz
 * staje się sprawdzarką, czy dany adres jest u nas zarejestrowany, i to
 * sprawdzarką wygodniejszą od logowania, bo nie trzeba nawet zgadywać hasła.
 *
 * Zdanie o adresie kontaktowym jest w każdej gałęzi, więc nic nie niesie,
 * a daje wyjście komuś, do kogo kod nie dotarł.
 */
const ZAWSZE_TO_SAMO =
  "Jeśli na ten adres jest konto, wysłaliśmy sześciocyfrowy kod. Kod jest ważny 15 minut. " +
  `Jeśli wiadomość nie przyjdzie w ciągu kilku minut, napisz na ${KONTAKT_EMAIL}.`;

export async function poprosONoweHaslo(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = daneResetuHasla.safeParse(wejscie);

  if (!wynik.success) return bledyZod(wynik.error, wejscie);

  const { email } = wynik.data;
  const naglowki = await headers();

  const poKoncie = await zuzyjProbe(kluczKodu("reset", email), LIMIT_KODU_PO_KONCIE);
  const poIp = await zuzyjProbe(kluczKoduIp("reset", adresIp(naglowki)), LIMIT_KODU_PO_IP);

  if (poKoncie.wolno && poIp.wolno) {
    const wyslano = await wyslijKodResetuHasla(email);

    /*
     * JEDYNY PRZYPADEK, W KTÓRYM WOLNO POWIEDZIEĆ COŚ INNEGO.
     *
     * Awaria wykryta **przed** zajrzeniem do bazy zdarza się tak samo dla
     * adresu istniejącego i nieistniejącego, więc jej pokazanie nie zdradza
     * niczego. Awarii z samej wysyłki pokazać nie wolno: do próby wysyłki
     * dochodzi wyłącznie dla kont istniejących, więc samo pojawienie się
     * takiego komunikatu znaczyłoby „to konto istnieje".
     *
     * Na tym stoi kolejność kroków w `lib/konto/kody.ts`. Nie przestawiaj jej.
     */
    if (!wyslano.ok && wyslano.przedOdczytemKonta) {
      return {
        status: "informacja",
        waga: "ostrzezenie",
        tresc:
          "Wysyłanie wiadomości u nas nie działa. To nasza awaria, nie Twoja pomyłka. " +
          `Spróbuj za jakiś czas albo napisz na ${KONTAKT_EMAIL}.`,
      };
    }
  }

  /*
   * Sukces, nieznany adres, nieudana wysyłka i wyczerpany limit: jedno zdanie
   * i jeden odnośnik. Odnośnik też jest jednakowy — prowadzi na ekran kodu
   * niezależnie od tego, czy kod poleciał, bo inaczej jego obecność albo brak
   * zdradzałyby istnienie konta.
   */
  return {
    status: "informacja",
    tresc: ZAWSZE_TO_SAMO,
    odnosnik: {
      tekst: "Mam kod, chcę ustawić nowe hasło",
      adres: `/nowe-haslo?email=${encodeURIComponent(email)}`,
    },
  };
}

export async function ustawNoweHasloKodem(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = daneNowegoHaslaKodem.safeParse(wejscie);

  if (!wynik.success) return bledyZod(wynik.error, wejscie);

  try {
    await auth.api.resetPasswordEmailOTP({
      body: { email: wynik.data.email, otp: wynik.data.kod, password: wynik.data.haslo },
      headers: await headers(),
    });
  } catch (blad) {
    console.error(`Zmiana hasła kodem dla ${wynik.data.email}:`, blad);

    /*
     * Zły kod, wygasły, zużyty i brak konta dostają jeden komunikat.
     *
     * Rozróżnienie podpowiadałoby zgadującemu, czy trafił w istniejące
     * zgłoszenie — to ta sama zasada co przy potwierdzaniu adresu.
     */
    return {
      status: "bledy",
      bledy: { kod: ["Kod jest nieprawidłowy albo stracił ważność. Poproś o nowy."] },
      wartosci: { email: wynik.data.email },
    };
  }

  /*
   * Po zmianie hasła wysyłamy na logowanie, a nie logujemy od razu.
   *
   * Kto zmienia hasło, często robi to dlatego, że ktoś inny mógł mieć dostęp
   * do konta. Świeże, jawne zalogowanie jest wtedy właściwym zakończeniem,
   * a nie sesją założoną w tle przy okazji. Pozostałe sesje i tak zostały
   * unieważnione, patrz `revokeSessionsOnPasswordReset` w lib/auth.
   */
  redirect("/logowanie?haslo=zmienione");
}

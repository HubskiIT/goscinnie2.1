"use server";

/**
 * Logowanie i wylogowanie.
 *
 * Hasła sprawdza better-auth, sesję zakłada better-auth, ciasteczko ustawia
 * better-auth. Tu zostaje walidacja wejścia, wybór miejsca, w które trafia
 * zalogowany człowiek, i tłumaczenie odpowiedzi na komunikat w formularzu.
 *
 * Wcześniej oba formularze logowania, klienta i firmy, szły do wspólnej
 * zaślepki z lib/akcje/formularze.ts, która odpowiadała „serwis jest
 * w budowie". Nikt nie mógł się zalogować, także na konto założone minutę
 * wcześniej przez kreator.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { czlonkostwoUzytkownika } from "@/lib/auth/firma";
import { bledyZod, type StanFormularza } from "@/lib/formularze";
import { daneLogowania } from "@/lib/validators/konto";

/** Dokąd trafia zalogowany człowiek, zależnie od tego, kim jest. */
const PO_ZALOGOWANIU = {
  /** Należy do firmy: panel firmy. */
  firma: "/panel",
  /** Nie należy do żadnej firmy: jego własne zlecenia i krótka lista. */
  klient: "/moje",
} as const;

/** Adres ekranu potwierdzania kodu. */
function doWeryfikacji(email: string): string {
  return `/weryfikacja?email=${encodeURIComponent(email)}`;
}

export async function zalogujSie(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = daneLogowania.safeParse(wejscie);

  if (!wynik.success) return bledyZod(wynik.error, wejscie);

  let dokad: string;

  try {
    const odpowiedz = await auth.api.signInEmail({
      body: {
        email: wynik.data.email,
        password: wynik.data.haslo,
        /*
         * Bez zaznaczenia sesja kończy się wraz z zamknięciem przeglądarki.
         * Pole wyboru było dotąd ozdobą: nic z niego nie wynikało.
         */
        rememberMe: wynik.data.pamietaj,
      },
      headers: await headers(),
      asResponse: false,
    });

    dokad = await gdziePoZalogowaniu(odpowiedz.user.id);
  } catch (blad) {
    /*
     * Konto założone, ale adres niepotwierdzony.
     *
     * To jedyny przypadek, w którym wolno powiedzieć coś konkretnego: hasło
     * było poprawne, więc pytający i tak wie, że konto istnieje. Zamiast
     * zostawiać go z „adres lub hasło nie pasują”, odsyłamy go tam, gdzie
     * może dokończyć zakładanie konta.
     */
    if (niepotwierdzonyAdres(blad)) {
      redirect(doWeryfikacji(wynik.data.email));
    }

    return odmowaLogowania(blad);
  }

  // Poza blokiem try: przekierowanie w Next.js działa przez wyjątek.
  redirect(dokad);
}

/**
 * Wylogowanie. Unieważnia sesję po stronie serwera, nie tylko kasuje
 * ciasteczko: skasowane ciasteczko zostawiałoby w bazie sesję, której da się
 * użyć, gdyby ktoś zdążył ją wcześniej przechwycić.
 */
export async function wylogujSie(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}

/**
 * Dokąd po zalogowaniu.
 *
 * O przynależności do firmy rozstrzyga tabela `company_members`, tą samą
 * drogą co reszta systemu, a nie kolumna `role` w `users`. Kolumna mówi,
 * kim ktoś jest z grubsza, a nie w czyim imieniu działa.
 *
 * Identyfikator bierzemy z **wyniku logowania**, a nie z odczytu sesji.
 * Ciasteczko powstaje dopiero w odpowiedzi na to żądanie, więc `getSession`
 * z przychodzących nagłówków nie widzi go jeszcze i zwraca pustkę. Objawiało
 * się to tym, że właściciel firmy lądował po zalogowaniu na ekranie klienta,
 * mimo że sesja była poprawna.
 */
async function gdziePoZalogowaniu(userId: string): Promise<string> {
  const czlonkostwo = await czlonkostwoUzytkownika(userId);
  return czlonkostwo ? PO_ZALOGOWANIU.firma : PO_ZALOGOWANIU.klient;
}

/** Czy better-auth odmówił właśnie dlatego, że adres nie jest potwierdzony. */
function niepotwierdzonyAdres(blad: unknown): boolean {
  if (typeof blad !== "object" || blad === null) return false;
  const kod = (blad as { body?: { code?: unknown } }).body?.code;
  return kod === "EMAIL_NOT_VERIFIED";
}

/**
 * Odmowa logowania.
 *
 * Zły adres i złe hasło dostają **ten sam** komunikat, bez wskazania pola.
 * Rozróżnienie zamieniłoby ten formularz w sprawdzarkę, czy dany adres jest
 * zarejestrowany: wystarczyłoby wpisywać adresy z byle jakim hasłem i czytać,
 * które z nich odpowiadają „złe hasło”.
 */
function odmowaLogowania(blad: unknown): StanFormularza {
  const status =
    typeof blad === "object" && blad !== null
      ? (blad as { statusCode?: unknown }).statusCode
      : null;

  if (status === 429) {
    return {
      status: "bledy",
      bledy: { _: ["Za dużo prób logowania. Spróbuj ponownie za kilkanaście minut."] },
      wartosci: {},
    };
  }

  return {
    status: "bledy",
    bledy: { _: ["Adres lub hasło nie pasują."] },
    wartosci: {},
  };
}

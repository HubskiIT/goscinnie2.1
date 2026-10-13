"use server";

/**
 * Zakładanie konta: w kreatorze firmy i na ekranie klienta.
 *
 * Konto jest jedno i to samo w obu przypadkach. Różni je wyłącznie schemat
 * wejścia i ekran, z którego przychodzi. O tym, czy ktoś działa w imieniu
 * firmy, rozstrzyga członkostwo w `company_members`, nie sposób rejestracji.
 *
 * Konto tworzy better-auth, on też wysyła kod potwierdzający adres. Ten plik
 * nie dotyka ani haseł, ani sesji.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { oznaczKontoJakoFirmowe } from "@/lib/db/queries/konto";
import { bledyZod, type StanFormularza } from "@/lib/formularze";
import { wyslijKodPotwierdzeniaAdresu } from "@/lib/konto/kody";
import type { Widz } from "@/lib/permissions";
import { KONTAKT_EMAIL } from "@/lib/serwis";
import { daneRejestracjiFirmy, daneRejestracjiKlienta } from "@/lib/validators/konto";

/** Widz na czas rejestracji: sesji jeszcze nie ma, bo konto dopiero powstaje. */
const WIDZ_ANONIMOWY: Widz = { rodzaj: "anonim" };

export async function zarejestrujFirme(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = daneRejestracjiFirmy.safeParse(wejscie);

  if (!wynik.success) return bledyZod(wynik.error, wejscie);

  const { email, haslo } = wynik.data;

  try {
    const odpowiedz = await auth.api.signUpEmail({
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

    /*
     * Zapamiętanie, po co ktoś przyszedł, żeby po wpisaniu kodu z maila
     * trafił do kreatora, a nie na ekran klienta. Rola nie nadaje żadnych
     * uprawnień, patrz komentarz w lib/db/queries/konto.ts.
     *
     * Identyfikator bierzemy z odpowiedzi biblioteki, nigdy z formularza.
     * Widz jest anonimowy, bo sesji w tym momencie jeszcze nie ma.
     */
    await oznaczKontoJakoFirmowe(WIDZ_ANONIMOWY, odpowiedz.user.id);
  } catch (blad) {
    return bladRejestracji(blad, email);
  }

  const wyslano = await wyslijKodPotwierdzeniaAdresu(email);
  if (!wyslano.ok) return kodNieWyszedl(email);

  // Poza blokiem try: przekierowanie w Next.js działa przez wyjątek.
  redirect(`/weryfikacja?email=${encodeURIComponent(email)}`);
}

/**
 * Zakładanie konta klienta, czyli człowieka szukającego sali lub usługodawcy.
 *
 * Różnica wobec firmy jest jedna: schemat. Reszta drogi jest ta sama, bo konto
 * jest to samo. O tym, czy ktoś działa w imieniu firmy, nie rozstrzyga sposób
 * założenia konta, tylko członkostwo w `company_members`.
 */
export async function zarejestrujKlienta(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = daneRejestracjiKlienta.safeParse(wejscie);

  if (!wynik.success) return bledyZod(wynik.error, wejscie);

  const { email, haslo } = wynik.data;

  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password: haslo,
        // Nazwa konta to na razie część adresu przed małpą, tak samo jak
        // u firmy. Prawdziwe imię klient podaje w profilu na /moje.
        name: email.split("@")[0] ?? "Użytkownik",
      },
      headers: await headers(),
      asResponse: false,
    });
  } catch (blad) {
    return bladRejestracji(blad, email);
  }

  const wyslano = await wyslijKodPotwierdzeniaAdresu(email);
  if (!wyslano.ok) return kodNieWyszedl(email);

  redirect(`/weryfikacja?email=${encodeURIComponent(email)}`);
}

/**
 * Konto powstało, ale kod nie wyszedł.
 *
 * NIE PRZEKIEROWUJEMY. Ekran „sprawdź skrzynkę" przy niewysłanym mailu jest
 * kłamstwem, a człowiek czeka wtedy na kod, który nigdy nie przyjdzie — to
 * jest dokładnie ta awaria, przez którą ten plik wygląda, jak wygląda.
 *
 * KONTA NIE KASUJEMY (zasada 5 z CLAUDE.md). Zostaje niepotwierdzone, a kod
 * czeka w bazie: ponowne wysłanie z ekranu weryfikacji zadziała, gdy poczta
 * wróci. Dlatego komunikat prowadzi właśnie tam.
 *
 * Przyczyny nie pokazujemy. Tutaj akurat wolno by było, bo adres jest znany
 * — konto właśnie na niego powstało — ale „domena nadawcy niezweryfikowana"
 * nic nie mówi właścicielowi sali, a mówi obcemu człowiekowi o naszej
 * infrastrukturze. Pełna klasyfikacja jest w logu serwera.
 */
function kodNieWyszedl(email: string): StanFormularza {
  return {
    status: "informacja",
    waga: "ostrzezenie",
    tresc:
      "Konto zostało założone, ale nie udało się wysłać kodu na ten adres. " +
      `Spróbuj poprosić o kod ponownie za chwilę albo napisz na ${KONTAKT_EMAIL}.`,
    odnosnik: {
      tekst: "Przejdź do wpisywania kodu",
      adres: `/weryfikacja?email=${encodeURIComponent(email)}`,
    },
  };
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

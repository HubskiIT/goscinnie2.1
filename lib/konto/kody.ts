/**
 * Wysyłka kodów z maila: potwierdzenie adresu i zmiana hasła.
 *
 * DLACZEGO TO NIE JEST ROBOTA BETTER-AUTH. Biblioteka woła każdą funkcję
 * wysyłającą przez `runInBackgroundOrAwait`, która łapie wyjątek i zamienia
 * go na wpis w logu. Wysyłka przez nią jest wysyłką, o której awarii nikt się
 * nie dowie: rejestracja kończyła się ekranem „wpisz kod z maila" także wtedy,
 * gdy Resend odmówił. Nie ma opcji, która by to wyłączyła.
 *
 * Bierzemy więc od biblioteki tylko to, co robi dobrze — generowanie kodu,
 * zapis skrótu, datę wygaśnięcia i późniejsze sprawdzenie — przez endpoint
 * `createVerificationOTP`, który **nic nie wysyła**. Wysyłkę robimy sami,
 * więc błąd jest nasz i wraca do wywołującego.
 *
 * Moduł mieszka w `lib/konto`, a nie w `lib/poczta`, bo dotyczy kont.
 * Zależności idą w jedną stronę: `lib/konto` wie o `lib/poczta` i o `lib/auth`,
 * ale żadne z nich nie wie o `lib/konto`.
 *
 * Patrz docs/decyzje/011.
 */
import { auth } from "@/lib/auth";
import { czyKontoCzekaNaPotwierdzenie, czyKontoIstnieje } from "@/lib/db/queries/konto";
import type { Widz } from "@/lib/permissions";
import { type Nadawca, pobierzNadawce } from "@/lib/poczta";
import { BladWysylki } from "@/lib/poczta/bledy";
import { resetHaslaKodem, weryfikacjaEmail } from "@/lib/poczta/szablony";
import { kodZBiblioteki } from "@/lib/validators/konto";

/**
 * Widz dla zapytań o stan konta: anonim, bo w tym momencie nikt nie jest
 * zalogowany, a sprawdzenie dotyczy adresu, nie pytającego.
 */
const ANONIM: Widz = { rodzaj: "anonim" };

export type WynikKodu =
  | { ok: true }
  | {
      ok: false;
      blad: BladWysylki;
      /**
       * Czy awaria wyszła **przed** zajrzeniem do bazy.
       *
       * To jest rozstrzygnięcie reguły z docs/decyzje/011, a nie szczegół:
       * awaria sprzed odczytu konta zdarza się tak samo dla adresu
       * istniejącego i nieistniejącego, więc wolno ją pokazać człowiekowi,
       * który wpisał adres. Awaria z samej wysyłki pojawia się wyłącznie
       * dla kont istniejących, więc jej pokazanie zdradza, że konto istnieje.
       */
      przedOdczytemKonta: boolean;
    };

/**
 * Kod potwierdzający adres.
 *
 * `null` z `czyKontoCzekaNaPotwierdzenie` kończy się **wynikiem udanym**:
 * z punktu widzenia wywołującego nie ma różnicy między „wysłaliśmy"
 * a „nie było do kogo", i tak ma zostać.
 */
export async function wyslijKodPotwierdzeniaAdresu(
  email: string,
  nadawcaDoTestow?: Nadawca,
): Promise<WynikKodu> {
  return wyslijKod({
    email,
    rodzaj: "email-verification",
    czyWysylac: (adres) => czyKontoCzekaNaPotwierdzenie(ANONIM, adres),
    szablon: weryfikacjaEmail,
    nadawcaDoTestow,
  });
}

/** Kod do zmiany hasła. */
export async function wyslijKodResetuHasla(
  email: string,
  nadawcaDoTestow?: Nadawca,
): Promise<WynikKodu> {
  return wyslijKod({
    email,
    rodzaj: "forget-password",
    czyWysylac: (adres) => czyKontoIstnieje(ANONIM, adres),
    szablon: resetHaslaKodem,
    nadawcaDoTestow,
  });
}

async function wyslijKod(opis: {
  email: string;
  rodzaj: "email-verification" | "forget-password";
  czyWysylac: (email: string) => Promise<boolean>;
  szablon: (adres: string, kod: string) => { do: string; temat: string; html: string };
  nadawcaDoTestow?: Nadawca | undefined;
}): Promise<WynikKodu> {
  const email = opis.email.trim().toLowerCase();

  /*
   * NADAWCA PRZED BAZĄ. Ta kolejność jest regułą bezpieczeństwa, nie stylem,
   * i nie wolno jej przestawić.
   *
   * Awaria konfiguracji wychodzi tutaj, czyli zanim dowiemy się, czy konto
   * istnieje — a więc tak samo dla każdego adresu. Dopiero dzięki temu wolno
   * ją pokazać człowiekowi przy formularzu resetu hasła, nie zamieniając go
   * w sprawdzarkę adresów. Przestawienie tych dwóch kroków psuje regułę
   * z docs/decyzje/011 i wywala test „awaria konfiguracji pokazana jednakowo".
   *
   * Skutek uboczny, też pożądany: przy zepsutej konfiguracji nie zostawiamy
   * w bazie kodów, których nikt nie dostanie.
   */
  let nadawca: Nadawca;
  try {
    nadawca = opis.nadawcaDoTestow ?? (await pobierzNadawce());
  } catch (blad) {
    return odmowa(blad, true, email);
  }

  if (!(await opis.czyWysylac(email))) return { ok: true };

  let kod: string;
  try {
    /*
     * Kształtu odpowiedzi nie zakładamy. `createVerificationOTP` zwraca kod
     * bez `ctx.json` (email-otp/routes.mjs:143), więc przy `asResponse: false`
     * nie ma gwarancji, czy wróci napis, czy obiekt. Niepotwierdzony kształt
     * kończy się mailem z pustą ramką zamiast kodu.
     */
    const odpowiedz = await auth.api.createVerificationOTP({
      body: { email, type: opis.rodzaj },
    });
    kod = kodZBiblioteki.parse(odpowiedz);
  } catch (blad) {
    return odmowa(blad, false, email);
  }

  try {
    await nadawca.wyslij(opis.szablon(email, kod));
  } catch (blad) {
    return odmowa(blad, false, email);
  }

  return { ok: true };
}

function odmowa(blad: unknown, przedOdczytemKonta: boolean, email: string): WynikKodu {
  // Pełna treść zostaje w logu serwera. Na ekran idzie co najwyżej rodzaj.
  console.error(`Wysyłka kodu na ${email}:`, blad);

  const opakowany =
    blad instanceof BladWysylki
      ? blad
      : new BladWysylki({
          komunikat: blad instanceof Error ? blad.message : String(blad),
          klasyfikacja: { rodzaj: "nieznany", kodResend: null, zaleznyOdOdbiorcy: false },
        });

  return { ok: false, blad: opakowany, przedOdczytemKonta };
}

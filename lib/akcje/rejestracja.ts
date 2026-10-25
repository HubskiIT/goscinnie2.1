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

/**
 * Kształt identyfikatora prawdziwego konta.
 *
 * Identyfikatory generuje Postgres przez `gen_random_uuid()`, bo
 * `advanced.database.generateId` jest ustawione na `false` w lib/auth. Każdy
 * identyfikator pochodzący z bazy przechodzi ten wzorzec.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Czy better-auth oddał atrapę konta zamiast konta.
 *
 * Przy zajętym adresie i `requireEmailVerification: true` biblioteka **nie
 * rzuca**: zwraca udaną odpowiedź z użytkownikiem zmyślonym na miejscu, żeby
 * odpowiedź dla zajętego adresu nie różniła się od odpowiedzi dla wolnego
 * (api/routes/sign-up.mjs:200-210, `buildGenericDuplicateResponse`).
 *
 * Ten zmyślony identyfikator powstaje przez `generateId()` z rdzenia
 * biblioteki, czyli jest ciągiem 32 znaków alfanumerycznych, a nie uuid-em.
 * Stąd to sprawdzenie i stąd jego miejsce: **przed** dotknięciem bazy.
 * Zapytanie `where id = $1` o kolumnę uuid kończy się na takim ciągu błędem
 * Postgresa 22P02, a ten wpada do `catch` i zamienia zajęty adres w ogólnik
 * „nie udało się założyć konta”. Dokładnie to zgłaszały firmy.
 *
 * Rozpoznajemy po kształcie, nie po `token: null`: przy włączonym
 * potwierdzaniu adresu token jest pusty także dla prawdziwego, świeżego konta.
 */
function adresBylZajety(userId: string): boolean {
  return !UUID.test(userId);
}

/**
 * Odmowa, bo konto na ten adres już istnieje.
 *
 * Błąd pod kluczem `email`, nie `_`: formularz rysuje błędy pól obok pól,
 * a `_` jako ogólną czerwoną ramkę bez wskazania, co poprawić.
 *
 * ŚWIADOMIE MÓWIMY WPROST, ŻE ADRES JEST ZAJĘTY. Wcześniej stała tu odmowa
 * milcząca, żeby formularz nie służył do sprawdzania, kto ma u nas konto.
 * Powód zmiany: cisza i tak nie była ciszą. Ścieżka firmy wywalała się na
 * 22P02 i pokazywała ogólnik, a ścieżka klienta odsyłała na ekran wpisywania
 * kodu, którego `wyslijKodPotwierdzeniaAdresu` nie wysyła dla potwierdzonego
 * konta. Człowiek czekał na maila, którego nikt nie nadał.
 *
 * Czego nie wolno przy tym zgubić: ten formularz musi mieć limit prób, tak
 * jak go ma logowanie w `lib/auth/limity.ts`. Bez limitu jawny komunikat
 * zamienia rejestrację w narzędzie do przemiatania listy adresów.
 */
function adresZajety(email: string): StanFormularza {
  return {
    status: "bledy",
    bledy: {
      email: [
        "Konto z tym adresem już istnieje. Zaloguj się albo odzyskaj hasło, " +
          "jeśli go nie pamiętasz.",
      ],
    },
    wartosci: { email },
  };
}

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

    // Przed bazą, bo atrapa niesie identyfikator, który nie jest uuid-em.
    if (adresBylZajety(odpowiedz.user.id)) return adresZajety(email);

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
    const odpowiedz = await auth.api.signUpEmail({
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

    /*
     * Tu nie ma zapisu do bazy, więc nic się nie wywala, ale bez tego
     * sprawdzenia akcja przekierowywała na /weryfikacja, a kod nie wychodził:
     * `czyKontoCzekaNaPotwierdzenie` słusznie odmawia wysyłki dla konta już
     * potwierdzonego. Ekran prosił o kod, którego nikt nie nadał.
     */
    if (adresBylZajety(odpowiedz.user.id)) return adresZajety(email);
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
 * Odmowa zakładania konta, czyli awaria: baza nie odpowiada, poczta nie działa.
 *
 * ZAJĘTY ADRES NIE TRAFIA TUTAJ, ale nie dlatego, że better-auth go przepuszcza.
 * Biblioteka faktycznie **nie rzuca** przy duplikacie, nie tworzy drugiego
 * konta i nie nadpisuje hasła, co sprawdza `tests/konto.test.ts`. Rzecz w tym,
 * że oddaje wtedy atrapę użytkownika, a jej identyfikator nie jest uuid-em.
 * Wcześniej ten ciąg leciał prosto do `oznaczKontoJakoFirmowe`, Postgres
 * odrzucał go błędem 22P02 i zajęty adres kończył **właśnie tutaj**, jako
 * ogólnik „nie udało się założyć konta”.
 *
 * Teraz zajęty adres rozpoznaje `adresBylZajety` przed dotknięciem bazy
 * i odpowiada `adresZajety`. Jeśli ten ogólnik znów zacznie się pokazywać przy
 * zakładaniu konta, sprawdź najpierw log niżej: to znaczy, że rzuciło coś
 * innego, a nie duplikat.
 */
function bladRejestracji(blad: unknown, email: string): StanFormularza {
  console.error(`Zakładanie konta dla ${email}:`, blad);
  return {
    status: "bledy",
    bledy: { _: ["Nie udało się założyć konta. Spróbuj ponownie za chwilę."] },
    wartosci: { email },
  };
}

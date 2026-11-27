"use server";

/**
 * Wystawienie zlecenia przez klienta.
 *
 * Co tu jest: walidacja wejścia, ustalenie widza i tłumaczenie wyniku na stan
 * formularza. SQL-u nie ma ani jednej linii, bo cały mieszka
 * w `lib/db/queries/requests.ts` — zasada 3 z CLAUDE.md.
 *
 * Bariery są dwie i każda działa sama: ta akcja odsyła anonima do rejestracji,
 * a `utworzZlecenie` odmawia mu, zanim dotknie bazy. Testy zdejmują je po
 * jednej, bo bariera, której nie da się sprawdzić osobno, znika przy pierwszym
 * refaktorze i nikt tego nie zauważy.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adresAplikacji } from "@/lib/adres";
import { widzZZadania } from "@/lib/auth/widz";
import {
  type OdmowaZlecenia,
  pobierzOdbiorcowPowiadomieniaOZleceniu,
  utworzZlecenie,
} from "@/lib/db/queries/requests";
import { bledyZod, type StanFormularza } from "@/lib/formularze";
import { pobierzNadawce } from "@/lib/poczta";
import { TRASY } from "@/lib/trasy";
import { daneNowegoZlecenia } from "@/lib/validators/zlecenia";

/** Komunikaty odmowy z warstwy uprawnień i zapisu, w języku formularza. */
const KOMUNIKAT_ODMOWY: Record<OdmowaZlecenia, string> = {
  "brak-dostepu": "Żeby wystawić zlecenie, musisz być zalogowany.",
  "brak-abonamentu": "Ta czynność wymaga aktywnego abonamentu.",
  "oferta-juz-zlozona": "To zgłoszenie już istnieje.",
  "limit-planu-wyczerpany": "Wyczerpałeś limit w swoim planie.",
  "zlecenie-nie-przyjmuje-ofert": "To zlecenie nie przyjmuje już zgłoszeń.",
  "nieznana-okazja": "Wybierz okazję z listy.",
  /*
   * Ten komunikat nie powinien się nigdy pokazać człowiekowi: formularz
   * nie potrafi wysłać takiej pary, bo Zod odrzuca ją wcześniej. Zostaje
   * dla wywołań spoza formularza i dlatego mówi, co jest nie tak, a nie
   * "spróbuj ponownie".
   */
  "niezgodna-wlasna-okazja":
    "Własną nazwę okazji podaje się tylko przy wyborze „Inna okazja”, i wtedy jest wymagana.",
  "miejscowosc-bez-wspolrzednych":
    "Tej miejscowości nie mamy na mapie, więc firmy nie znalazłyby Twojego zlecenia. " +
    "Wybierz najbliższą większą miejscowość.",
};

export async function dodajZlecenie(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = daneNowegoZlecenia.safeParse(wejscie);

  if (!wynik.success) return bledyZod(wynik.error, wejscie);

  /*
   * Pierwsza bariera. Anonim nie dostaje komunikatu w formularzu, tylko
   * trafia na rozdroże rejestracji: wypełniony formularz czeka na niego
   * w przeglądarce i wraca po założeniu konta.
   */
  const widz = await widzZZadania(await headers());
  if (widz.rodzaj === "anonim") redirect(TRASY.rejestracja);

  const zapis = await utworzZlecenie(widz, wynik.data);

  if (!zapis.ok) {
    const pole = zapis.powod === "miejscowosc-bez-wspolrzednych" ? "cityId" : "_";
    return {
      status: "bledy",
      bledy: { [pole]: [KOMUNIKAT_ODMOWY[zapis.powod]] },
      wartosci: {},
    };
  }

  try {
    const odbiorcy = await pobierzOdbiorcowPowiadomieniaOZleceniu(widz, wynik.data.cityId);
    if (odbiorcy.length > 0) {
      const nadawca = await pobierzNadawce();
      await Promise.allSettled(
        odbiorcy.map((email) =>
          nadawca.wyslij({
            do: email,
            temat: `Nowe zlecenie (${wynik.data.liczbaOsob} osób) w Twoim powiecie — Gościnnie`,
            html: `<p>W Twoim powiecie pojawiło się nowe zlecenie na <strong>${wynik.data.liczbaOsob} osób</strong> (${wynik.data.dataWydarzenia}).</p><p><a href="${adresAplikacji()}/zlecenia/${zapis.dane.id}">Zobacz szczegóły i złóż ofertę</a></p>`,
          }),
        ),
      );
    }
  } catch {
    // Awaria poczty nie cofa wystawionego zlecenia.
  }

  // Poza blokiem warunkowym: przekierowanie w Next.js działa przez wyjątek.
  redirect(TRASY.moje);
}

"use server";

/**
 * Akcje kolejnych kroków kreatora zakładania firmy.
 *
 * Co tu jest, a czego nie ma: tu jest walidacja wejścia, ustalenie widza
 * i tłumaczenie wyniku na stan formularza. SQL-u nie ma ani jednej linii,
 * bo cały mieszka w `lib/db/queries/kreator.ts` — zasada 3 z CLAUDE.md.
 *
 * Firmy nie bierzemy z formularza. Każda akcja odnajduje szkic po sesji,
 * przez `pobierzSzkicFirmy`. Identyfikator przysłany z przeglądarki byłby
 * polem, które da się podmienić, czyli drogą do zapisywania w cudzej firmie,
 * a dodatkowo gubiłby się przy odświeżeniu strony.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ZodType } from "zod";
import { widzZZadania } from "@/lib/auth/widz";
import {
  opublikujSzkic,
  pobierzSzkicFirmy,
  sprawdzGotowoscSzkicu,
  zapiszKategorieSzkicu,
  zapiszLokalizacjeSzkicu,
  zapiszOpisSzkicu,
  zapiszWeryfikacjeSzkicu,
} from "@/lib/db/queries/kreator";
import type { StanFormularza } from "@/lib/formularze";
import type { PowodOdmowy, Widz } from "@/lib/permissions";
import {
  daneKategorii,
  daneLokalizacji,
  daneOpisu,
  daneWeryfikacji,
} from "@/lib/validators/kreator";

/** Ile dni trwa darmowy okres próbny, dopóki PayU jest wyłączone. */
const DNI_OKRESU_PROBNEGO = 30;

type WynikWalidacji<T> = { ok: true; dane: T } | { ok: false; stan: StanFormularza };

/**
 * Walidacja wejścia formularza.
 *
 * Wpisane wartości wracają do pól razem z błędami, żeby nieudana walidacja
 * nie kasowała tego, co człowiek właśnie napisał.
 */
function sprawdz<T>(schemat: ZodType<T>, dane: FormData): WynikWalidacji<T> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = schemat.safeParse(wejscie);

  if (wynik.success) return { ok: true, dane: wynik.data };

  const bledy: Record<string, string[]> = {};
  for (const problem of wynik.error.issues) {
    const pole = String(problem.path[0] ?? "_");
    bledy[pole] = [...(bledy[pole] ?? []), problem.message];
  }

  const wartosci: Record<string, string> = {};
  for (const [pole, wartosc] of Object.entries(wejscie)) {
    if (typeof wartosc === "string") wartosci[pole] = wartosc;
  }

  return { ok: false, stan: { status: "bledy", bledy, wartosci } };
}

/** Komunikaty odmowy z warstwy uprawnień, w języku formularza. */
const KOMUNIKAT_ODMOWY: Record<PowodOdmowy, string> = {
  "brak-dostepu": "Nie znaleziono Twojej firmy. Zacznij od pierwszego kroku.",
  "brak-abonamentu": "Ten krok wymaga aktywnego abonamentu.",
  "oferta-juz-zlozona": "To zgłoszenie już istnieje.",
  "limit-planu-wyczerpany": "Wyczerpałeś limit w swoim planie.",
  "zlecenie-nie-przyjmuje-ofert": "To zlecenie nie przyjmuje już zgłoszeń.",
};

function odmowa(powod: PowodOdmowy): StanFormularza {
  return { status: "bledy", bledy: { _: [KOMUNIKAT_ODMOWY[powod]] }, wartosci: {} };
}

function bladPola(pole: string, komunikat: string): StanFormularza {
  return { status: "bledy", bledy: { [pole]: [komunikat] }, wartosci: {} };
}

/**
 * Widz dla kreatora. Brak sesji kończy się przekierowaniem do logowania,
 * a nie błędem w formularzu: niezalogowany człowiek nie ma gdzie zapisać firmy.
 */
async function widzKreatora(): Promise<Widz> {
  const widz = await widzZZadania(await headers());
  if (widz.rodzaj === "anonim") redirect("/logowanie");
  return widz;
}

/**
 * Szkic, na którym pracuje ten człowiek.
 *
 * `null` znaczy „nie zaczął zakładać firmy”. Każdy krok poza pierwszym
 * sprawdza to sam, bo na każdy można wejść wprost z adresu, pomijając
 * poprzednie.
 */
async function szkicAlboOdmowa(
  widz: Widz,
): Promise<{ ok: true; companyId: string } | { ok: false; stan: StanFormularza }> {
  const szkic = await pobierzSzkicFirmy(widz);
  if (!szkic) return { ok: false, stan: odmowa("brak-dostepu") };
  return { ok: true, companyId: szkic.id };
}

/** Krok 1: rodzaj ogłoszenia i kategoria. Tu powstaje szkic firmy. */
export async function zapiszKrokKategoria(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = sprawdz(daneKategorii, dane);
  if (!wejscie.ok) return wejscie.stan;

  const widz = await widzKreatora();
  const wynik = await zapiszKategorieSzkicu(widz, wejscie.dane.kategoria);

  if (!wynik.ok) {
    /*
     * Jedyna odmowa, jaką może tu zwrócić warstwa zapytań, to kategoria spoza
     * słownika, więc komunikat trafia pod pole kategorii, a nie pod formularz.
     * Dla zalogowanego człowieka ten krok nie ma innej drogi odmowy.
     */
    return bladPola("kategoria", "Nie znamy takiego rodzaju ogłoszenia. Wybierz z listy.");
  }

  return { status: "zapisano" };
}

/** Krok 2: nazwa, opis, cena i pojemność. */
export async function zapiszKrokOpis(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = sprawdz(daneOpisu, dane);
  if (!wejscie.ok) return wejscie.stan;

  const widz = await widzKreatora();
  const szkic = await szkicAlboOdmowa(widz);
  if (!szkic.ok) return szkic.stan;

  const wynik = await zapiszOpisSzkicu(widz, szkic.companyId, wejscie.dane);
  if (!wynik.ok) return odmowa(wynik.powod);

  return { status: "zapisano" };
}

/**
 * Krok 2, część druga: miejscowość.
 *
 * Osobna akcja, a nie kolejne pola w `zapiszKrokOpis`, bo zapisuje do innej
 * kolumny i ma własny tryb odmowy: miejscowość bez współrzędnych.
 */
export async function zapiszKrokLokalizacja(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = sprawdz(daneLokalizacji, dane);
  if (!wejscie.ok) return wejscie.stan;

  const widz = await widzKreatora();
  const szkic = await szkicAlboOdmowa(widz);
  if (!szkic.ok) return szkic.stan;

  const wynik = await zapiszLokalizacjeSzkicu(widz, szkic.companyId, wejscie.dane.cityId);

  if (!wynik.ok) {
    if (wynik.powod === "miejscowosc-bez-wspolrzednych") {
      return bladPola(
        "cityId",
        "Nie mamy współrzędnych tej miejscowości, więc klienci nie znaleźliby " +
          "Cię w wyszukiwaniu po okolicy. Wybierz najbliższą większą miejscowość.",
      );
    }
    return odmowa(wynik.powod);
  }

  return { status: "zapisano" };
}

/** Krok 3: NIP i telefon. */
export async function zapiszKrokDaneKontaktowe(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = sprawdz(daneWeryfikacji, dane);
  if (!wejscie.ok) return wejscie.stan;

  const widz = await widzKreatora();
  const szkic = await szkicAlboOdmowa(widz);
  if (!szkic.ok) return szkic.stan;

  const wynik = await zapiszWeryfikacjeSzkicu(widz, szkic.companyId, wejscie.dane);
  if (!wynik.ok) return odmowa(wynik.powod);

  return { status: "zapisano" };
}

/** Czego brakuje do publikacji, w języku formularza. */
const NAZWA_BRAKU = {
  kategoria: "rodzaju ogłoszenia",
  nazwa: "nazwy firmy",
  opis: "opisu działalności",
  lokalizacja: "miejscowości",
  nip: "NIP-u",
} as const;

/**
 * Ostatni krok: publikacja.
 *
 * Kompletność sprawdzamy **po stronie serwera**, a nie na podstawie tego, że
 * kreator przeprowadził człowieka przez wszystkie kroki. Na ostatni krok da się
 * wejść wprost z adresu, a firma bez lokalizacji albo bez kategorii nie pojawi
 * się ani w wyszukiwaniu, ani w katalogu.
 *
 * Dopóki PayU jest wyłączone, publikacja daje darmowy okres próbny.
 */
export async function wyslijDoZatwierdzenia(
  _poprzedni: StanFormularza,
  _dane: FormData,
): Promise<StanFormularza> {
  const widz = await widzKreatora();

  const gotowosc = await sprawdzGotowoscSzkicu(widz);
  if (!gotowosc.ok) return odmowa(gotowosc.powod);

  if (gotowosc.dane.braki.length > 0) {
    const czego = gotowosc.dane.braki.map((brak) => NAZWA_BRAKU[brak]).join(", ");
    return {
      status: "bledy",
      bledy: { _: [`Do publikacji brakuje jeszcze: ${czego}. Wróć do wcześniejszych kroków.`] },
      wartosci: {},
    };
  }

  const payuDziala = Boolean(process.env.PAYU_CLIENT_ID && process.env.PAYU_CLIENT_SECRET);

  // Z PayU: wybór planu i płatność. Bez PayU: darmowy okres próbny od razu.
  if (payuDziala) redirect("/panel/wybierz-plan");

  const wygasaO = new Date();
  wygasaO.setDate(wygasaO.getDate() + DNI_OKRESU_PROBNEGO);

  const wynik = await opublikujSzkic(widz, gotowosc.dane.companyId, wygasaO);
  if (!wynik.ok) return odmowa(wynik.powod);

  redirect("/panel/profil?opublikowano=1");
}

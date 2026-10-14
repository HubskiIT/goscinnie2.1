"use server";

/**
 * Zdjęcia profilu firmy: dodanie i usunięcie.
 *
 * SQL-u tu nie ma, bo cały mieszka w `lib/db/queries/zdjecia.ts`. Tu zostaje
 * walidacja wejścia, obróbka pliku, wysyłka do Storage i tłumaczenie wyniku
 * na stan formularza.
 *
 * Firmy nie bierzemy z formularza. Akcja odnajduje szkic po sesji, tak samo
 * jak pozostałe kroki kreatora: identyfikator przysłany z przeglądarki byłby
 * polem, które da się podmienić, czyli drogą do wstawiania zdjęć w cudzym
 * profilu.
 *
 * KOLEJNOŚĆ MA ZNACZENIE: najpierw plik ląduje w Storage, potem powstaje
 * wiersz w bazie. Odwrotna kolejność zostawia w bazie zdjęcie, którego nie ma
 * — czyli dziurę na karcie w katalogu. Tak zostaje najwyżej plik bez wiersza,
 * czyli bajty, których nikt nie zobaczy.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { widzZZadania } from "@/lib/auth/widz";
import { pobierzSzkicFirmy } from "@/lib/db/queries/kreator";
import { dodajZdjecie, MAKS_ZDJEC, usunZdjecie } from "@/lib/db/queries/zdjecia";
import type { StanFormularza } from "@/lib/formularze";
import { KONTAKT_EMAIL } from "@/lib/serwis";
import { MAKS_BAJTOW, type PowodOdrzucenia, przygotujZdjecie } from "@/lib/zdjecia/obrobka";
import { sciezkaZdjecia, wyslijZdjecie } from "@/lib/zdjecia/skladowanie";

const MEGABAJTY = Math.round(MAKS_BAJTOW / (1024 * 1024));

/** Komunikaty odmowy przy obróbce, w języku człowieka. */
const KOMUNIKAT_ODRZUCENIA: Record<PowodOdrzucenia, string> = {
  typ: "Przyjmujemy zdjęcia JPEG, PNG, WebP i HEIC z iPhone'a. Ten plik jest w innym formacie.",
  rozmiar: `Zdjęcie waży za dużo. Przyjmujemy pliki do ${MEGABAJTY} MB.`,
  nieczytelne: "Nie udało się odczytać tego pliku. Spróbuj innego zdjęcia.",
};

function blad(komunikat: string): StanFormularza {
  return { status: "bledy", bledy: { zdjecie: [komunikat] }, wartosci: {} };
}

export async function dodajZdjecieFirmy(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const plik = dane.get("zdjecie");

  if (!(plik instanceof File) || plik.size === 0) {
    return blad("Wybierz plik ze zdjęciem.");
  }

  const widz = await widzZZadania(await headers());
  if (widz.rodzaj === "anonim") redirect("/logowanie");

  const szkic = await pobierzSzkicFirmy(widz);
  if (!szkic) return blad("Nie znaleziono Twojej firmy. Zacznij od pierwszego kroku kreatora.");

  const obrobione = await przygotujZdjecie(Buffer.from(await plik.arrayBuffer()), plik.type);
  if (!obrobione.ok) return blad(KOMUNIKAT_ODRZUCENIA[obrobione.powod]);

  const sciezka = sciezkaZdjecia(szkic.id, Date.now());
  const wyslane = await wyslijZdjecie(sciezka, obrobione.zdjecie.dane);

  if (!wyslane.ok) {
    /*
     * Pełna treść do logu, na ekran ogólnik. Firma nie poradzi sobie
     * z informacją o kluczu do Storage, a nam ta informacja jest potrzebna.
     */
    console.error(`Wysyłka zdjęcia firmy ${szkic.id}:`, wyslane.blad.opis);
    return blad(
      `Nie udało się zapisać zdjęcia. Spróbuj za chwilę albo napisz na ${KONTAKT_EMAIL}.`,
    );
  }

  const zapis = await dodajZdjecie(widz, szkic.id, {
    sciezka,
    szerokosc: obrobione.zdjecie.szerokosc,
    wysokosc: obrobione.zdjecie.wysokosc,
  });

  if (!zapis.ok) {
    if (zapis.powod === "limit-zdjec") {
      return blad(`Masz już ${MAKS_ZDJEC} zdjęć. Usuń któreś, żeby zrobić miejsce na nowe.`);
    }
    return blad("Nie masz prawa zmieniać zdjęć tej firmy.");
  }

  return { status: "zapisano" };
}

export async function usunZdjecieFirmy(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const zdjecieId = dane.get("zdjecieId");
  if (typeof zdjecieId !== "string" || zdjecieId === "") {
    return blad("Nie wiadomo, które zdjęcie usunąć.");
  }

  const widz = await widzZZadania(await headers());
  if (widz.rodzaj === "anonim") redirect("/logowanie");

  const szkic = await pobierzSzkicFirmy(widz);
  if (!szkic) return blad("Nie znaleziono Twojej firmy.");

  const wynik = await usunZdjecie(widz, szkic.id, zdjecieId);
  if (!wynik.ok) return blad("Nie udało się usunąć tego zdjęcia.");

  return { status: "zapisano" };
}

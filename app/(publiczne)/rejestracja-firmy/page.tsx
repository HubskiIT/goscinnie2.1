import type { Metadata } from "next";
import { headers } from "next/headers";
import { RejestracjaFirmyScreen } from "@/components/screens/RejestracjaFirmyScreen.v2";
import { widzZZadania } from "@/lib/auth/widz";
import { pobierzSzkicFirmy } from "@/lib/db/queries/kreator";
import type { SzkicKreatora } from "@/lib/kreator-krok";

export const metadata: Metadata = {
  title: "Dodaj firmę",
  description: "Dodaj swoją firmę do katalogu Gościnnie.",
};

/**
 * Kreator nie trzyma stanu w adresie ani w pamięci przeglądarki.
 *
 * Szkic firmy czytamy z bazy przy każdym wejściu, więc odświeżenie strony,
 * zamknięcie karty i powrót nazajutrz wracają na ten krok, na którym człowiek
 * skończył, z wypełnionymi polami. Wcześniej stan żył wyłącznie w `useState`,
 * więc odświeżenie w kroku czwartym kasowało wszystko i zaczynało od konta.
 */
export default async function Strona() {
  const widz = await widzZZadania(await headers());
  const szkic = await pobierzSzkicFirmy(widz);

  const doKreatora: SzkicKreatora | null = szkic && {
    nazwa: szkic.nazwa,
    opis: szkic.opis,
    cenaOd: szkic.cenaOd,
    pojemnoscMin: szkic.pojemnoscMin,
    pojemnoscMax: szkic.pojemnoscMax,
    kategoria: szkic.kategoria,
    miejscowosc: szkic.miejscowosc,
    // Identyfikator miejscowości ma sens tylko wtedy, gdy lokalizacja jest
    // zapisana na serio. Szkic bez współrzędnych wskazuje wiersz wybrany
    // wyłącznie po to, żeby wypełnić kolumnę `not null`.
    cityId: szkic.maWspolrzedne ? szkic.cityId : null,
    maNip: szkic.maNip,
    opublikowany: szkic.status === "active",
  };

  // Zalogowany człowiek ma krok pierwszy (zakładanie konta) za sobą, nawet
  // jeśli jeszcze nie tknął kreatora.
  return <RejestracjaFirmyScreen szkic={doKreatora} zalogowany={widz.rodzaj !== "anonim"} />;
}

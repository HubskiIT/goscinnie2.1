import type { Metadata } from "next";
import { headers } from "next/headers";
import { RejestracjaFirmyScreen } from "@/components/screens/RejestracjaFirmyScreen.v2";
import type { ZdjecieDoPokazania } from "@/lib/akcje/zdjecia";
import { widzZZadania } from "@/lib/auth/widz";
import { pobierzSzkicFirmy } from "@/lib/db/queries/kreator";
import { pobierzZdjeciaFirmy } from "@/lib/db/queries/zdjecia";
import type { SzkicKreatora } from "@/lib/kreator-krok";
import { adresZdjecia } from "@/lib/zdjecia/skladowanie";

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

  /*
   * Zdjęcia czytamy tu, a nie akcją `mojeZdjecia` z komponentu, z dwóch
   * powodów. Pierwszy: galeria ma być na miejscu od pierwszego rysowania,
   * bez mignięcia pustką. Drugi: ta strona jest publiczna, bo krok pierwszy
   * to zakładanie konta, a `mojeZdjecia` odsyła anonima na logowanie.
   */
  const zdjecia: ZdjecieDoPokazania[] = szkic
    ? (await pobierzZdjeciaFirmy(widz, szkic.id)).flatMap((z) => {
        const adres = adresZdjecia(z.sciezka);
        return adres ? [{ id: z.id, adres, pozycja: z.pozycja }] : [];
      })
    : [];

  // Zalogowany człowiek ma krok pierwszy (zakładanie konta) za sobą, nawet
  // jeśli jeszcze nie tknął kreatora.
  return (
    <RejestracjaFirmyScreen
      szkic={doKreatora}
      zdjecia={zdjecia}
      zalogowany={widz.rodzaj !== "anonim"}
    />
  );
}

"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { BladPola, idBledu, maBlad } from "@/components/BladPola";
import { KomunikatFormularza } from "@/components/KomunikatFormularza";
import { PoleMiejscowosci } from "@/components/PoleMiejscowosci";
import { OKAZJE } from "@/content/okazje";
import { dodajZlecenie } from "@/lib/akcje/zlecenia";
import { STAN_POCZATKOWY, wartoscPola } from "@/lib/formularze";
import { TRASY } from "@/lib/trasy";

/**
 * Klucz szkicu w `sessionStorage`.
 *
 * Anonim widzi formularz i może go wypełnić, bo wejścia z wyszukiwarki
 * prowadzą wprost tutaj, a ekran zaczynający się od żądania konta odbija
 * większość z nich. Przy wysłaniu wpisane wartości czekają w przeglądarce,
 * a człowiek idzie założyć konto i wraca do wypełnionego formularza.
 *
 * Działa, bo adres potwierdzamy **kodem wpisywanym w tej samej karcie**,
 * a nie linkiem z maila otwieranym gdzie indziej. Gdyby weryfikacja kiedyś
 * wróciła do linku, ten mechanizm przestanie działać po cichu i trzeba będzie
 * go zastąpić szkicem po stronie serwera.
 */
const KLUCZ_SZKICU = "goscinnie:szkic-zlecenia";

const POLA_SZKICU = [
  "okazja",
  "dataWydarzenia",
  "liczbaOsob",
  "miejscowosc",
  "cityId",
  "opis",
  "budzetMin",
  "budzetMax",
] as const;

type Szkic = Partial<Record<(typeof POLA_SZKICU)[number], string>>;

function odczytajSzkic(): Szkic {
  try {
    const zapisany = sessionStorage.getItem(KLUCZ_SZKICU);
    return zapisany === null ? {} : (JSON.parse(zapisany) as Szkic);
  } catch {
    // Prywatne okno, zablokowane dane witryny, uszkodzony wpis. Pusty
    // formularz jest gorszy od wypełnionego, ale lepszy od białego ekranu.
    return {};
  }
}

function zapiszSzkic(formularz: HTMLFormElement): void {
  const dane = new FormData(formularz);
  const szkic: Szkic = {};
  for (const pole of POLA_SZKICU) {
    const wartosc = dane.get(pole);
    if (typeof wartosc === "string" && wartosc !== "") szkic[pole] = wartosc;
  }

  try {
    sessionStorage.setItem(KLUCZ_SZKICU, JSON.stringify(szkic));
  } catch {
    // Brak miejsca albo zablokowany magazyn. Trudno: formularz i tak zadziała,
    // tylko po rejestracji będzie pusty.
  }
}

function wyczyscSzkic(): void {
  try {
    sessionStorage.removeItem(KLUCZ_SZKICU);
  } catch {
    // Nie ma czego sprzątać albo nie wolno. Nic z tego nie wynika.
  }
}

const KLASA_POLA =
  "text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border";
const KLASA_ETYKIETY = "text-[14px] font-semibold text-[#3E3344]";

export function NoweZlecenieScreen({ zalogowany }: { zalogowany: boolean }) {
  const [stan, akcja, czeka] = useActionState(dodajZlecenie, STAN_POCZATKOWY);
  const [szkic, setSzkic] = useState<Szkic>({});

  // Szkic czytamy po zamontowaniu, bo `sessionStorage` nie istnieje na serwerze.
  useEffect(() => {
    setSzkic(odczytajSzkic());
  }, []);

  /** Wartość pola: najpierw to, co odesłała nieudana walidacja, potem szkic. */
  const wartosc = (pole: (typeof POLA_SZKICU)[number]): string =>
    wartoscPola(stan, pole) || (szkic[pole] ?? "");

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <section className="grow px-6 sm:px-12 md:px-[130px] pt-12 flex flex-col lg:flex-row gap-11 items-start pb-16">
        <div className="grow w-full">
          <h1 className="m-0 mb-2.5 font-fraunces font-normal text-[36px] sm:text-[44px] tracking-tight">
            Opisz raz, odpowiedzą sami
          </h1>
          <p className="m-0 mb-8 text-[17px] leading-[1.6] text-[#3E3344] max-w-[64ch]">
            Wystawienie zlecenia jest bezpłatne i nie zobowiązuje do niczego. Nie podajesz numeru
            telefonu: firmy poznają Twój kontakt dopiero wtedy, gdy sam dodasz ich ofertę do
            krótkiej listy.
          </p>

          {!zalogowany && (
            <p className="mb-7 rounded-[12px] border border-[#E2D5CA] bg-[#F2E9E2] p-4 text-[15px] leading-[1.6] text-[#3E3344]">
              Wypełnij spokojnie formularz. Do wysłania potrzebne jest konto, więc po kliknięciu
              „Opublikuj zlecenie" przeniesiemy Cię na{" "}
              <Link href={TRASY.rejestracja} className="underline">
                rejestrację
              </Link>
              , a wpisane dane będą czekać.
            </p>
          )}

          <form
            action={akcja}
            onSubmit={(zdarzenie) => {
              /*
               * Szkic jest wyłącznie na przejście przez rejestrację. Zalogowany
               * nigdzie nie wychodzi: błędy walidacji wracają do pól razem ze
               * stanem formularza, a udany zapis przekierowuje. Trzymanie mu
               * szkicu skończyłoby się tym, że następny pusty formularz w tej
               * samej karcie wypełniłby się starą treścią.
               */
              if (zalogowany) wyczyscSzkic();
              else zapiszSzkic(zdarzenie.currentTarget);
            }}
            className="border border-[#D9CCC2] rounded-[20px] bg-white p-7 sm:p-9 shadow-sm flex flex-col gap-5"
          >
            <KomunikatFormularza stan={stan} />

            <div className="flex flex-col gap-2">
              <label htmlFor="z-okazja" className={KLASA_ETYKIETY}>
                Okazja
              </label>
              <select
                id="z-okazja"
                name="okazja"
                required
                defaultValue={wartosc("okazja")}
                aria-invalid={maBlad(stan, "okazja")}
                aria-describedby={maBlad(stan, "okazja") ? idBledu("okazja") : undefined}
                className={KLASA_POLA}
              >
                <option value="">Wybierz okazję</option>
                {OKAZJE.map((okazja) => (
                  <option key={okazja.slug} value={okazja.slug}>
                    {okazja.nazwa}
                  </option>
                ))}
              </select>
              <BladPola stan={stan} pole="okazja" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="grow flex flex-col gap-2">
                <label htmlFor="z-data" className={KLASA_ETYKIETY}>
                  Data wydarzenia
                </label>
                <input
                  id="z-data"
                  name="dataWydarzenia"
                  type="date"
                  required
                  defaultValue={wartosc("dataWydarzenia")}
                  aria-invalid={maBlad(stan, "dataWydarzenia")}
                  className={KLASA_POLA}
                />
                <BladPola stan={stan} pole="dataWydarzenia" />
              </div>

              <div className="w-full sm:w-[220px] flex flex-col gap-2">
                <label htmlFor="z-osoby" className={KLASA_ETYKIETY}>
                  Liczba osób
                </label>
                <input
                  id="z-osoby"
                  name="liczbaOsob"
                  type="number"
                  min={1}
                  required
                  defaultValue={wartosc("liczbaOsob")}
                  aria-invalid={maBlad(stan, "liczbaOsob")}
                  className={KLASA_POLA}
                />
                <span className="text-[13px] text-[#6A5C70]">Może być przybliżona.</span>
                <BladPola stan={stan} pole="liczbaOsob" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {/*
                Zapis wymaga `cities.id`, bo z wiersza miejscowości bierzemy
                współrzędne do wyszukiwania po promieniu. Zwykłe pole tekstowe
                nie miałoby czym go wypełnić.
              */}
              <PoleMiejscowosci
                nazwaPola="miejscowosc"
                nazwaPolaId="cityId"
                wartoscPoczatkowa={wartosc("miejscowosc")}
                idPoczatkowe={wartosc("cityId")}
                klasaEtykiety={KLASA_ETYKIETY}
                klasaPola={KLASA_POLA}
              />
              <span className="text-[13px] text-[#6A5C70]">
                Zacznij pisać i wybierz miejscowość z listy. Firmy widzą powiat, nie dokładny adres.
              </span>
              <BladPola stan={stan} pole="cityId" />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="z-opis" className={KLASA_ETYKIETY}>
                Czego szukasz, własnymi słowami
              </label>
              <textarea
                id="z-opis"
                name="opis"
                rows={5}
                required
                defaultValue={wartosc("opis")}
                aria-invalid={maBlad(stan, "opis")}
                className={`${KLASA_POLA} leading-[1.7]`}
              />
              <span className="text-[13px] text-[#6A5C70]">
                Im konkretniej, tym trafniejsze oferty. Od 20 do 2000 znaków.
              </span>
              <BladPola stan={stan} pole="opis" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="grow flex flex-col gap-2">
                <label htmlFor="z-budzet-min" className={KLASA_ETYKIETY}>
                  Budżet od (zł)
                </label>
                <input
                  id="z-budzet-min"
                  name="budzetMin"
                  type="number"
                  min={0}
                  defaultValue={wartosc("budzetMin")}
                  aria-invalid={maBlad(stan, "budzetMin")}
                  className={KLASA_POLA}
                />
                <BladPola stan={stan} pole="budzetMin" />
              </div>

              <div className="grow flex flex-col gap-2">
                <label htmlFor="z-budzet-max" className={KLASA_ETYKIETY}>
                  Budżet do (zł)
                </label>
                <input
                  id="z-budzet-max"
                  name="budzetMax"
                  type="number"
                  min={0}
                  defaultValue={wartosc("budzetMax")}
                  aria-invalid={maBlad(stan, "budzetMax")}
                  className={KLASA_POLA}
                />
                <BladPola stan={stan} pole="budzetMax" />
              </div>
            </div>

            <p className="m-0 text-[13px] text-[#6A5C70]">
              Budżet jest nieobowiązkowy, ale podany pomaga firmom zaproponować właściwe menu. Widzą
              go tylko firmy z abonamentem.
            </p>

            <div className="flex items-center gap-4 pt-4 border-t border-[#EFE5DD]">
              <button
                type="submit"
                disabled={czeka}
                className="text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-8 py-4 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {czeka ? "Wysyłam..." : "Opublikuj zlecenie"}
              </button>
            </div>
          </form>
        </div>

        <aside className="w-full lg:w-[400px] shrink-0 flex flex-col gap-4">
          <div className="border border-[#D9CCC2] rounded-[20px] bg-white overflow-hidden shadow-sm">
            <div className="p-4 px-5 bg-[#F2E9E2] border-b border-[#E2D5CA] text-[14px] font-bold">
              Co widzi firma
            </div>
            <div className="p-5 sm:p-6">
              <p className="m-0 mb-3.5 text-[14px] leading-[1.65] text-[#55485A]">
                Rodzaj okazji, datę, liczbę osób i powiat widzi każdy. Twój opis i budżet widzą
                tylko firmy z abonamentem.
              </p>
              <p className="m-0 text-[14px] leading-[1.65] text-[#55485A]">
                Imię, adres e-mail i numer firma pozna dopiero wtedy, gdy sam dodasz jej ofertę do
                krótkiej listy. Do tego czasu rozmawiacie przez serwis.
              </p>
            </div>
          </div>

          <div className="border border-[#E2D5CA] rounded-[20px] bg-[#F2E9E2] p-6">
            <div className="text-[16px] font-bold mb-2.5">Ile to kosztuje</div>
            <p className="m-0 text-[14px] leading-[1.7] text-[#55485A]">
              Nic. Klient nie płaci w tym serwisie nigdy, ani za wystawienie zlecenia, ani za
              kontakt, ani prowizji od umów. Płacą firmy, abonamentem.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

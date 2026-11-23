"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { BladPola, idBledu, maBlad } from "@/components/BladPola";
import { KomunikatFormularza } from "@/components/KomunikatFormularza";
import { dataDluga } from "@/content/format";
import { MAKS_ZNAKOW_INNEJ_OKAZJI, OKAZJA_INNA, OKAZJE } from "@/content/okazje";
import { dodajImpreze } from "@/lib/akcje/imprezy";
import type { ImprezaWPanelu } from "@/lib/db/queries/imprezy";
import { STAN_POCZATKOWY } from "@/lib/formularze";

interface Props {
  imprezy: readonly ImprezaWPanelu[];
}

const KLASA_POLA =
  "w-full border border-[#D9CCC2] rounded-[12px] bg-white px-4 py-3 text-[15px] text-[#241C2B]";
const KLASA_ETYKIETY = "text-[14px] font-semibold text-[#3E3344]";

export function ImprezyFirmyScreen({ imprezy }: Props) {
  const [stan, akcja, czeka] = useActionState(dodajImpreze, STAN_POCZATKOWY);

  /*
   * Formularz schowany, dopóki ktoś nie kliknie „Dodaj imprezę”.
   *
   * Lokal wchodzi tu zwykle po to, żeby sprawdzić, co już zapowiedział,
   * a nie żeby dodać kolejną. Formularz na dwanaście pól otwarty od razu
   * spycha listę pod ekran i zamienia stronę „twoje imprezy” w stronę
   * „dodaj imprezę”.
   */
  const [otwartyFormularz, setOtwarty] = useState(false);
  const [okazja, setOkazja] = useState("");

  return (
    <main className="w-full max-w-[1100px] mx-auto px-6 sm:px-12 pt-12 pb-20 bg-[#FBF7F4] text-[#241C2B]">
      <h1 className="m-0 mb-2.5 font-fraunces font-normal text-[34px] sm:text-[42px] tracking-tight">
        Twoje imprezy
      </h1>
      <p className="m-0 mb-8 text-[17px] leading-[1.6] text-[#3E3344] max-w-[70ch]">
        Zapowiedzi, które organizujesz w swoim lokalu. Każda trafia do sprawdzenia, zanim pokaże się
        w zapowiedziach.
      </p>

      <KomunikatFormularza stan={stan} />

      {imprezy.length === 0 ? (
        <p className="m-0 mt-6 mb-8 rounded-[18px] border border-dashed border-[#D9CCC2] bg-white p-8 text-center text-[15px] leading-[1.7] text-[#6A5C70]">
          Nie zapowiedziałeś jeszcze żadnej imprezy.
        </p>
      ) : (
        <ul className="m-0 mt-6 mb-8 list-none p-0 flex flex-col gap-3">
          {imprezy.map((impreza) => (
            <li
              key={impreza.id}
              className="border border-[#E2D5CA] rounded-[16px] bg-white p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <div className="font-fraunces text-[20px] font-medium">{impreza.nazwa}</div>
                <div className="text-[14px] text-[#6A5C70] mt-0.5">
                  {impreza.okazja} &nbsp;·&nbsp; {dataDluga(impreza.data)} od{" "}
                  {impreza.godzinaOd.slice(0, 5)}
                </div>
              </div>

              {impreza.zaakceptowana ? (
                <Link
                  href={`/imprezy/${impreza.slug}`}
                  className="text-[14px] font-semibold text-[#8A5405] underline"
                >
                  Zobacz zapowiedź
                </Link>
              ) : (
                /*
                 * Stan oczekiwania mówi wprost, że impreza istnieje, ale
                 * jej nie widać. Bez tego lokal widzi swoją imprezę u siebie
                 * i nie widzi jej w zapowiedziach, co czyta się jak usterka.
                 */
                <span className="text-[13px] font-semibold text-[#7A3B1E] bg-[#F7E9E2] rounded-[8px] px-3 py-1.5">
                  czeka na sprawdzenie
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {otwartyFormularz ? (
        <form
          action={akcja}
          className="border border-[#E2D5CA] rounded-[20px] bg-white p-7 flex flex-col gap-5"
        >
          <h2 className="m-0 font-fraunces font-medium text-[24px]">Nowa impreza</h2>

          <div className="flex flex-col gap-2">
            <label htmlFor="i-nazwa" className={KLASA_ETYKIETY}>
              Nazwa
            </label>
            <input
              id="i-nazwa"
              name="nazwa"
              type="text"
              required
              maxLength={120}
              placeholder="np. Sylwester w stodole"
              aria-invalid={maBlad(stan, "nazwa")}
              aria-describedby={maBlad(stan, "nazwa") ? idBledu("nazwa") : undefined}
              className={KLASA_POLA}
            />
            <BladPola stan={stan} pole="nazwa" />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="i-okazja" className={KLASA_ETYKIETY}>
              Okazja
            </label>
            <select
              id="i-okazja"
              name="okazja"
              required
              value={okazja}
              onChange={(e) => setOkazja(e.currentTarget.value)}
              aria-invalid={maBlad(stan, "okazja")}
              aria-describedby={maBlad(stan, "okazja") ? idBledu("okazja") : undefined}
              className={KLASA_POLA}
            >
              <option value="">Wybierz okazję</option>
              {OKAZJE.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.nazwa}
                </option>
              ))}
              <option value={OKAZJA_INNA.slug}>{OKAZJA_INNA.nazwa}</option>
            </select>
            <BladPola stan={stan} pole="okazja" />
          </div>

          {okazja === OKAZJA_INNA.slug ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="i-inna" className={KLASA_ETYKIETY}>
                Co to za okazja
              </label>
              <input
                id="i-inna"
                name="innaOkazja"
                type="text"
                required
                maxLength={MAKS_ZNAKOW_INNEJ_OKAZJI}
                placeholder="np. wieczór jazzowy, turniej skata"
                aria-invalid={maBlad(stan, "innaOkazja")}
                aria-describedby={maBlad(stan, "innaOkazja") ? idBledu("innaOkazja") : undefined}
                className={KLASA_POLA}
              />
              <BladPola stan={stan} pole="innaOkazja" />
            </div>
          ) : null}

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="i-data" className={KLASA_ETYKIETY}>
                Data
              </label>
              <input
                id="i-data"
                name="data"
                type="date"
                required
                aria-invalid={maBlad(stan, "data")}
                aria-describedby={maBlad(stan, "data") ? idBledu("data") : undefined}
                className={KLASA_POLA}
              />
              <BladPola stan={stan} pole="data" />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="i-od" className={KLASA_ETYKIETY}>
                Początek
              </label>
              <input
                id="i-od"
                name="godzinaOd"
                type="time"
                required
                aria-invalid={maBlad(stan, "godzinaOd")}
                aria-describedby={maBlad(stan, "godzinaOd") ? idBledu("godzinaOd") : undefined}
                className={KLASA_POLA}
              />
              <BladPola stan={stan} pole="godzinaOd" />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="i-do" className={KLASA_ETYKIETY}>
                Koniec
              </label>
              <input
                id="i-do"
                name="godzinaDo"
                type="time"
                aria-invalid={maBlad(stan, "godzinaDo")}
                aria-describedby={maBlad(stan, "godzinaDo") ? idBledu("godzinaDo") : undefined}
                className={KLASA_POLA}
              />
              <BladPola stan={stan} pole="godzinaDo" />
              <p className="m-0 text-[13px] text-[#6A5C70]">
                Zostaw puste, jeśli gracie do ostatniego gościa albo po północy.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="i-cena" className={KLASA_ETYKIETY}>
              Cena biletu
            </label>
            <input
              id="i-cena"
              name="cenaBiletu"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="zostaw puste przy wstępie wolnym"
              aria-invalid={maBlad(stan, "cenaBiletu")}
              aria-describedby={maBlad(stan, "cenaBiletu") ? idBledu("cenaBiletu") : undefined}
              className={KLASA_POLA}
            />
            <BladPola stan={stan} pole="cenaBiletu" />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="i-opis" className={KLASA_ETYKIETY}>
              Co się będzie działo
            </label>
            <textarea
              id="i-opis"
              name="opis"
              required
              rows={5}
              maxLength={2000}
              placeholder="Kto gra, co w cenie, jak wygląda wieczór."
              aria-invalid={maBlad(stan, "opis")}
              aria-describedby={maBlad(stan, "opis") ? idBledu("opis") : undefined}
              className={KLASA_POLA}
            />
            <BladPola stan={stan} pole="opis" />
          </div>

          <label className="flex items-center gap-2.5 text-[15px] text-[#3E3344]">
            <input type="checkbox" name="dlaDoroslych" className="w-4 h-4" />
            Impreza tylko dla dorosłych
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={czeka}
              className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] disabled:opacity-60 transition-colors border-0 rounded-[12px] px-7 py-3.5 cursor-pointer"
            >
              {czeka ? "Zapisuję..." : "Wyślij do sprawdzenia"}
            </button>
            <button
              type="button"
              onClick={() => setOtwarty(false)}
              className="text-[15px] font-semibold text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer"
            >
              Anuluj
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOtwarty(true)}
          className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-7 py-3.5 cursor-pointer"
        >
          Dodaj imprezę
        </button>
      )}
    </main>
  );
}

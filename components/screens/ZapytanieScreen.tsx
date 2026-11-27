"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BladPola } from "@/components/BladPola";
import { KomunikatFormularza } from "@/components/KomunikatFormularza";
import { wyslijZapytanieDoFirmy } from "@/lib/akcje/zapytania";
import { STAN_POCZATKOWY, wartoscPola } from "@/lib/formularze";

interface ZapytanieScreenProps {
  firma: {
    slug: string;
    nazwa: string;
    miasto: string;
    powiat: string;
  };
  zalogowany: boolean;
}

const KLASA_POLA =
  "text-[15px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border";
const KLASA_ETYKIETY = "block text-[14px] font-semibold text-[#3E3344] mb-1.5";

export function ZapytanieScreen({ firma, zalogowany }: ZapytanieScreenProps) {
  const [stan, akcja, czeka] = useActionState(wyslijZapytanieDoFirmy, STAN_POCZATKOWY);

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <section className="grow px-6 sm:px-12 md:px-[130px] pt-12 pb-16 max-w-[920px]">
        <p className="m-0 mb-3.5 text-[14px] text-[#6A5C70]">
          <Link href="/lokale" className="text-[#6A5C70] hover:text-[#241C2B]">
            Katalog
          </Link>{" "}
          &nbsp;›&nbsp;{" "}
          <Link href={`/f/${firma.slug}`} className="text-[#6A5C70] hover:text-[#241C2B]">
            {firma.nazwa}
          </Link>{" "}
          &nbsp;›&nbsp; Zapytanie
        </p>

        <h1 className="m-0 mb-2.5 font-fraunces font-normal text-[36px] sm:text-[44px] tracking-tight">
          Zapytaj o termin i wycenę
        </h1>
        <p className="m-0 mb-8 text-[17px] leading-[1.6] text-[#3E3344] max-w-[64ch]">
          Wiadomość trafi bezpośrednio do <strong>{firma.nazwa}</strong> ({firma.miasto}, powiat{" "}
          {firma.powiat}). Odpowiedź zobaczysz w zakładce Wiadomości oraz na swoim e-mailu.
        </p>

        {!zalogowany && (
          <div className="mb-6 rounded-[14px] border border-[#E2D5CA] bg-[#FEF4E4] p-5 flex flex-wrap items-center justify-between gap-4">
            <p className="m-0 text-[15px] text-[#241C2B]">
              Aby wysłać zapytanie i odebrać odpowiedź od firmy, zaloguj się na swoje konto.
            </p>
            <Link
              href={`/logowanie?powrot=${encodeURIComponent(`/f/${firma.slug}/zapytanie`)}`}
              className="text-[14px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] rounded-[10px] px-5 py-2.5"
            >
              Zaloguj się
            </Link>
          </div>
        )}

        <div className="border border-[#E2D5CA] rounded-[20px] bg-white p-6 sm:p-9 shadow-xs">
          <KomunikatFormularza stan={stan} />

          <form action={akcja} className="mt-4 flex flex-col gap-5">
            <input type="hidden" name="companySlug" value={firma.slug} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="zap-imie" className={KLASA_ETYKIETY}>
                  Twoje imię
                </label>
                <input
                  id="zap-imie"
                  name="imie"
                  required
                  defaultValue={wartoscPola(stan, "imie")}
                  placeholder="np. Anna"
                  className={KLASA_POLA}
                />
                <BladPola stan={stan} pole="imie" />
              </div>

              <div>
                <label htmlFor="zap-tel" className={KLASA_ETYKIETY}>
                  Telefon (opcjonalnie)
                </label>
                <input
                  id="zap-tel"
                  name="telefon"
                  type="tel"
                  defaultValue={wartoscPola(stan, "telefon")}
                  placeholder="np. 600 100 200"
                  className={KLASA_POLA}
                />
                <BladPola stan={stan} pole="telefon" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="zap-data" className={KLASA_ETYKIETY}>
                  Planowana data (opcjonalnie)
                </label>
                <input
                  id="zap-data"
                  name="dataWydarzenia"
                  type="date"
                  defaultValue={wartoscPola(stan, "dataWydarzenia")}
                  className={KLASA_POLA}
                />
                <BladPola stan={stan} pole="dataWydarzenia" />
              </div>

              <div>
                <label htmlFor="zap-goscie" className={KLASA_ETYKIETY}>
                  Szacowana liczba osób (opcjonalnie)
                </label>
                <input
                  id="zap-goscie"
                  name="liczbaOsob"
                  type="number"
                  min="1"
                  defaultValue={wartoscPola(stan, "liczbaOsob")}
                  placeholder="np. 80"
                  className={KLASA_POLA}
                />
                <BladPola stan={stan} pole="liczbaOsob" />
              </div>
            </div>

            <div>
              <label htmlFor="zap-wiadomosc" className={KLASA_ETYKIETY}>
                Wiadomość do firmy
              </label>
              <textarea
                id="zap-wiadomosc"
                name="wiadomosc"
                required
                rows={5}
                defaultValue={wartoscPola(stan, "wiadomosc")}
                placeholder="Opisz krótko, jakiego terminu, menu lub usługi szukasz..."
                className={KLASA_POLA}
              />
              <BladPola stan={stan} pole="wiadomosc" />
            </div>

            <div>
              <button
                type="submit"
                disabled={czeka}
                className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] disabled:opacity-60 border-0 rounded-[12px] px-7 py-3.5 cursor-pointer shadow-xs"
              >
                {czeka ? "Wysyłanie..." : "Wyślij zapytanie"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

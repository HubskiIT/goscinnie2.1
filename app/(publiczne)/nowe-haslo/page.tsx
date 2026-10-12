"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { BladPola, idBledu, maBlad } from "@/components/BladPola";
import { KomunikatFormularza } from "@/components/KomunikatFormularza";
import { ListaWymaganHasla } from "@/components/ListaWymaganHasla";
import { ustawNoweHaslo } from "@/lib/akcje/haslo";
import { STAN_POCZATKOWY } from "@/lib/formularze";
import { MINIMALNA_DLUGOSC_HASLA } from "@/lib/haslo";

/**
 * Ustawienie nowego hasła z linku przysłanego mailem.
 *
 * Token siedzi w adresie, więc strona czyta parametry zapytania, a to wymaga
 * granicy Suspense: bez niej budowanie produkcyjne przerywa się na
 * prerenderowaniu tej strony.
 */
export default function NoweHasloPage() {
  return (
    <Suspense fallback={null}>
      <NoweHaslo />
    </Suspense>
  );
}

function NoweHaslo() {
  const parametry = useSearchParams();
  // better-auth dokleja token do adresu przekierowania z maila.
  const token = parametry.get("token") ?? "";
  const [stan, akcja, czeka] = useActionState(ustawNoweHaslo, STAN_POCZATKOWY);

  return (
    <section className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] min-h-screen px-6 sm:px-12 md:px-[130px] pt-14 pb-16">
      <div className="w-full max-w-[480px] border border-[#D9CCC2] rounded-[20px] bg-white p-7 sm:p-9 shadow-sm">
        <h1 className="m-0 mb-2.5 font-fraunces font-normal text-[34px] tracking-tight">
          Ustaw nowe hasło
        </h1>
        <p className="m-0 mb-6 text-[15px] leading-[1.6] text-[#6A5C70]">
          Wpisz nowe hasło dwa razy. Po nieudanej próbie oba pola wracają puste, bo hasła nie
          odsyłamy z powrotem do przeglądarki.
        </p>

        {token === "" ? (
          <p
            role="alert"
            className="m-0 rounded-[12px] border border-[#D8B4A0] bg-[#F7E9E2] p-4 text-[15px] leading-[1.6] text-[#7A3B1E]"
          >
            W tym adresie nie ma tokenu. Otwórz link z wiadomości jeszcze raz albo poproś o nowy na
            ekranie logowania.
          </p>
        ) : (
          <form action={akcja} className="flex flex-col gap-4.5">
            <KomunikatFormularza stan={stan} />

            {/* Token jedzie ukrytym polem, bo akcja serwerowa nie widzi adresu strony. */}
            <input type="hidden" name="token" value={token} />

            <div className="flex flex-col gap-2">
              <label htmlFor="nowe-haslo" className="text-[14px] font-semibold text-[#3E3344]">
                Nowe hasło
              </label>
              <input
                id="nowe-haslo"
                name="haslo"
                type="password"
                required
                minLength={MINIMALNA_DLUGOSC_HASLA}
                autoComplete="new-password"
                aria-invalid={maBlad(stan, "haslo")}
                aria-describedby="wymagania-hasla"
                className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
              />
              <BladPola stan={stan} pole="haslo" />
              <ListaWymaganHasla id="wymagania-hasla" />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="nowe-haslo-2" className="text-[14px] font-semibold text-[#3E3344]">
                Powtórz nowe hasło
              </label>
              <input
                id="nowe-haslo-2"
                name="haslo2"
                type="password"
                required
                minLength={MINIMALNA_DLUGOSC_HASLA}
                autoComplete="new-password"
                aria-invalid={maBlad(stan, "haslo2")}
                aria-describedby={maBlad(stan, "haslo2") ? idBledu("haslo2") : undefined}
                className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
              />
              <BladPola stan={stan} pole="haslo2" />
            </div>

            <button
              type="submit"
              disabled={czeka}
              className="text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] p-4 cursor-pointer mt-1 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {czeka ? "Zapisuję..." : "Ustaw nowe hasło"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

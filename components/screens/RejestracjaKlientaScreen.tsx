"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BladPola, idBledu, maBlad } from "@/components/BladPola";
import { KomunikatFormularza } from "@/components/KomunikatFormularza";
import { ListaWymaganHasla } from "@/components/ListaWymaganHasla";
import { zarejestrujKlienta } from "@/lib/akcje/rejestracja";
import { STAN_POCZATKOWY, wartoscPola } from "@/lib/formularze";
import { MINIMALNA_DLUGOSC_HASLA } from "@/lib/haslo";
import { TRASY } from "@/lib/trasy";

/**
 * Zakładanie konta klienta.
 *
 * Trzy pola i nic więcej. Imię zbiera profil na /moje, bo tutaj byłoby
 * przeszkodą przed kontem, a nie informacją, która komukolwiek służy.
 */
export function RejestracjaKlientaScreen() {
  const [stan, akcja, czeka] = useActionState(zarejestrujKlienta, STAN_POCZATKOWY);

  return (
    <section className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] min-h-screen px-6 sm:px-12 md:px-[130px] pt-14 pb-16">
      <nav className="mb-6 text-[14px] text-[#6A5C70]">
        <Link href={TRASY.rejestracja} className="hover:text-[#241C2B]">
          Rejestracja
        </Link>{" "}
        › Konto klienta
      </nav>

      <div className="w-full max-w-[520px] border border-[#D9CCC2] rounded-[20px] bg-white p-7 sm:p-9 shadow-sm">
        <h1 className="m-0 mb-2.5 font-fraunces font-normal text-[34px] tracking-tight">
          Konto klienta
        </h1>
        <p className="m-0 mb-6 text-[15px] leading-[1.6] text-[#6A5C70]">
          Adres e-mail i hasło. Wyślemy kod potwierdzający na podany adres. Klient nie płaci w tym
          serwisie nigdy i za nic.
        </p>

        <form action={akcja} className="flex flex-col gap-4.5">
          <KomunikatFormularza stan={stan} />

          <div className="flex flex-col gap-2">
            <label htmlFor="klient-mail" className="text-[14px] font-semibold text-[#3E3344]">
              Adres e-mail
            </label>
            <input
              id="klient-mail"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={wartoscPola(stan, "email")}
              aria-invalid={maBlad(stan, "email")}
              aria-describedby={maBlad(stan, "email") ? idBledu("email") : undefined}
              className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
            />
            <BladPola stan={stan} pole="email" />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="klient-haslo" className="text-[14px] font-semibold text-[#3E3344]">
              Hasło
            </label>
            <input
              id="klient-haslo"
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
            <label htmlFor="klient-haslo-2" className="text-[14px] font-semibold text-[#3E3344]">
              Powtórz hasło
            </label>
            <input
              id="klient-haslo-2"
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
            {czeka ? "Zakładam konto..." : "Załóż konto"}
          </button>
        </form>

        <p className="mt-6 mb-0 text-[13px] leading-[1.65] text-[#6A5C70]">
          Po nieudanej próbie oba pola z hasłem wracają puste. Hasła nie odsyłamy z powrotem do
          przeglądarki, bo trafiłoby do historii formularza i do pamięci podręcznej.
        </p>

        <p className="mt-4 mb-0 text-[15px] text-[#6A5C70]">
          Masz już konto?{" "}
          <Link href={TRASY.logowanie} className="text-[#8A5405] underline hover:text-[#241C2B]">
            Zaloguj się
          </Link>
        </p>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BladPola, idBledu, maBlad } from "@/components/BladPola";
import { KomunikatFormularza } from "@/components/KomunikatFormularza";
import { dataDluga, zlote } from "@/content/format";
import { zapiszProfilKlienta } from "@/lib/akcje/konto";
import type { ProfilKlienta } from "@/lib/db/queries/konto";
import type { ZlecenieAutora } from "@/lib/db/queries/requests";
import { STAN_POCZATKOWY } from "@/lib/formularze";
import { TRASY } from "@/lib/trasy";

const KLASA_POLA =
  "text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border";
const KLASA_ETYKIETY = "text-[14px] font-semibold text-[#3E3344]";

/** Opis stanu zlecenia dla autora. Kody z bazy nic człowiekowi nie mówią. */
const OPIS_STANU: Record<ZlecenieAutora["status"], string> = {
  open: "Zbiera oferty",
  closed: "Zamknięte",
  expired: "Wygasło",
  archived: "W archiwum",
};

function budzet(zlecenie: ZlecenieAutora): string {
  const { budzetMin, budzetMax } = zlecenie;
  if (budzetMin === null && budzetMax === null) return "nie podano";
  if (budzetMin !== null && budzetMax !== null) return `${zlote(budzetMin)} – ${zlote(budzetMax)}`;
  return zlote(budzetMin ?? budzetMax ?? 0);
}

export function MojeScreen({
  profil,
  zlecenia,
}: {
  profil: ProfilKlienta;
  zlecenia: readonly ZlecenieAutora[];
}) {
  const [stan, akcja, czeka] = useActionState(zapiszProfilKlienta, STAN_POCZATKOWY);

  return (
    <section className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] min-h-screen px-6 sm:px-12 md:px-[130px] pt-12 pb-16">
      <h1 className="m-0 mb-2.5 font-fraunces font-normal text-[36px] sm:text-[44px] tracking-tight">
        Moje zlecenia
      </h1>
      <p className="m-0 mb-10 text-[17px] leading-[1.6] text-[#3E3344] max-w-[62ch]">
        Twoje zlecenia i dane, które firma pozna dopiero wtedy, gdy sam dodasz jej ofertę do
        krótkiej listy.
      </p>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="grow w-full">
          {zlecenia.length === 0 ? (
            <div className="border border-[#D9CCC2] rounded-[20px] bg-white p-7 sm:p-9 shadow-sm">
              <h2 className="m-0 mb-2 font-fraunces font-medium text-[24px]">
                Nie masz jeszcze żadnego zlecenia
              </h2>
              <p className="m-0 mb-6 text-[15px] leading-[1.65] text-[#55485A]">
                Opisz raz, czego szukasz, a firmy same przyślą oferty. Wystawienie zlecenia jest
                bezpłatne i nie zobowiązuje do niczego.
              </p>
              <Link
                href={TRASY.dodajZlecenie}
                className="inline-block text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors rounded-[12px] px-7 py-3.5 shadow-sm"
              >
                Wystaw zlecenie
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {zlecenia.map((zlecenie) => (
                <article
                  key={zlecenie.id}
                  className="border border-[#D9CCC2] rounded-[20px] bg-white p-6 sm:p-7 shadow-sm"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
                    <h2 className="m-0 font-fraunces font-medium text-[22px]">
                      {zlecenie.rodzajOkazji}, {zlecenie.liczbaOsob} osób
                    </h2>
                    <span className="text-[13px] font-semibold text-[#3F5142] bg-[#E7EDE7] border border-[#C7D6C8] rounded-full px-3 py-1">
                      {OPIS_STANU[zlecenie.status]}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 py-4 border-y border-[#EFE5DD] m-0">
                    <div>
                      <dt className="text-[12px] text-[#6A5C70]">Data</dt>
                      <dd className="m-0 text-[14px] font-semibold">
                        {dataDluga(zlecenie.dataWydarzenia)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[12px] text-[#6A5C70]">Miejscowość</dt>
                      <dd className="m-0 text-[14px] font-semibold">{zlecenie.miasto}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] text-[#6A5C70]">Budżet</dt>
                      <dd className="m-0 text-[14px] font-semibold">{budzet(zlecenie)}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] text-[#6A5C70]">Oferty</dt>
                      {/* Liczbę ofert widzi wyłącznie autor. Firma nigdy. */}
                      <dd className="m-0 text-[14px] font-semibold">{zlecenie.liczbaOfert}</dd>
                    </div>
                  </dl>

                  <p className="m-0 mt-4 text-[15px] leading-[1.65] text-[#55485A]">
                    {zlecenie.opis}
                  </p>
                </article>
              ))}

              <Link
                href={TRASY.dodajZlecenie}
                className="self-start text-[15px] font-semibold text-[#241C2B] border-[1.5px] border-[#241C2B] rounded-[12px] px-6 py-3 hover:bg-[#241C2B] hover:text-white transition-colors"
              >
                Wystaw kolejne zlecenie
              </Link>
            </div>
          )}
        </div>

        <aside className="w-full lg:w-[380px] shrink-0">
          <div className="border border-[#D9CCC2] rounded-[20px] bg-white p-6 sm:p-7 shadow-sm">
            <h2 className="m-0 mb-1.5 font-fraunces font-medium text-[22px]">Twoje dane</h2>
            <p className="m-0 mb-5 text-[14px] leading-[1.6] text-[#6A5C70]">
              Firma zobaczy je dopiero po dodaniu jej oferty do krótkiej listy.
            </p>

            <form action={akcja} className="flex flex-col gap-4">
              <KomunikatFormularza stan={stan} />

              <div className="flex flex-col gap-2">
                <span className={KLASA_ETYKIETY}>Adres e-mail</span>
                <p className="m-0 text-[15px] text-[#55485A]">{profil.email}</p>
                <span className="text-[13px] text-[#6A5C70]">
                  Adres jest nazwą konta i tutaj się go nie zmienia.
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="profil-imie" className={KLASA_ETYKIETY}>
                  Imię
                </label>
                <input
                  id="profil-imie"
                  name="imie"
                  type="text"
                  required
                  defaultValue={profil.imie}
                  aria-invalid={maBlad(stan, "imie")}
                  aria-describedby={maBlad(stan, "imie") ? idBledu("imie") : undefined}
                  className={KLASA_POLA}
                />
                <BladPola stan={stan} pole="imie" />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="profil-telefon" className={KLASA_ETYKIETY}>
                  Telefon
                </label>
                <input
                  id="profil-telefon"
                  name="telefon"
                  type="tel"
                  defaultValue={profil.telefon ?? ""}
                  aria-invalid={maBlad(stan, "telefon")}
                  aria-describedby={maBlad(stan, "telefon") ? idBledu("telefon") : undefined}
                  className={KLASA_POLA}
                />
                <span className="text-[13px] text-[#6A5C70]">
                  Nieobowiązkowy. Puste pole znaczy „nie podaję".
                </span>
                <BladPola stan={stan} pole="telefon" />
              </div>

              <button
                type="submit"
                disabled={czeka}
                className="text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] p-3.5 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {czeka ? "Zapisuję..." : "Zapisz dane"}
              </button>
            </form>
          </div>
        </aside>
      </div>
    </section>
  );
}

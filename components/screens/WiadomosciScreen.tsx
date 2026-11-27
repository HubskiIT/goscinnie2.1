"use client";

import Link from "next/link";
import { useActionState } from "react";
import { KomunikatFormularza } from "@/components/KomunikatFormularza";
import { dataDluga } from "@/content/format";
import { odpowiedzNaWiadomosc } from "@/lib/akcje/zapytania";
import type { SkrzynkaWiadomosci } from "@/lib/db/queries/zapytania";
import { STAN_POCZATKOWY } from "@/lib/formularze";

export function WiadomosciScreen({ skrzynka }: { skrzynka: SkrzynkaWiadomosci }) {
  const [stan, akcja, czeka] = useActionState(odpowiedzNaWiadomosc, STAN_POCZATKOWY);

  return (
    <main className="w-full max-w-[1160px] mx-auto px-6 sm:px-12 pt-12 pb-20 bg-[#FBF7F4] text-[#241C2B] min-h-screen">
      <h1 className="m-0 mb-2 font-fraunces font-normal text-[34px] sm:text-[42px] tracking-tight">
        Wiadomości
      </h1>
      <p className="m-0 mb-8 text-[16px] text-[#3E3344]">
        Zapytania wysłane do lokali i usługodawców oraz rozmowy z klientami.
      </p>

      <KomunikatFormularza stan={stan} />

      {skrzynka.otrzymane.length > 0 && (
        <section className="mt-8">
          <h2 className="m-0 mb-4 font-fraunces font-medium text-[24px]">
            Otrzymane zapytania ({skrzynka.otrzymane.length})
          </h2>
          <ul className="m-0 p-0 list-none flex flex-col gap-4">
            {skrzynka.otrzymane.map((w) => (
              <li key={w.id} className="border border-[#E2D5CA] rounded-[18px] bg-white p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <div className="font-fraunces text-[20px]">
                    {w.nadawcaImie} →{" "}
                    <Link href={`/f/${w.firmaSlug}`} className="text-[#8A5405] underline">
                      {w.firmaNazwa}
                    </Link>
                  </div>
                  <div className="text-[13px] text-[#6A5C70]">
                    {dataDluga(w.utworzono.toISOString().slice(0, 10))}
                  </div>
                </div>

                <div className="text-[13px] text-[#6A5C70] mb-3 flex flex-wrap gap-3">
                  <span>E-mail: {w.nadawcaEmail}</span>
                  {w.nadawcaTelefon && <span>Tel: {w.nadawcaTelefon}</span>}
                  {w.dataWydarzenia && <span>Termin: {dataDluga(w.dataWydarzenia)}</span>}
                  {w.liczbaOsob && <span>Goście: {w.liczbaOsob}</span>}
                </div>

                <p className="m-0 mb-4 text-[15px] leading-[1.65] text-[#241C2B] bg-[#FBF7F4] rounded-[12px] p-4">
                  {w.wiadomosc}
                </p>

                {w.odpowiedz ? (
                  <div className="border-l-4 border-[#3F5142] pl-4 py-1 text-[14px] text-[#3E3344]">
                    <div className="font-bold text-[#3F5142] mb-1">Twoja odpowiedź:</div>
                    {w.odpowiedz}
                  </div>
                ) : (
                  <form action={akcja} className="flex flex-col gap-2">
                    <input type="hidden" name="zapytanieId" value={w.id} />
                    <textarea
                      name="odpowiedz"
                      required
                      rows={3}
                      placeholder="Napisz odpowiedź do klienta (wyślemy ją także na jego e-mail)..."
                      className="w-full border border-[#D9CCC2] rounded-[12px] p-3 text-[14px]"
                    />
                    <button
                      type="submit"
                      disabled={czeka}
                      className="self-start text-[14px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] disabled:opacity-60 border-0 rounded-[10px] px-5 py-2.5 cursor-pointer"
                    >
                      {czeka ? "Wysyłanie..." : "Wyślij odpowiedź"}
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="m-0 mb-4 font-fraunces font-medium text-[24px]">
          Wysłane zapytania ({skrzynka.wyslane.length})
        </h2>

        {skrzynka.wyslane.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[#D9CCC2] bg-white p-8 text-center text-[15px] text-[#6A5C70]">
            Nie wysłałeś jeszcze żadnego zapytania.{" "}
            <Link href="/lokale" className="font-semibold text-[#8A5405] underline">
              Przeglądaj lokale
            </Link>
          </div>
        ) : (
          <ul className="m-0 p-0 list-none flex flex-col gap-4">
            {skrzynka.wyslane.map((w) => (
              <li key={w.id} className="border border-[#E2D5CA] rounded-[18px] bg-white p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <Link
                    href={`/f/${w.firmaSlug}`}
                    className="font-fraunces text-[20px] text-[#241C2B]"
                  >
                    {w.firmaNazwa}
                  </Link>
                  <div className="text-[13px] text-[#6A5C70]">
                    {dataDluga(w.utworzono.toISOString().slice(0, 10))}
                  </div>
                </div>
                <p className="m-0 mb-3 text-[15px] leading-[1.6] text-[#3E3344]">{w.wiadomosc}</p>
                {w.odpowiedz ? (
                  <div className="rounded-[12px] bg-[#E7EDE7] p-4 text-[14px] text-[#241C2B]">
                    <div className="font-bold text-[#3F5142] mb-1">Odpowiedź firmy:</div>
                    {w.odpowiedz}
                  </div>
                ) : (
                  <div className="text-[13px] text-[#6A5C70]">Oczekuje na odpowiedź firmy.</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

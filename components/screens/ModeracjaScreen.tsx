"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { BladPola, idBledu, maBlad } from "@/components/BladPola";
import { KomunikatFormularza } from "@/components/KomunikatFormularza";
import { dataDluga } from "@/content/format";
import { rozstrzygnijZgloszenie } from "@/lib/akcje/moderacja";
import type { PozycjaKolejki, RodzajPrzedmiotu } from "@/lib/db/queries/moderacja";
import { STAN_POCZATKOWY } from "@/lib/formularze";
import { MAKS_ZNAKOW_POWODU } from "@/lib/validators/moderacja";

interface ModeracjaScreenProps {
  pozycje: readonly PozycjaKolejki[];
}

/** Co to za wpis, po ludzku. */
const NAZWA_RODZAJU: Record<RodzajPrzedmiotu, string> = {
  company: "Nowa firma",
  company_change: "Zmiana w firmie",
  event: "Impreza",
  request: "Zlecenie",
};

export function ModeracjaScreen({ pozycje }: ModeracjaScreenProps) {
  const [stan, akcja, czeka] = useActionState(rozstrzygnijZgloszenie, STAN_POCZATKOWY);

  /*
   * Który wpis jest właśnie odsyłany do poprawki. Pole na komentarz
   * pokazuje się dopiero po kliknięciu „Odeślij do poprawki”, bo przy
   * dwudziestu pozycjach dwadzieścia otwartych pól tekstowych zamienia
   * kolejkę w ścianę. Null znaczy: nikt nie jest odsyłany.
   */
  const [odsylany, setOdsylany] = useState<string | null>(null);

  return (
    <div className="w-full max-w-[1100px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <section className="px-6 sm:px-12 pt-12 pb-16">
        <h1 className="m-0 mb-2.5 font-fraunces font-normal text-[36px] sm:text-[44px] tracking-tight">
          Moderacja
        </h1>
        <p className="m-0 mb-8 text-[17px] leading-[1.6] text-[#3E3344] max-w-[70ch]">
          Wpisy czekające na decyzję, od najdłużej czekającego. Przyjęty wpis pojawia się w katalogu
          od razu. Odesłany wraca do właściciela razem z Twoim komentarzem, nienaruszony: niczego za
          niego nie poprawiasz.
        </p>

        <KomunikatFormularza stan={stan} />

        {pozycje.length === 0 ? (
          <p className="m-0 mt-6 rounded-[18px] border border-dashed border-[#D9CCC2] bg-white p-8 text-center text-[15px] leading-[1.7] text-[#6A5C70]">
            Kolejka jest pusta. Nic nie czeka na decyzję.
          </p>
        ) : (
          <ul className="m-0 mt-6 list-none p-0 flex flex-col gap-4">
            {pozycje.map((pozycja) => (
              <li
                key={pozycja.id}
                className="border border-[#E2D5CA] rounded-[18px] bg-white p-6 shadow-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-[12px] uppercase tracking-wider font-bold text-[#6A5C70] mb-1">
                      {NAZWA_RODZAJU[pozycja.rodzaj]}
                    </div>
                    <div className="font-fraunces text-[22px] font-medium">
                      {/*
                        Nazwa bywa pusta dla rodzajów, których kolejka jeszcze
                        nie umie rozpoznać. Pokazujemy wtedy identyfikator,
                        zamiast ukrywać pozycję: wpis bez nazwy ma zostać
                        widoczny i możliwy do rozstrzygnięcia.
                      */}
                      {pozycja.nazwa ?? pozycja.przedmiotId}
                    </div>
                    <div className="text-[13px] text-[#6A5C70] mt-1">
                      czeka od {dataDluga(pozycja.zgloszoneO.toISOString().slice(0, 10))}
                    </div>
                  </div>

                  {pozycja.adresPodgladu !== null && (
                    <Link
                      href={pozycja.adresPodgladu}
                      className="shrink-0 text-[14px] font-semibold text-[#8A5405] underline"
                    >
                      Zobacz wpis
                    </Link>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <form action={akcja}>
                    <input type="hidden" name="zgloszenieId" value={pozycja.id} />
                    <input type="hidden" name="decyzja" value="zgoda" />
                    <button
                      type="submit"
                      disabled={czeka}
                      className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] disabled:opacity-60 transition-colors border-0 rounded-[12px] px-6 py-3 cursor-pointer shadow-2xs"
                    >
                      Przyjmij do katalogu
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => setOdsylany(odsylany === pozycja.id ? null : pozycja.id)}
                    className="text-[15px] font-semibold text-[#241C2B] bg-white border border-[#241C2B] hover:bg-[#241C2B] hover:text-white transition-colors rounded-[12px] px-6 py-3 cursor-pointer"
                  >
                    {odsylany === pozycja.id ? "Nie odsyłaj" : "Odeślij do poprawki"}
                  </button>
                </div>

                {odsylany === pozycja.id && (
                  <form action={akcja} className="mt-5 flex flex-col gap-2">
                    <input type="hidden" name="zgloszenieId" value={pozycja.id} />
                    <input type="hidden" name="decyzja" value="odmowa" />

                    <label
                      htmlFor={`powod-${pozycja.id}`}
                      className="text-[14px] font-semibold text-[#3E3344]"
                    >
                      Co właściciel ma poprawić
                    </label>
                    <textarea
                      id={`powod-${pozycja.id}`}
                      name="powod"
                      required
                      rows={4}
                      maxLength={MAKS_ZNAKOW_POWODU}
                      placeholder="Napisz konkretnie, czego brakuje albo co łamie zasady. Ten tekst pójdzie do właściciela mailem i pokaże się w jego panelu."
                      aria-invalid={maBlad(stan, "powod")}
                      aria-describedby={maBlad(stan, "powod") ? idBledu("powod") : undefined}
                      className="w-full border border-[#D9CCC2] rounded-[12px] bg-white px-4 py-3 text-[15px] leading-[1.6] text-[#241C2B]"
                    />
                    <BladPola stan={stan} pole="powod" />

                    <div>
                      <button
                        type="submit"
                        disabled={czeka}
                        className="text-[15px] font-bold text-white bg-[#8A3B1E] hover:bg-[#75311a] disabled:opacity-60 transition-colors border-0 rounded-[12px] px-6 py-3 cursor-pointer"
                      >
                        Odeślij z tym komentarzem
                      </button>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

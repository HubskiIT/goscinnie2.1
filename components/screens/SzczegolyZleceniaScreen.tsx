"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { dataDluga, zlote } from "@/content/format";
import type { OfertaDlaAutora } from "@/lib/db/queries/bids";

interface SzczegolyZleceniaScreenProps {
  id: string;
  okazja: string;
  data: string;
  liczbaOsob: number;
  powiat: string;
  wojewodztwo: string;
  opis: string | null;
  budzetMin: number | null;
  budzetMax: number | null;
  jestAutorem: boolean;
  mozeZlozycOferte: boolean;
  oferty: readonly OfertaDlaAutora[];
}

export function SzczegolyZleceniaScreen({
  id,
  okazja,
  data,
  liczbaOsob,
  powiat,
  wojewodztwo,
  opis,
  budzetMin,
  budzetMax,
  jestAutorem,
  mozeZlozycOferte,
  oferty,
}: SzczegolyZleceniaScreenProps) {
  const router = useRouter();
  const [cena, setCena] = useState("");
  const [wiadomosc, setWiadomosc] = useState("");
  const [komunikat, setKomunikat] = useState<{ ok: boolean; tekst: string } | null>(null);
  const [wysyla, setWysyla] = useState(false);

  async function zlozOferte(e: React.FormEvent) {
    e.preventDefault();
    setWysyla(true);
    setKomunikat(null);
    try {
      const res = await fetch(`/api/zlecenia/${id}/oferty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cena: Math.round(Number(cena.replace(",", ".")) * 100),
          wiadomosc,
        }),
      });
      const dane = (await res.json()) as { blad?: string };
      if (res.ok) {
        setKomunikat({ ok: true, tekst: "Oferta została wysłana do klienta." });
        setCena("");
        setWiadomosc("");
        router.refresh();
      } else {
        setKomunikat({ ok: false, tekst: dane.blad ?? "Nie udało się wysłać oferty." });
      }
    } catch {
      setKomunikat({ ok: false, tekst: "Błąd połączenia." });
    } finally {
      setWysyla(false);
    }
  }

  async function przelaczKrotkaListe(ofertaId: string, jestNaLiscie: boolean) {
    setKomunikat(null);
    const res = await fetch(`/api/oferty/${ofertaId}/krotka-lista`, {
      method: jestNaLiscie ? "DELETE" : "POST",
    });
    if (res.ok) {
      setKomunikat({
        ok: true,
        tekst: jestNaLiscie
          ? "Usunięto ofertę z krótkiej listy."
          : "Dodano do krótkiej listy — firma zobaczyła Twoje dane kontaktowe.",
      });
      router.refresh();
    } else {
      setKomunikat({ ok: false, tekst: "Nie udało się zaktualizować krótkiej listy." });
    }
  }

  return (
    <div className="w-full max-w-[1160px] mx-auto bg-[#FBF7F4] text-[#241C2B] min-h-screen px-6 sm:px-12 pt-10 pb-20">
      <p className="m-0 mb-4 text-[14px] text-[#6A5C70]">
        <Link href="/zlecenia" className="text-[#6A5C70] hover:text-[#241C2B]">
          Giełda zleceń
        </Link>{" "}
        &nbsp;›&nbsp; {okazja}
      </p>

      <div className="border border-[#E2D5CA] rounded-[20px] bg-white p-6 sm:p-9 mb-8">
        <h1 className="m-0 mb-4 font-fraunces font-normal text-[32px] sm:text-[40px] tracking-tight">
          {okazja}, {liczbaOsob} osób
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-[#EFE5DD] mb-6">
          <div>
            <div className="text-[12px] text-[#6A5C70]">Data</div>
            <div className="text-[15px] font-semibold">{dataDluga(data)}</div>
          </div>
          <div>
            <div className="text-[12px] text-[#6A5C70]">Lokalizacja</div>
            <div className="text-[15px] font-semibold">
              powiat {powiat}, {wojewodztwo}
            </div>
          </div>
          <div>
            <div className="text-[12px] text-[#6A5C70]">Liczba osób</div>
            <div className="text-[15px] font-semibold">{liczbaOsob}</div>
          </div>
          <div>
            <div className="text-[12px] text-[#6A5C70]">Budżet</div>
            <div className="text-[15px] font-semibold">
              {budzetMin !== null || budzetMax !== null
                ? `${budzetMin !== null ? zlote(budzetMin) : "—"} – ${budzetMax !== null ? zlote(budzetMax) : "—"}`
                : "ukryty / nie podano"}
            </div>
          </div>
        </div>

        {opis ? (
          <p className="m-0 text-[16px] leading-[1.7] text-[#3E3344] whitespace-pre-line">{opis}</p>
        ) : (
          <p className="m-0 text-[15px] text-[#6A5C70]">
            Pełny opis i budżet zlecenia są widoczne dla firm z aktywnym profilem w katalogu.
          </p>
        )}
      </div>

      {komunikat && (
        <p
          className={`m-0 mb-6 rounded-[12px] p-4 text-[14px] ${
            komunikat.ok
              ? "bg-[#E7EDE7] text-[#3F5142] border border-[#C7D6C8]"
              : "bg-[#FEF4E4] text-[#8A3B1E] border border-[#E2D5CA]"
          }`}
        >
          {komunikat.tekst}
        </p>
      )}

      {jestAutorem && (
        <section className="mb-8">
          <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">
            Otrzymane oferty ({oferty.length})
          </h2>
          {oferty.length === 0 ? (
            <p className="m-0 rounded-[18px] border border-dashed border-[#D9CCC2] bg-white p-8 text-center text-[15px] text-[#6A5C70]">
              Żadna firma nie złożyła jeszcze oferty. Powiadomimy Cię mailem, gdy pojawi się
              pierwsza.
            </p>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-4">
              {oferty.map((o) => (
                <li
                  key={o.id}
                  className="border border-[#E2D5CA] rounded-[18px] bg-white p-6 flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <div className="font-fraunces text-[22px]">{o.nazwaFirmy}</div>
                    <div className="font-fraunces text-[22px] text-[#3F5142]">{zlote(o.cena)}</div>
                  </div>
                  <p className="m-0 text-[15px] leading-[1.6] text-[#3E3344]">{o.wiadomosc}</p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => przelaczKrotkaListe(o.id, o.naKrotkiejLiscie)}
                      className={`text-[14px] font-bold rounded-[10px] px-5 py-2.5 cursor-pointer transition-colors ${
                        o.naKrotkiejLiscie
                          ? "bg-[#E7EDE7] text-[#3F5142] border border-[#C7D6C8]"
                          : "bg-[#F0A62E] text-[#241C2B] border-0 hover:bg-[#e29922]"
                      }`}
                    >
                      {o.naKrotkiejLiscie
                        ? "Na krótkiej liście ✓ (Kliknij, aby usunąć)"
                        : "Dodaj do krótkiej listy (odsłoń kontakt)"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {mozeZlozycOferte && (
        <section className="border border-[#E2D5CA] rounded-[20px] bg-white p-6 sm:p-8">
          <h2 className="m-0 mb-2 font-fraunces font-medium text-[24px]">Złóż ofertę</h2>
          <p className="m-0 mb-5 text-[14px] text-[#6A5C70]">
            Jedna firma może złożyć jedną ofertę na to zlecenie. Konkurencja nie widzi Twojej ceny.
          </p>
          <form onSubmit={zlozOferte} className="flex flex-col gap-4 max-w-[560px]">
            <div>
              <label htmlFor="bid-cena" className="block text-[14px] font-semibold mb-1">
                Proponowana cena łączna (zł)
              </label>
              <input
                id="bid-cena"
                type="number"
                min="1"
                required
                value={cena}
                onChange={(e) => setCena(e.target.value)}
                placeholder="np. 12500"
                className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[15px]"
              />
            </div>
            <div>
              <label htmlFor="bid-msg" className="block text-[14px] font-semibold mb-1">
                Zakres oferty i wiadomość dla klienta
              </label>
              <textarea
                id="bid-msg"
                required
                minLength={10}
                rows={4}
                value={wiadomosc}
                onChange={(e) => setWiadomosc(e.target.value)}
                placeholder="Opisz, co zawiera cena, menu, dostępność terminu..."
                className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[15px]"
              />
            </div>
            <button
              type="submit"
              disabled={wysyla}
              className="self-start text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] disabled:opacity-60 border-0 rounded-[12px] px-6 py-3 cursor-pointer"
            >
              {wysyla ? "Wysyłanie..." : "Wyślij ofertę"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";

export function PrzejmijProfilBox({ slug, nazwaFirmy }: { slug: string; nazwaFirmy: string }) {
  const [otwarty, setOtwarty] = useState(false);
  const [uzasadnienie, setUzasadnienie] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; tekst: string } | null>(null);
  const [wysyla, setWysyla] = useState(false);

  async function wyslij(e: React.FormEvent) {
    e.preventDefault();
    setWysyla(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/firmy/${slug}/przejecie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uzasadnienie }),
      });
      const dane = (await res.json()) as { komunikat?: string; blad?: string };
      if (res.ok) {
        setStatus({ ok: true, tekst: dane.komunikat ?? "Wniosek został wysłany." });
        setOtwarty(false);
      } else {
        setStatus({
          ok: false,
          tekst:
            res.status === 403
              ? "Zaloguj się na swoje konto, aby zgłosić przejęcie profilu."
              : (dane.blad ?? "Nie udało się złożyć wniosku."),
        });
      }
    } catch {
      setStatus({ ok: false, tekst: "Błąd połączenia. Spróbuj ponownie." });
    } finally {
      setWysyla(false);
    }
  }

  return (
    <div className="mt-4 border border-[#E2D5CA] rounded-[20px] bg-[#FEF4E4] p-6">
      <h3 className="m-0 mb-1.5 font-fraunces font-medium text-[19px]">
        Prowadzisz „{nazwaFirmy}”?
      </h3>
      <p className="m-0 mb-4 text-[14px] leading-[1.6] text-[#3E3344]">
        Przejmij ten profil bezpłatnie, aby aktualizować zdjęcia, ceny i odpowiadać na zapytania.
      </p>

      {status && (
        <p
          className={`m-0 mb-3 rounded-[10px] p-3 text-[13px] ${
            status.ok ? "bg-[#E7EDE7] text-[#3F5142]" : "bg-white text-[#8A3B1E]"
          }`}
        >
          {status.tekst}
        </p>
      )}

      {!otwarty ? (
        <button
          type="button"
          onClick={() => setOtwarty(true)}
          className="text-[14px] font-bold text-[#241C2B] bg-white border border-[#241C2B] hover:bg-[#241C2B] hover:text-white transition-colors rounded-[10px] px-4 py-2.5 cursor-pointer"
        >
          Przejmij ten profil
        </button>
      ) : (
        <form onSubmit={wyslij} className="flex flex-col gap-3">
          <textarea
            value={uzasadnienie}
            onChange={(e) => setUzasadnienie(e.target.value)}
            required
            minLength={10}
            rows={3}
            placeholder="Podaj np. NIP, numer telefonu lub adres strony www w celu weryfikacji..."
            className="w-full border border-[#D9CCC2] rounded-[10px] bg-white p-3 text-[14px]"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={wysyla}
              className="text-[14px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] disabled:opacity-60 border-0 rounded-[10px] px-4 py-2 cursor-pointer"
            >
              {wysyla ? "Wysyłanie..." : "Wyślij wniosek"}
            </button>
            <button
              type="button"
              onClick={() => setOtwarty(false)}
              className="text-[14px] text-[#6A5C70] bg-transparent border-0 cursor-pointer px-2"
            >
              Anuluj
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

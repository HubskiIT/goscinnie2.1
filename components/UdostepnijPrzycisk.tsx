"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

export function UdostepnijPrzycisk({ tytul }: { tytul: string }) {
  const [skopiowano, setSkopiowano] = useState(false);

  async function udostepnij() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: tytul, url });
        return;
      } catch {
        // Użytkownik anulował albo brak wsparcia — przejdź do kopiowania.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setSkopiowano(true);
      setTimeout(() => setSkopiowano(false), 2500);
    } catch {
      // Brak dostępu do schowka.
    }
  }

  return (
    <button
      type="button"
      onClick={udostepnij}
      className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#3E3344] bg-[#FBF7F4] border border-[#D9CCC2] hover:border-[#241C2B] hover:text-[#241C2B] rounded-[10px] px-4 py-2.5 cursor-pointer transition-colors"
    >
      <Share2 className="w-4 h-4" aria-hidden="true" />
      <span>{skopiowano ? "Skopiowano link ✓" : "Udostępnij"}</span>
    </button>
  );
}

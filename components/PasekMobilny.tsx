"use client";

import { Building2, ClipboardList, Home, PartyPopper, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const POZYCJE = [
  { adres: "/", etykieta: "Główna", ikona: Home },
  { adres: "/lokale", etykieta: "Lokale", ikona: Building2 },
  { adres: "/uslugodawcy", etykieta: "Usługi", ikona: Sparkles },
  { adres: "/zlecenia", etykieta: "Zlecenia", ikona: ClipboardList },
  { adres: "/imprezy", etykieta: "Imprezy", ikona: PartyPopper },
];

export function PasekMobilny() {
  const sciezka = usePathname();

  return (
    <nav
      aria-label="Nawigacja główna"
      className="lg:hidden fixed left-0 right-0 bottom-0 z-40 flex justify-around border-t border-[#EADFD6] bg-[#FBF7F4] px-1 py-1.5"
    >
      {POZYCJE.map((pozycja) => {
        const aktywna = pozycja.adres === "/" ? sciezka === "/" : sciezka.startsWith(pozycja.adres);
        const Ikona = pozycja.ikona;
        return (
          <Link
            key={pozycja.adres}
            href={pozycja.adres}
            aria-current={aktywna ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-[10px] text-[11px] transition-colors ${
              aktywna ? "text-[#241C2B] font-bold" : "text-[#6A5C70]"
            }`}
          >
            <Ikona aria-hidden="true" size={20} />
            {pozycja.etykieta}
          </Link>
        );
      })}
    </nav>
  );
}

import type { Metadata } from "next";
import { RejestracjaKlientaScreen } from "@/components/screens/RejestracjaKlientaScreen";
import { metadaneStrony } from "@/lib/metadane";
import { TRASY } from "@/lib/trasy";

export const metadata: Metadata = metadaneStrony({
  tytul: "Konto klienta",
  opis: "Załóż konto, żeby wystawić zlecenie i zbierać oferty w jednym miejscu.",
  sciezka: TRASY.rejestracjaKlienta,
});

export default function Strona() {
  return <RejestracjaKlientaScreen />;
}

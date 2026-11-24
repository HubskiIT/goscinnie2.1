import type { Metadata } from "next";
import { KontaktScreen } from "@/components/screens/KontaktScreen";
import { metadaneStrony } from "@/lib/metadane";
import { TRASY } from "@/lib/trasy";

export const metadata: Metadata = metadaneStrony({
  tytul: "Kontakt",
  opis: "Napisz do nas w sprawie konta, wpisu w katalogu albo zgłoszenia treści.",
  sciezka: TRASY.kontakt,
});

export default function Strona() {
  return <KontaktScreen />;
}

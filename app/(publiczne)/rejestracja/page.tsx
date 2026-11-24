import type { Metadata } from "next";
import { RejestracjaScreen } from "@/components/screens/RejestracjaScreen";
import { metadaneStrony } from "@/lib/metadane";
import { TRASY } from "@/lib/trasy";

export const metadata: Metadata = metadaneStrony({
  tytul: "Załóż konto",
  opis: "Konto klienta szukającego sali lub usługodawcy albo konto firmy w katalogu.",
  sciezka: TRASY.rejestracja,
});

export default function Strona() {
  return <RejestracjaScreen />;
}

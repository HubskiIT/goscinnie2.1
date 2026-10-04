import type { Metadata } from "next";
import { ZapytanieScreen } from "@/components/screens/ZapytanieScreen";

export const metadata: Metadata = {
  title: "Zapytanie do firmy",
  description: "Wyślij zapytanie o termin i wycenę.",
};

export default function Strona() {
  return <ZapytanieScreen />;
}

import type { Metadata } from "next";
import { NoweZlecenieScreen } from "@/components/screens/NoweZlecenieScreen";

export const metadata: Metadata = {
  title: "Dodaj zlecenie",
  description: "Opisz, czego szukasz, a firmy zgłoszą się same.",
};

export default function Strona() {
  return <NoweZlecenieScreen />;
}

import type { Metadata } from "next";
import { ImprezyScreen } from "@/components/screens/ImprezyScreen";

export const metadata: Metadata = {
  title: "Imprezy",
  description: "Wydarzenia organizowane przez lokale w Twojej okolicy.",
};

export default function Strona() {
  return <ImprezyScreen />;
}

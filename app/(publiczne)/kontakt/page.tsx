import type { Metadata } from "next";
import { KontaktScreen } from "@/components/screens/KontaktScreen";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Napisz do nas.",
};

export default function Strona() {
  return <KontaktScreen />;
}

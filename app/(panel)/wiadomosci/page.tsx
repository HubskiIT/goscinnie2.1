import type { Metadata } from "next";
import { WiadomosciScreen } from "@/components/screens/WiadomosciScreen";

export const metadata: Metadata = {
  title: "Wiadomości",
  description: "Rozmowy z lokalami i usługodawcami.",
};

export default function Strona() {
  return <WiadomosciScreen />;
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ZamowienieAbonamentuScreen } from "@/components/screens/ZamowienieAbonamentuScreen";
import { PLATNOSCI_WLACZONE } from "@/lib/serwis";

export const metadata: Metadata = {
  title: "Abonament",
  description: "Zamówienie abonamentu.",
};

export default function Strona() {
  // Płatności wyłączone (lib/serwis.ts): zamawiania abonamentu nie pokazujemy.
  if (!PLATNOSCI_WLACZONE) redirect("/panel");
  return <ZamowienieAbonamentuScreen />;
}

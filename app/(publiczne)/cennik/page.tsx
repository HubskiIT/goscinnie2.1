import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CennikScreen } from "@/components/screens/CennikScreen";
import { PLATNOSCI_WLACZONE } from "@/lib/serwis";

export const metadata: Metadata = {
  title: "Cennik dla firm",
  description: "Abonament dla firm. Klient nie płaci nigdy i za nic.",
};

export default function Strona() {
  // Płatności wyłączone (lib/serwis.ts): cennika nie ma, serwis jest darmowy.
  if (!PLATNOSCI_WLACZONE) notFound();
  return <CennikScreen />;
}

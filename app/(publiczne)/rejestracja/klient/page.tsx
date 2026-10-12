import type { Metadata } from "next";
import { RejestracjaKlientaScreen } from "@/components/screens/RejestracjaKlientaScreen";

export const metadata: Metadata = {
  title: "Konto klienta",
  description: "Załóż konto, żeby wystawić zlecenie i zbierać oferty w jednym miejscu.",
};

export default function Strona() {
  return <RejestracjaKlientaScreen />;
}

import type { Metadata } from "next";
import { RejestracjaFirmyScreen } from "@/components/screens/RejestracjaFirmyScreen";

export const metadata: Metadata = {
  title: "Dodaj firmę",
  description: "Dodaj swoją firmę do katalogu Gościnnie.",
};

export default function Strona() {
  return <RejestracjaFirmyScreen />;
}

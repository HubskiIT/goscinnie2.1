import type { Metadata } from "next";
import { RejestracjaFirmyScreen } from "@/components/screens/RejestracjaFirmyScreen";

export const metadata: Metadata = {
  title: "Profil firmy",
  description: "Kreator profilu firmy.",
};

export default function Strona() {
  return <RejestracjaFirmyScreen />;
}

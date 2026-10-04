import type { Metadata } from "next";
import { PanelFirmyScreen } from "@/components/screens/PanelFirmyScreen";

export const metadata: Metadata = {
  title: "Panel firmy",
  description: "Pulpit firmy w Gościnnie.",
};

export default function Strona() {
  return <PanelFirmyScreen />;
}

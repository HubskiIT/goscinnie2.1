import type { Metadata } from "next";
import { LogowanieScreen } from "@/components/screens/LogowanieScreen";

export const metadata: Metadata = {
  title: "Logowanie",
  description: "Zaloguj się do Gościnnie.",
};

export default function Strona() {
  return <LogowanieScreen />;
}

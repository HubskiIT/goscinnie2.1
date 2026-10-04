import type { Metadata } from "next";
import { CennikScreen } from "@/components/screens/CennikScreen";

export const metadata: Metadata = {
  title: "Cennik dla firm",
  description: "Roczny abonament dla firm. Klient nie płaci nigdy i za nic.",
};

export default function Strona() {
  return <CennikScreen />;
}

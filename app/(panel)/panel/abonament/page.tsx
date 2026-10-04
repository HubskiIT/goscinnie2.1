import type { Metadata } from "next";
import { ZamowienieAbonamentuScreen } from "@/components/screens/ZamowienieAbonamentuScreen";

export const metadata: Metadata = {
  title: "Abonament",
  description: "Zamówienie abonamentu.",
};

export default function Strona() {
  return <ZamowienieAbonamentuScreen />;
}

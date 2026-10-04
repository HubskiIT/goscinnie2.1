import type { Metadata } from "next";
import { ZleceniaScreen } from "@/components/screens/ZleceniaScreen";

export const metadata: Metadata = {
  title: "Giełda zleceń",
  description: "Zlecenia od klientów szukających lokalu i usług.",
};

export default function Strona() {
  return <ZleceniaScreen />;
}

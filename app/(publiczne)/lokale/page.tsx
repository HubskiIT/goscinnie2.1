import type { Metadata } from "next";
import { LokaleScreen } from "@/components/screens/LokaleScreen";

export const metadata: Metadata = {
  title: "Lokale i sale",
  description: "Sale weselne, dworki, restauracje i stodoły na każdą okazję.",
};

export default function Strona() {
  return <LokaleScreen />;
}

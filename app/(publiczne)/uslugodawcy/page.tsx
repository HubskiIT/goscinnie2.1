import type { Metadata } from "next";
import { UslugodawcyScreen } from "@/components/screens/UslugodawcyScreen";

export const metadata: Metadata = {
  title: "Usługodawcy",
  description: "Fotografowie, muzyka, catering i dekoracje na Twoją uroczystość.",
};

export default function Strona() {
  return <UslugodawcyScreen />;
}

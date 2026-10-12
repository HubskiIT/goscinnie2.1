import type { Metadata } from "next";
import { RejestracjaScreen } from "@/components/screens/RejestracjaScreen";

export const metadata: Metadata = {
  title: "Załóż konto",
  description: "Konto klienta szukającego sali lub usługodawcy albo konto firmy w katalogu.",
};

export default function Strona() {
  return <RejestracjaScreen />;
}

import type { Metadata } from "next";
import { StanPusty } from "@/components/StanPusty";

export const metadata: Metadata = {
  title: "Dla firm",
  description: "Strona dla firm powstaje. Cennik i zasady abonamentu są już dostępne.",
};

export default function Strona() {
  return (
    <StanPusty
      tytul="Dla firm"
      opis="Strona dla firm powstaje. Cennik i zasady abonamentu są już dostępne."
      akcja={{ etykieta: "Zobacz cennik", adres: "/cennik" }}
    />
  );
}

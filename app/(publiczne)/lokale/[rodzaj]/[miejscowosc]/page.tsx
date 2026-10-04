import type { Metadata } from "next";
import { StanPusty } from "@/components/StanPusty";

export const metadata: Metadata = {
  title: "Lokale",
  description: "Strony pod wyszukiwarkę powstają w Etapie 3 planu.",
};

export default function Strona() {
  return (
    <StanPusty
      tytul="Lokale"
      opis="Strony pod wyszukiwarkę powstają w Etapie 3 planu."
      akcja={{ etykieta: "Przejdź do listy lokali", adres: "/lokale" }}
    />
  );
}

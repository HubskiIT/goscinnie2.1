import type { Metadata } from "next";
import { StanPusty } from "@/components/StanPusty";

export const metadata: Metadata = {
  title: "Usługodawcy",
  description: "Strony pod wyszukiwarkę powstają w Etapie 3 planu.",
};

export default function Strona() {
  return (
    <StanPusty
      tytul="Usługodawcy"
      opis="Strony pod wyszukiwarkę powstają w Etapie 3 planu."
      akcja={{ etykieta: "Przejdź do listy usługodawców", adres: "/uslugodawcy" }}
    />
  );
}

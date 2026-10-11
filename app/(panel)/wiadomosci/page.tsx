import type { Metadata } from "next";
import { StanPusty } from "@/components/StanPusty";

export const metadata: Metadata = {
  title: "Wiadomości",
  description: "Rozmowy z lokalami i usługodawcami.",
};

/**
 * Wiadomości ruszą razem z zapytaniami do firm. Wcześniej stał tu ekran
 * prototypu z rozmowami, których nikt nie prowadził.
 */
export default function Strona() {
  return (
    <StanPusty
      tytul="Wiadomości"
      opis="Rozmowy z klientami pojawią się tutaj, gdy uruchomimy zapytania do firm."
      akcja={{ etykieta: "Wróć do panelu", adres: "/panel" }}
    />
  );
}

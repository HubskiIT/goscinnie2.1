import type { Metadata } from "next";
import { StanPusty } from "@/components/StanPusty";

export const metadata: Metadata = {
  title: "Moje zlecenia i zapytania",
  description: "Zlecenia i zapytania wysłane przez Gościnnie.",
};

export default function Strona() {
  return (
    <StanPusty
      tytul="Moje zlecenia i zapytania"
      opis="Zlecenia i zapytania pojawią się tutaj, gdy uruchomimy wysyłanie ich przez serwis."
      akcja={{ etykieta: "Przeglądaj lokale", adres: "/lokale" }}
    />
  );
}

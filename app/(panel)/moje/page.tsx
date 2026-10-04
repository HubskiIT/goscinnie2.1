import type { Metadata } from "next";
import { StanPusty } from "@/components/StanPusty";

export const metadata: Metadata = {
  title: "Moje zlecenia i zapytania",
  description: "Panel klienta rusza razem z kontami. Na razie możesz dodać zlecenie bez logowania.",
};

export default function Strona() {
  return (
    <StanPusty
      tytul="Moje zlecenia i zapytania"
      opis="Panel klienta rusza razem z kontami. Na razie możesz dodać zlecenie bez logowania."
      akcja={{ etykieta: "Dodaj zlecenie", adres: "/dodaj-zlecenie" }}
    />
  );
}

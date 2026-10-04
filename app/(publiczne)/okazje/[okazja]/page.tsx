import type { Metadata } from "next";
import { StanPusty } from "@/components/StanPusty";

export const metadata: Metadata = {
  title: "Strona okazji",
  description:
    "Teksty stron okazji powstają w Etapie 3 planu. Do tego czasu zacznij od wyszukiwarki lokali.",
};

export default function Strona() {
  return (
    <StanPusty
      tytul="Strona okazji"
      opis="Teksty stron okazji powstają w Etapie 3 planu. Do tego czasu zacznij od wyszukiwarki lokali."
      akcja={{ etykieta: "Szukaj lokalu", adres: "/lokale" }}
    />
  );
}

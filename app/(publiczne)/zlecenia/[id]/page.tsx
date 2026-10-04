import type { Metadata } from "next";
import { StanPusty } from "@/components/StanPusty";

export const metadata: Metadata = {
  title: "Szczegóły zlecenia",
  description: "Treść zleceń pojawi się razem z danymi. Na razie zobacz całą giełdę.",
};

export default function Strona() {
  return (
    <StanPusty
      tytul="Szczegóły zlecenia"
      opis="Treść zleceń pojawi się razem z danymi. Na razie zobacz całą giełdę."
      akcja={{ etykieta: "Zobacz giełdę zleceń", adres: "/zlecenia" }}
    />
  );
}

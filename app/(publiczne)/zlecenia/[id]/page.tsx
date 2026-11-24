import type { Metadata } from "next";
import { StanPusty } from "@/components/StanPusty";
import { metadaneBezIndeksu } from "@/lib/metadane";

export const metadata: Metadata = metadaneBezIndeksu(
  "Szczegóły zlecenia",
  "Treść zleceń pojawi się razem z danymi. Na razie zobacz całą giełdę.",
);

export default function Strona() {
  return (
    <StanPusty
      tytul="Szczegóły zlecenia"
      opis="Treść zleceń pojawi się razem z danymi. Na razie zobacz całą giełdę."
      akcja={{ etykieta: "Zobacz giełdę zleceń", adres: "/zlecenia" }}
    />
  );
}

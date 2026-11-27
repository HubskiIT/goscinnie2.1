import type { Metadata } from "next";
import { headers } from "next/headers";
import { WiadomosciScreen } from "@/components/screens/WiadomosciScreen";
import { widzZZadania } from "@/lib/auth/widz";
import { pobierzMojeWiadomosci } from "@/lib/db/queries/zapytania";

export const metadata: Metadata = {
  title: "Wiadomości",
  description: "Rozmowy z lokalami i usługodawcami.",
};

export default async function Strona() {
  const widz = await widzZZadania(await headers());
  const skrzynka = await pobierzMojeWiadomosci(widz);

  return <WiadomosciScreen skrzynka={skrzynka} />;
}

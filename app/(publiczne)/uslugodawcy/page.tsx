import type { Metadata } from "next";
import { headers } from "next/headers";
import { UslugodawcyScreen } from "@/components/screens/UslugodawcyScreen";
import { pobierzUslugodawcow } from "@/content/ogloszenia";
import { widzZZadania } from "@/lib/auth/widz";
import { uslugodawcyZBazy } from "@/lib/katalog";
import { metadaneStrony } from "@/lib/metadane";
import { TRASY } from "@/lib/trasy";

export const metadata: Metadata = metadaneStrony({
  tytul: "Usługodawcy na uroczystości",
  opis: "Fotografowie, muzyka, catering i dekoracje na Twoją uroczystość. Ceny od, bez prowizji od umów.",
  sciezka: TRASY.uslugodawcy,
});

export default async function Strona() {
  const zBazy = await uslugodawcyZBazy(await widzZZadania(await headers()));
  return <UslugodawcyScreen uslugodawcy={[...zBazy, ...pobierzUslugodawcow()]} />;
}

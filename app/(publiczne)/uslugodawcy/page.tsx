import type { Metadata } from "next";
import { headers } from "next/headers";
import { UslugodawcyScreen } from "@/components/screens/UslugodawcyScreen";
import { pobierzUslugodawcow } from "@/content/ogloszenia";
import { widzZZadania } from "@/lib/auth/widz";
import { uslugodawcyZBazy } from "@/lib/katalog";

export const metadata: Metadata = {
  title: "Usługodawcy",
  description: "Fotografowie, muzyka, catering i dekoracje na Twoją uroczystość.",
};

export default async function Strona() {
  const zBazy = await uslugodawcyZBazy(await widzZZadania(await headers()));
  return <UslugodawcyScreen uslugodawcy={[...zBazy, ...pobierzUslugodawcow()]} />;
}

import type { Metadata } from "next";
import { headers } from "next/headers";
import { PanelScreen } from "@/components/screens/PanelScreen";
import { widzZZadania } from "@/lib/auth/widz";
import { pobierzMojeFirmy } from "@/lib/db/queries/katalog";

export const metadata: Metadata = {
  title: "Twój panel",
  description: "Firmy w katalogu Gościnnie.",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Strona({ searchParams }: Props) {
  // Layout panelu przepuszcza tylko zalogowanych, więc anonima tu nie ma.
  const firmy = await pobierzMojeFirmy(await widzZZadania(await headers()));
  const poPublikacji = (await searchParams).opublikowano === "1";
  return <PanelScreen firmy={firmy} poPublikacji={poPublikacji} />;
}

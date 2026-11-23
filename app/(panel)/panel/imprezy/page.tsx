import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ImprezyFirmyScreen } from "@/components/screens/ImprezyFirmyScreen";
import { widzZZadania } from "@/lib/auth/widz";
import { pobierzImprezyFirmy } from "@/lib/db/queries/imprezy";

export const metadata: Metadata = {
  title: "Twoje imprezy",
  description: "Zapowiedzi organizowane przez Twój lokal.",
};

/**
 * Imprezy lokalu.
 *
 * `notFound` dla kogoś, kto nie prowadzi lokalu, zamiast ekranu „to nie
 * dla Ciebie”. Usługodawca nie ma tu czego szukać i strona ma dla niego
 * nie istnieć; layout panelu odesłał już wcześniej anonima na logowanie.
 */
export default async function Strona() {
  const widz = await widzZZadania(await headers());
  if (widz.rodzaj !== "firma") notFound();

  const imprezy = await pobierzImprezyFirmy(widz, widz.companyId);
  if (!imprezy.ok) notFound();

  return <ImprezyFirmyScreen imprezy={imprezy.dane} />;
}

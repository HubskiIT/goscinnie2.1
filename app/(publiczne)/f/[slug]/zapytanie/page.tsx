import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ZapytanieScreen } from "@/components/screens/ZapytanieScreen";
import { widzZZadania } from "@/lib/auth/widz";
import { pobierzProfilFirmy } from "@/lib/db/queries/firmy";
import { metadaneBezIndeksu } from "@/lib/metadane";

export const metadata: Metadata = metadaneBezIndeksu(
  "Zapytanie do firmy",
  "Wyślij zapytanie o termin i wycenę.",
);

export default async function Strona({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const widz = await widzZZadania(await headers());
  const profil = await pobierzProfilFirmy(widz, slug);
  if (!profil?.widocznosc.widoczny) notFound();

  return (
    <ZapytanieScreen
      firma={{
        slug: profil.slug,
        nazwa: profil.nazwa,
        miasto: profil.miasto,
        powiat: profil.powiat,
      }}
      zalogowany={widz.rodzaj !== "anonim"}
    />
  );
}

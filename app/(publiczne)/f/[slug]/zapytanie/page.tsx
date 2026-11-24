import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ZapytanieScreen } from "@/components/screens/ZapytanieScreen";
import { pobierzLokal } from "@/content/ogloszenia";
import { metadaneBezIndeksu } from "@/lib/metadane";

export const metadata: Metadata = metadaneBezIndeksu(
  "Zapytanie do firmy",
  "Wyślij zapytanie o termin i wycenę.",
);

export default async function Strona({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lokal = pobierzLokal(slug);
  if (!lokal) notFound();
  return <ZapytanieScreen lokal={lokal} />;
}

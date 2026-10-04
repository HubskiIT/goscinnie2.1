import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ZapytanieScreen } from "@/components/screens/ZapytanieScreen";
import { pobierzLokal } from "@/content/ogloszenia";

export const metadata: Metadata = {
  title: "Zapytanie do firmy",
  description: "Wyślij zapytanie o termin i wycenę.",
};

export default async function Strona({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lokal = pobierzLokal(slug);
  if (!lokal) notFound();
  return <ZapytanieScreen lokal={lokal} />;
}

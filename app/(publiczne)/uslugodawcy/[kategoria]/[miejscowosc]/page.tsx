import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UslugodawcyScreen } from "@/components/screens/UslugodawcyScreen";
import { pobierzKategorie_ } from "@/content/kategorie";

interface Props {
  params: Promise<{ kategoria: string; miejscowosc: string }>;
}

function nazwaZeSlugu(slug: string): string {
  const bez = slug.replaceAll("-", " ");
  return bez.charAt(0).toUpperCase() + bez.slice(1);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kategoria: slugKategorii, miejscowosc } = await params;
  const kategoria = pobierzKategorie_(slugKategorii);
  if (!kategoria) return { title: "Nie ma takiej strony" };
  return {
    title: `${kategoria.nazwa}: ${nazwaZeSlugu(miejscowosc)}`,
    description: `${kategoria.nazwa} w okolicy. Ceny od, bez prowizji od umów.`,
  };
}

export default async function Strona({ params }: Props) {
  const { kategoria: slugKategorii } = await params;
  const kategoria = pobierzKategorie_(slugKategorii);
  if (!kategoria) notFound();
  return <UslugodawcyScreen kategoria={kategoria.slug} />;
}

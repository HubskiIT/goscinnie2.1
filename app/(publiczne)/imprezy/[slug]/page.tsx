import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ImprezaScreen } from "@/components/screens/ImprezaScreen";
import { pobierzImpreze, pobierzLokal } from "@/content/ogloszenia";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const impreza = pobierzImpreze(slug);
  if (!impreza) return { title: "Nie ma takiej strony" };
  return {
    title: impreza.nazwa,
    description: "Impreza organizowana przez lokal w Gościnnie.",
  };
}

export default async function Strona({ params }: Props) {
  const { slug } = await params;
  const impreza = pobierzImpreze(slug);
  if (!impreza) notFound();
  const lokal = pobierzLokal(impreza.lokalSlug);
  if (!lokal) notFound();
  return <ImprezaScreen impreza={impreza} lokal={lokal} />;
}

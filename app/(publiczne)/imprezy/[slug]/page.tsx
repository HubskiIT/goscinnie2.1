import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ImprezaScreen } from "@/components/screens/ImprezaScreen";
import { PRZYKLADY } from "@/lib/trasy";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug !== PRZYKLADY.impreza) return { title: "Nie ma takiej strony" };
  return {
    title: "Andrzejki pod Lipami",
    description: "Impreza organizowana przez lokal w Gościnnie.",
  };
}

export default async function Strona({ params }: Props) {
  const { slug } = await params;
  if (slug !== PRZYKLADY.impreza) notFound();
  return <ImprezaScreen />;
}

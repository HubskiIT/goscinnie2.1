import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfilScreen } from "@/components/screens/ProfilScreen";
import { WpisBezProfiluScreen } from "@/components/screens/WpisBezProfiluScreen";
import { pobierzLokal } from "@/content/ogloszenia";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lokal = pobierzLokal(slug);
  if (!lokal) return { title: "Nie ma takiej strony" };
  return {
    title: lokal.nazwa,
    description:
      lokal.status === "visitcard"
        ? "Wpis w katalogu Gościnnie. Firma nie prowadzi jeszcze profilu."
        : "Profil lokalu w katalogu Gościnnie.",
  };
}

export default async function Strona({ params }: Props) {
  const { slug } = await params;
  const lokal = pobierzLokal(slug);
  if (!lokal) notFound();
  // Firma, która nie przejęła jeszcze wpisu, dostaje wersję "przejmij profil".
  if (lokal.status === "visitcard") return <WpisBezProfiluScreen lokal={lokal} />;
  return <ProfilScreen lokal={lokal} />;
}

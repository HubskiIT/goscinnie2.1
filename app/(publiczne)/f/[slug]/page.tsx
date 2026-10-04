import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfilScreen } from "@/components/screens/ProfilScreen";
import { WpisBezProfiluScreen } from "@/components/screens/WpisBezProfiluScreen";
import { PRZYKLADY } from "@/lib/trasy";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === PRZYKLADY.wpisBezProfilu) {
    return {
      title: "Stary Spichlerz",
      description: "Wpis w katalogu Gościnnie. Firma nie prowadzi jeszcze profilu.",
    };
  }
  if (slug === PRZYKLADY.lokal) {
    return {
      title: "Dwór pod Lipami",
      description: "Profil lokalu w katalogu Gościnnie.",
    };
  }
  return { title: "Nie ma takiej strony" };
}

export default async function Strona({ params }: Props) {
  const { slug } = await params;
  // Do Etapu 2 rozpoznajemy tylko dwa przykładowe ogłoszenia z punktu 6 planu.
  if (slug === PRZYKLADY.wpisBezProfilu) return <WpisBezProfiluScreen />;
  if (slug === PRZYKLADY.lokal) return <ProfilScreen />;
  notFound();
}

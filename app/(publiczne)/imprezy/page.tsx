import type { Metadata } from "next";
import { ImprezyScreen } from "@/components/screens/ImprezyScreen";
import { odczytajKryteriaImprez, wyszukajImprezy } from "@/lib/filtry";

export const metadata: Metadata = {
  title: "Imprezy",
  description: "Wydarzenia organizowane przez lokale w Twojej okolicy.",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Strona({ searchParams }: Props) {
  const kryteria = odczytajKryteriaImprez(await searchParams);
  return <ImprezyScreen imprezy={wyszukajImprezy(kryteria)} kryteria={kryteria} />;
}

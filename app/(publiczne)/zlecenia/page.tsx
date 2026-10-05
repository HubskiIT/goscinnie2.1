import type { Metadata } from "next";
import { ZleceniaScreen } from "@/components/screens/ZleceniaScreen";
import { odczytajKryteriaZlecen, wyszukajZlecenia } from "@/lib/filtry";

export const metadata: Metadata = {
  title: "Giełda zleceń",
  description: "Zlecenia od klientów szukających lokalu i usług.",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Strona({ searchParams }: Props) {
  const kryteria = odczytajKryteriaZlecen(await searchParams);
  return <ZleceniaScreen zlecenia={wyszukajZlecenia(kryteria)} kryteria={kryteria} />;
}

import type { Metadata } from "next";
import { LokaleScreen } from "@/components/screens/LokaleScreen";
import { odczytajKryteria } from "@/lib/wyszukiwanie";
import { wyszukajLokale } from "@/lib/wyszukiwanie-serwer";

export const metadata: Metadata = {
  title: "Lokale i sale",
  description: "Sale weselne, dworki, restauracje i stodoły na każdą okazję.",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Strona({ searchParams }: Props) {
  // Stan wyszukiwarki czytamy z adresu i filtrujemy po stronie serwera,
  // żeby ten sam adres w nowej karcie dał ten sam wynik.
  const kryteria = odczytajKryteria(await searchParams);
  return <LokaleScreen lokale={wyszukajLokale(kryteria)} kryteria={kryteria} />;
}

import type { Metadata } from "next";
import { headers } from "next/headers";
import { LokaleScreen } from "@/components/screens/LokaleScreen";
import { widzZZadania } from "@/lib/auth/widz";
import { lokaleZBazy } from "@/lib/katalog";
import { metadaneStrony } from "@/lib/metadane";
import { TRASY } from "@/lib/trasy";
import { odczytajKryteria } from "@/lib/wyszukiwanie";
import { wyszukajLokale } from "@/lib/wyszukiwanie-serwer";

export const metadata: Metadata = metadaneStrony({
  tytul: "Sale i lokale na każdą okazję",
  opis: "Sale weselne, dworki, restauracje i stodoły. Obiekty na wesela, komunie, chrzciny, osiemnastki, przyjęcia firmowe i stypy. Ceny od, bez prowizji.",
  sciezka: TRASY.lokale,
});

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Strona({ searchParams }: Props) {
  // Stan wyszukiwarki czytamy z adresu i filtrujemy po stronie serwera,
  // żeby ten sam adres w nowej karcie dał ten sam wynik.
  const kryteria = odczytajKryteria(await searchParams);
  const zBazy = await lokaleZBazy(await widzZZadania(await headers()));
  return <LokaleScreen lokale={wyszukajLokale(kryteria, zBazy)} kryteria={kryteria} />;
}

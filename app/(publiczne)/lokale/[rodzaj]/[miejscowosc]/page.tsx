import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { LokaleScreen } from "@/components/screens/LokaleScreen";
import { nazwaMiejscowosci } from "@/content/miejscowosci";
import { pobierzRodzajLokalu } from "@/content/rodzaje-lokali";
import { widzZZadania } from "@/lib/auth/widz";
import { lokaleZBazy } from "@/lib/katalog";
import { metadaneStrony } from "@/lib/metadane";
import { lokaleWg } from "@/lib/trasy";
import type { KryteriaLokali } from "@/lib/wyszukiwanie";
import { wyszukajLokale } from "@/lib/wyszukiwanie-serwer";

interface Props {
  params: Promise<{ rodzaj: string; miejscowosc: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rodzaj: slugRodzaju, miejscowosc } = await params;
  const rodzaj = pobierzRodzajLokalu(slugRodzaju);
  if (!rodzaj) return { title: "Nie ma takiej strony" };
  return metadaneStrony({
    tytul: `${rodzaj.nazwaMnoga}: ${nazwaMiejscowosci(miejscowosc)}`,
    opis: `${rodzaj.nazwaMnoga} w ${nazwaMiejscowosci(miejscowosc)} i okolicy, z ceną od i bez prowizji od umów.`,
    sciezka: lokaleWg(rodzaj.slug, miejscowosc),
  });
}

export default async function Strona({ params }: Props) {
  const { rodzaj: slugRodzaju, miejscowosc } = await params;
  const rodzaj = pobierzRodzajLokalu(slugRodzaju);
  if (!rodzaj) notFound();

  const kryteria: KryteriaLokali = {
    rodzaj: rodzaj.slug,
    miejscowosc: nazwaMiejscowosci(miejscowosc),
    promienKm: 25,
    goscie: null,
    termin: null,
    udogodnienia: [],
  };
  const zBazy = await lokaleZBazy(await widzZZadania(await headers()));
  return (
    <LokaleScreen
      lokale={wyszukajLokale(kryteria, zBazy)}
      kryteria={kryteria}
      okolica={kryteria.miejscowosc}
    />
  );
}

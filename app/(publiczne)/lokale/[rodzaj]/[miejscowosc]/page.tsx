import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { LokaleScreen } from "@/components/screens/LokaleScreen";
import { pobierzRodzajLokalu } from "@/content/rodzaje-lokali";
import { widzZZadania } from "@/lib/auth/widz";
import { lokaleZBazy } from "@/lib/katalog";
import type { KryteriaLokali } from "@/lib/wyszukiwanie";
import { wyszukajLokale } from "@/lib/wyszukiwanie-serwer";

interface Props {
  params: Promise<{ rodzaj: string; miejscowosc: string }>;
}

/** Adres w stylu /lokale/sale-weselne/wroclaw to wejście z wyszukiwarki. */
function nazwaZeSlugu(slug: string): string {
  const bez = slug.replaceAll("-", " ");
  return bez.charAt(0).toUpperCase() + bez.slice(1);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rodzaj: slugRodzaju, miejscowosc } = await params;
  const rodzaj = pobierzRodzajLokalu(slugRodzaju);
  if (!rodzaj) return { title: "Nie ma takiej strony" };
  return {
    title: `${rodzaj.nazwaMnoga}: ${nazwaZeSlugu(miejscowosc)}`,
    description: `${rodzaj.nazwaMnoga} w okolicy, z ceną od i bez prowizji od umów.`,
  };
}

export default async function Strona({ params }: Props) {
  const { rodzaj: slugRodzaju, miejscowosc } = await params;
  const rodzaj = pobierzRodzajLokalu(slugRodzaju);
  if (!rodzaj) notFound();

  const kryteria: KryteriaLokali = {
    rodzaj: rodzaj.slug,
    miejscowosc: nazwaZeSlugu(miejscowosc),
    promienKm: 25,
    goscie: null,
    termin: null,
    udogodnienia: [],
  };
  const zBazy = await lokaleZBazy(await widzZZadania(await headers()));
  return <LokaleScreen lokale={wyszukajLokale(kryteria, zBazy)} kryteria={kryteria} />;
}

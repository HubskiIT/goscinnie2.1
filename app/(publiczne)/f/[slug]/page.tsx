import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ProfilFirmyScreen } from "@/components/screens/ProfilFirmyScreen";
import { ProfilScreen } from "@/components/screens/ProfilScreen";
import { WpisBezProfiluScreen } from "@/components/screens/WpisBezProfiluScreen";
import { pobierzLokal } from "@/content/ogloszenia";
import { widzZZadania } from "@/lib/auth/widz";
import { pobierzFirmeKatalogu } from "@/lib/db/queries/katalog";
import { pobierzSzczegolyFirmyPoSlugu } from "@/lib/db/queries/szczegoly";
import { szczegolyNaProfil } from "@/lib/szczegoly-profil";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Najpierw firma z bazy, potem przykładowe ogłoszenie z content/.
 *
 * Przykłady nie leżą w bazie, więc prawdziwa firma może dostać ten sam slug
 * co przykład. Wtedy wygrywa prawdziwa firma.
 */
async function znajdz(slug: string) {
  const widz = await widzZZadania(await headers());
  const zBazy = await pobierzFirmeKatalogu(widz, slug);
  if (zBazy) return { rodzaj: "baza" as const, firma: zBazy };
  const lokal = pobierzLokal(slug);
  if (lokal) return { rodzaj: "przyklad" as const, lokal };
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const wynik = await znajdz(slug);
  if (!wynik) return { title: "Nie ma takiej strony" };
  if (wynik.rodzaj === "baza") {
    return {
      title: wynik.firma.nazwa,
      description: `${wynik.firma.nazwa}, ${wynik.firma.miejscowosc.nazwa}. Profil w katalogu Gościnnie.`,
    };
  }
  return {
    title: wynik.lokal.nazwa,
    description:
      wynik.lokal.status === "visitcard"
        ? "Wpis w katalogu Gościnnie. Firma nie prowadzi jeszcze profilu."
        : "Profil lokalu w katalogu Gościnnie.",
  };
}

export default async function Strona({ params }: Props) {
  const { slug } = await params;
  const wynik = await znajdz(slug);
  if (!wynik) notFound();
  if (wynik.rodzaj === "baza") {
    /*
     * Szczegóły czytamy dopiero tutaj, gdy już wiadomo, że firma istnieje
     * i jest widoczna. Pobranie ich w `znajdz` kosztowałoby dwa zapytania
     * przy każdym wejściu na adres przykładowego ogłoszenia i przy każdym
     * trafieniu w nieistniejący slug.
     */
    const widz = await widzZZadania(await headers());
    const szczegoly = await pobierzSzczegolyFirmyPoSlugu(widz, wynik.firma.slug);

    return <ProfilFirmyScreen firma={wynik.firma} szczegoly={szczegolyNaProfil(szczegoly)} />;
  }
  // Firma, która nie przejęła jeszcze wpisu, dostaje wersję "przejmij profil".
  if (wynik.lokal.status === "visitcard") return <WpisBezProfiluScreen lokal={wynik.lokal} />;
  return <ProfilScreen lokal={wynik.lokal} />;
}

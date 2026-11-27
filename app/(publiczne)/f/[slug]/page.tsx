import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ProfilFirmyScreen } from "@/components/screens/ProfilFirmyScreen";
import { ProfilScreen } from "@/components/screens/ProfilScreen";
import { WpisBezProfiluScreen } from "@/components/screens/WpisBezProfiluScreen";
import { pobierzLokal } from "@/content/ogloszenia";
import { pobierzRodzajLokalu } from "@/content/rodzaje-lokali";
import { adresAplikacji } from "@/lib/adres";
import { widzZZadania } from "@/lib/auth/widz";
import { pobierzProfilFirmy } from "@/lib/db/queries/firmy";
import { pobierzFirmeKatalogu } from "@/lib/db/queries/katalog";
import { pobierzSzczegolyFirmyPoSlugu } from "@/lib/db/queries/szczegoly";
import { metadaneBezIndeksu, metadaneStrony } from "@/lib/metadane";
import { szczegolyNaProfil } from "@/lib/szczegoly-profil";
import { firma as trasaFirmy } from "@/lib/trasy";

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
    return metadaneStrony({
      tytul: `${wynik.firma.nazwa}, ${wynik.firma.miejscowosc.nazwa}`,
      opis: `${wynik.firma.nazwa}, ${wynik.firma.miejscowosc.nazwa}. Sprawdź ofertę i zapytaj o termin.`,
      sciezka: trasaFirmy(slug),
    });
  }
  /*
   * Ogłoszenie przykładowe z `content/` nie jest niczyją prawdziwą firmą,
   * więc zostaje dostępne pod linkiem i poza indeksem. Katalog pokazowy
   * w wynikach wyszukiwania to dokładnie ta cienka treść, przed którą
   * ostrzega `lib/indeksowanie.ts`.
   */
  return {
    ...metadaneBezIndeksu(
      wynik.lokal.nazwa,
      wynik.lokal.status === "visitcard"
        ? "Wpis w katalogu Gościnnie. Firma nie prowadzi jeszcze profilu."
        : "Profil lokalu w katalogu Gościnnie.",
    ),
    alternates: { canonical: trasaFirmy(slug) },
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
    const [szczegoly, profil] = await Promise.all([
      pobierzSzczegolyFirmyPoSlugu(widz, wynik.firma.slug),
      pobierzProfilFirmy(widz, wynik.firma.slug),
    ]);

    const f = wynik.firma;
    const czyLokal = Boolean(pobierzRodzajLokalu(f.kategoria));
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": czyLokal ? "EventVenue" : "LocalBusiness",
      name: f.nazwa,
      description: f.opis,
      url: new URL(trasaFirmy(f.slug), adresAplikacji()).toString(),
      ...(f.glowneZdjecie ? { image: f.glowneZdjecie } : {}),
      address: {
        "@type": "PostalAddress",
        addressLocality: f.miejscowosc.nazwa,
        addressRegion: f.miejscowosc.wojewodztwo,
        addressCountry: "PL",
      },
      ...(f.cenaOd !== null
        ? {
            priceRange: `od ${Math.round(f.cenaOd / 100)} zł`,
          }
        : {}),
    };

    return (
      <>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <ProfilFirmyScreen
          firma={wynik.firma}
          szczegoly={szczegolyNaProfil(szczegoly)}
          wolneTerminy={profil?.wolneTerminy ?? []}
          wezwanieDoPrzejecia={profil?.widocznosc.wezwanieDoPrzejecia ?? false}
        />
      </>
    );
  }
  // Firma, która nie przejęła jeszcze wpisu, dostaje wersję "przejmij profil".
  if (wynik.lokal.status === "visitcard") return <WpisBezProfiluScreen lokal={wynik.lokal} />;
  return <ProfilScreen lokal={wynik.lokal} />;
}

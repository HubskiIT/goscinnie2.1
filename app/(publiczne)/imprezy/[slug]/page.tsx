import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ImprezaDoPokazania, LokalImprezy } from "@/components/screens/ImprezaScreen";
import { ImprezaScreen } from "@/components/screens/ImprezaScreen";
import { pobierzLokal, pobierzImpreze as pobierzPrzyklad } from "@/content/ogloszenia";
import { widzZZadania } from "@/lib/auth/widz";
import { pobierzImpreze } from "@/lib/db/queries/imprezy";
import { metadaneStrony } from "@/lib/metadane";
import { impreza as trasaImprezy } from "@/lib/trasy";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Najpierw impreza z bazy, potem przykład z content/.
 *
 * Ta sama kolejność co przy profilu firmy w /f/[slug] i z tego samego
 * powodu: przykłady nie leżą w bazie, więc prawdziwa impreza może dostać
 * ten sam slug co przykład. Wtedy wygrywa prawdziwa.
 */
async function znajdz(
  slug: string,
): Promise<{ impreza: ImprezaDoPokazania; lokal: LokalImprezy } | null> {
  const widz = await widzZZadania(await headers());

  const zBazy = await pobierzImpreze(widz, slug);
  if (zBazy) {
    return {
      impreza: {
        nazwa: zBazy.nazwa,
        okazja: zBazy.okazja,
        data: zBazy.data,
        godzinaOd: zBazy.godzinaOd,
        godzinaDo: zBazy.godzinaDo,
        cenaBiletuGrosze: zBazy.cenaBiletuGrosze,
        opis: zBazy.opis,
        dlaDoroslych: zBazy.dlaDoroslych,
        przykladowe: false,
      },
      lokal: {
        slug: zBazy.lokal.slug,
        nazwa: zBazy.lokal.nazwa,
        miejscowosc: zBazy.lokal.miejscowosc,
        /*
         * Powiat zamiast odległości od centrum. Odległość mają wpisaną
         * przykłady z content/, a dla firmy z bazy musielibyśmy ją liczyć
         * od czegoś, czego nikt nie wskazał: „centrum Wrocławia” jest
         * punktem odniesienia dla jednego miasta, a katalog obejmuje kraj.
         */
        dopisek: `powiat ${zBazy.lokal.powiat}`,
      },
    };
  }

  const przyklad = pobierzPrzyklad(slug);
  if (!przyklad) return null;

  const lokal = pobierzLokal(przyklad.lokalSlug);
  if (!lokal) return null;

  return {
    impreza: {
      nazwa: przyklad.nazwa,
      okazja: przyklad.okazja,
      data: przyklad.data,
      godzinaOd: przyklad.godzinaOd,
      godzinaDo: przyklad.godzinaDo,
      cenaBiletuGrosze: przyklad.cenaBiletuGrosze,
      opis: przyklad.opis,
      dlaDoroslych: przyklad.dlaDoroslych,
      przykladowe: przyklad.przykladowe,
    },
    lokal: {
      slug: lokal.slug,
      nazwa: lokal.nazwa,
      miejscowosc: lokal.miejscowosc.nazwa,
      dopisek: `${lokal.miejscowosc.odlegloscOdCentrumKm} km od centrum Wrocławia`,
    },
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const wynik = await znajdz(slug);
  if (!wynik) return { title: "Nie ma takiej strony" };
  return metadaneStrony({
    tytul: wynik.impreza.nazwa,
    opis: `${wynik.impreza.nazwa} w ${wynik.lokal.nazwa}, ${wynik.lokal.miejscowosc}.`,
    sciezka: trasaImprezy(slug),
  });
}

export default async function Strona({ params }: Props) {
  const { slug } = await params;
  const wynik = await znajdz(slug);
  if (!wynik) notFound();

  return <ImprezaScreen impreza={wynik.impreza} lokal={wynik.lokal} />;
}

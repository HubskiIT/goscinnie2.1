import type { Metadata } from "next";
import { headers } from "next/headers";
import { ImprezyScreen, type PozycjaZapowiedzi } from "@/components/screens/ImprezyScreen";
import { dzienTygodnia, zlote } from "@/content/format";
import { type Impreza, pobierzLokal } from "@/content/ogloszenia";
import { widzZZadania } from "@/lib/auth/widz";
import { type ImprezaPubliczna, pobierzImprezy } from "@/lib/db/queries/imprezy";
import { odczytajKryteriaImprez, wyszukajImprezy } from "@/lib/filtry";

export const metadata: Metadata = {
  title: "Imprezy",
  description: "Wydarzenia organizowane przez lokale w Twojej okolicy.",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const MIESIAC = new Intl.DateTimeFormat("pl-PL", { month: "short" });

/** Cena biletu na napis. Brak ceny i zero to jedno: wstęp wolny. */
function cena(grosze: number | null): string {
  return grosze === null || grosze === 0 ? "wstęp wolny" : zlote(grosze);
}

function godziny(od: string, doGodziny: string | null): string {
  return doGodziny === null ? `od ${od}` : `${od} do ${doGodziny}`;
}

function zBazy(impreza: ImprezaPubliczna): PozycjaZapowiedzi {
  const data = new Date(impreza.data);
  return {
    slug: impreza.slug,
    day: String(data.getDate()),
    month: MIESIAC.format(data),
    title: impreza.nazwa,
    place: `${impreza.lokal.nazwa}, ${impreza.lokal.miejscowosc}`,
    time: `${dzienTygodnia(impreza.data)}, ${godziny(impreza.godzinaOd, impreza.godzinaDo)}`,
    tags: impreza.dlaDoroslych ? ["dla dorosłych"] : [],
    price: cena(impreza.cenaBiletuGrosze),
    przykladowe: false,
  };
}

function zPrzykladow(impreza: Impreza): PozycjaZapowiedzi {
  const data = new Date(impreza.data);
  const lokal = pobierzLokal(impreza.lokalSlug);
  return {
    slug: impreza.slug,
    day: String(data.getDate()),
    month: MIESIAC.format(data),
    title: impreza.nazwa,
    place: lokal === undefined ? "" : `${lokal.nazwa}, ${lokal.miejscowosc.nazwa}`,
    time: `${dzienTygodnia(impreza.data)}, ${godziny(impreza.godzinaOd, impreza.godzinaDo)}`,
    tags: impreza.dlaDoroslych ? ["dla dorosłych"] : [],
    price: cena(impreza.cenaBiletuGrosze),
    przykladowe: true,
  };
}

/**
 * Zapowiedzi: najpierw prawdziwe imprezy z bazy, potem przykłady.
 *
 * Przykłady zostają, dopóki prawdziwych jest mało, i są oznaczone jako
 * przykłady. Pusta sekcja zapowiedzi wygląda jak awaria serwisu, a nie
 * jak „nikt jeszcze nic nie zapowiedział”, i odstrasza pierwszy lokal,
 * który miałby coś dodać.
 *
 * Prawdziwe idą pierwsze, bo to one są treścią, a przykład ma pokazywać,
 * jak wygląda wpis, a nie konkurować o uwagę.
 */
export default async function Strona({ searchParams }: Props) {
  const kryteria = odczytajKryteriaImprez(await searchParams);
  const widz = await widzZZadania(await headers());

  const zBazyDane = await pobierzImprezy(widz, kryteria);
  const przyklady = wyszukajImprezy(kryteria);

  const imprezy = [...zBazyDane.map(zBazy), ...przyklady.map(zPrzykladow)];

  return <ImprezyScreen imprezy={imprezy} kryteria={kryteria} />;
}

import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SzczegolyZleceniaScreen } from "@/components/screens/SzczegolyZleceniaScreen";
import { widzWKontekscieZlecenia, widzZZadania } from "@/lib/auth/widz";
import { pobierzOfertyZlecenia } from "@/lib/db/queries/bids";
import { pobierzZlecenieDlaWidza } from "@/lib/db/queries/requests";
import { metadaneBezIndeksu } from "@/lib/metadane";
import { identyfikatorZlecenia } from "@/lib/validators/zlecenia";

export const metadata: Metadata = metadaneBezIndeksu(
  "Szczegóły zlecenia",
  "Szczegóły zlecenia i porównanie ofert w serwisie Gościnnie.",
);

export default async function Strona({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const walidacja = identyfikatorZlecenia.safeParse(id);
  if (!walidacja.success) notFound();

  const widz = await widzZZadania(await headers());
  const wynik = await pobierzZlecenieDlaWidza(widz, walidacja.data, widzWKontekscieZlecenia);
  if (!wynik.zlecenie) notFound();

  const z = wynik.zlecenie;
  const jestAutorem = wynik.zakres === "autor";
  const widzOferty =
    jestAutorem && widz.rodzaj !== "anonim"
      ? ({ rodzaj: "autor", userId: widz.userId } as const)
      : widz;
  const ofertyWynik = jestAutorem ? await pobierzOfertyZlecenia(widzOferty, walidacja.data) : null;
  const oferty =
    ofertyWynik?.ok && ofertyWynik.dane.zakres === "wszystkie" ? ofertyWynik.dane.oferty : [];

  const opis = "opis" in z ? z.opis : null;
  const budzetMin = "budzetMin" in z ? z.budzetMin : null;
  const budzetMax = "budzetMax" in z ? z.budzetMax : null;

  return (
    <SzczegolyZleceniaScreen
      id={z.id}
      okazja={z.rodzajOkazji}
      data={z.dataWydarzenia}
      liczbaOsob={z.liczbaOsob}
      powiat={z.powiat}
      wojewodztwo={z.wojewodztwo}
      opis={opis}
      budzetMin={budzetMin}
      budzetMax={budzetMax}
      jestAutorem={jestAutorem}
      mozeZlozycOferte={widz.rodzaj === "firma" && widz.abonament}
      oferty={oferty}
    />
  );
}

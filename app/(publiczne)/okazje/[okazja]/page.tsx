import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pobierzKategorie } from "@/content/kategorie";
import { OKAZJE, pobierzOkazje_ } from "@/content/okazje";
import { pobierzRodzajLokalu } from "@/content/rodzaje-lokali";
import { PARAMETRY } from "@/lib/wyszukiwanie";

interface Props {
  params: Promise<{ okazja: string }>;
}

export function generateStaticParams() {
  return OKAZJE.map((okazja) => ({ okazja: okazja.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { okazja: slug } = await params;
  const okazja = pobierzOkazje_(slug);
  if (!okazja) return { title: "Nie ma takiej strony" };
  return {
    title: `Lokal na ${okazja.naCo}`,
    description: `Jakie lokale i jacy usługodawcy pasują na ${okazja.naCo}.`,
  };
}

export default async function Strona({ params }: Props) {
  const { okazja: slug } = await params;
  const okazja = pobierzOkazje_(slug);
  if (!okazja) notFound();

  const rodzaje = okazja.rodzajeLokali
    .map((r) => pobierzRodzajLokalu(r))
    .filter((r) => r !== undefined);
  const kategorie = pobierzKategorie().filter((k) => okazja.kategorieUslugodawcow.includes(k.slug));

  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 sm:px-12 md:px-[130px] py-14">
      <p className="m-0 mb-4 text-[14px] text-[#6A5C70]">
        <Link href="/" className="text-[#6A5C70] hover:text-[#241C2B]">
          Gościnnie
        </Link>{" "}
        &nbsp;›&nbsp; Okazje &nbsp;›&nbsp; {okazja.nazwa}
      </p>

      <h1 className="m-0 mb-4 font-fraunces font-normal text-[36px] sm:text-[48px] tracking-tight">
        Lokal na {okazja.naCo}
      </h1>

      {/* Opis pisze właściciel (punkt 10.2 planu). Dopóki go nie ma,
          nie udajemy poradnika i nie podajemy żadnych liczb. */}
      {okazja.opis === "" ? null : (
        <p className="m-0 mb-8 text-[17px] leading-[1.7] text-[#3E3344] max-w-[70ch]">
          {okazja.opis}
        </p>
      )}

      <div className="flex flex-wrap gap-3.5 mb-12">
        <Link
          href={`/lokale?${PARAMETRY.rodzaj}=${rodzaje[0]?.slug ?? ""}`}
          className="text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors rounded-[12px] px-6 py-3.5"
        >
          Szukaj lokalu
        </Link>
        <Link
          href="/dodaj-zlecenie"
          className="text-[16px] font-semibold text-[#241C2B] border-[1.5px] border-[#241C2B] rounded-[12px] px-6 py-3.5 hover:bg-[#241C2B] hover:text-white transition-colors"
        >
          Dodaj zlecenie
        </Link>
      </div>

      <section className="mb-12">
        <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">Jakie lokale tu pasują</h2>
        <div className="flex flex-wrap gap-2.5">
          {rodzaje.map((rodzaj) => (
            <Link
              key={rodzaj.slug}
              href={`/lokale?${PARAMETRY.rodzaj}=${rodzaj.slug}`}
              className="text-[15px] text-[#3F5142] bg-[#E7EDE7] hover:bg-[#dbe5db] transition-colors rounded-[10px] px-4 py-2.5"
            >
              {rodzaj.nazwaMnoga}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">
          Kogo zwykle się do tego dobiera
        </h2>
        <div className="flex flex-wrap gap-2.5">
          {kategorie.map((kategoria) => (
            <Link
              key={kategoria.slug}
              href={`/uslugodawcy/${kategoria.slug}/wroclaw`}
              className="text-[15px] text-[#3E3344] bg-white border border-[#E2D5CA] hover:border-[#241C2B] transition-colors rounded-[10px] px-4 py-2.5"
            >
              {kategoria.nazwa}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

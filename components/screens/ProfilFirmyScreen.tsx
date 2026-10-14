import Link from "next/link";
import { ZdjecieFirmy } from "@/components/ZdjecieFirmy";
import { zlote } from "@/content/format";
import { pobierzKategorie_ } from "@/content/kategorie";
import { pobierzRodzajLokalu } from "@/content/rodzaje-lokali";
import type { FirmaWKatalogu } from "@/lib/db/queries/katalog";

interface ProfilFirmyScreenProps {
  firma: FirmaWKatalogu;
}

/**
 * Profil firmy, która dodała się przez kreator.
 *
 * Pokazuje wyłącznie to, co firma wpisała. Nie ma tu kalendarza, cennika
 * pozycji, opinii ani udogodnień, bo kreator o nie jeszcze nie pyta. Ekran
 * przykładowego lokalu (ProfilScreen) ma te sekcje wypełnione treścią
 * prototypu i dla prawdziwej firmy pokazywałby cudze liczby.
 *
 * Zdjęcia są, odkąd kreator o nie pyta. Firma bez zdjęć nie dostaje w ich
 * miejsce żadnego komunikatu: profil ma wtedy po prostu mniej sekcji, a nie
 * dziurę z napisem o tym, czego właściciel nie zrobił.
 */
export function ProfilFirmyScreen({ firma }: ProfilFirmyScreenProps) {
  const rodzajLokalu = pobierzRodzajLokalu(firma.kategoria);
  const kategoria = rodzajLokalu ?? pobierzKategorie_(firma.kategoria);
  const powrot = rodzajLokalu
    ? { adres: "/lokale", etykieta: "Lokale i sale" }
    : { adres: "/uslugodawcy", etykieta: "Usługodawcy" };

  const pojemnosc =
    firma.pojemnoscMin !== null && firma.pojemnoscMax !== null
      ? `od ${firma.pojemnoscMin} do ${firma.pojemnoscMax} osób`
      : firma.pojemnoscMax !== null
        ? `do ${firma.pojemnoscMax} osób`
        : null;

  const polozenie = [
    firma.miejscowosc.nazwa,
    firma.miejscowosc.gmina && firma.miejscowosc.gmina !== firma.miejscowosc.nazwa
      ? `gmina ${firma.miejscowosc.gmina}`
      : null,
    `powiat ${firma.miejscowosc.powiat}`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <nav aria-label="Okruszki" className="px-6 md:px-[110px] pt-6 text-[14px] text-[#6A5C70]">
        <Link href={powrot.adres} className="text-[#6A5C70] hover:text-[#241C2B]">
          {powrot.etykieta}
        </Link>
        &nbsp;›&nbsp; {firma.nazwa}
      </nav>

      <div className="grow px-6 md:px-[110px] pt-8 pb-20 flex flex-col lg:flex-row gap-10 md:gap-14">
        <main className="grow w-full max-w-[760px]">
          {kategoria ? (
            <p className="m-0 mb-3 text-[13px] font-bold tracking-wider uppercase text-[#5E7360]">
              {kategoria.nazwa}
            </p>
          ) : null}

          <h1 className="m-0 mb-3 font-fraunces font-normal text-[36px] sm:text-[46px] tracking-tight">
            {firma.nazwa}
          </h1>
          <p className="m-0 mb-6 text-[16px] text-[#6A5C70]">{polozenie}</p>

          {firma.cenaOd !== null || pojemnosc ? (
            <div className="flex gap-2 flex-wrap mb-8">
              {firma.cenaOd !== null ? (
                <span className="text-[14px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3 py-1.5">
                  cena od {zlote(firma.cenaOd)}
                </span>
              ) : null}
              {pojemnosc ? (
                <span className="text-[14px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3 py-1.5">
                  {pojemnosc}
                </span>
              ) : null}
            </div>
          ) : null}

          {firma.glowneZdjecie ? (
            <ZdjecieFirmy
              adres={firma.glowneZdjecie}
              nazwaFirmy={firma.nazwa}
              className="w-full h-[280px] sm:h-[380px] rounded-[16px] mb-8"
            />
          ) : null}

          <h2 className="m-0 mb-3 font-fraunces font-medium text-[24px]">O firmie</h2>
          <p className="m-0 text-[16px] leading-[1.75] text-[#3E3344] whitespace-pre-line">
            {firma.opis}
          </p>

          {firma.galeria.length > 0 ? (
            <>
              <h2 className="m-0 mt-10 mb-3 font-fraunces font-medium text-[24px]">Zdjęcia</h2>
              <ul className="m-0 list-none grid grid-cols-2 sm:grid-cols-3 gap-3 p-0">
                {firma.galeria.map((adres) => (
                  <li key={adres}>
                    <ZdjecieFirmy
                      adres={adres}
                      nazwaFirmy={firma.nazwa}
                      className="w-full h-[140px] rounded-[12px]"
                    />
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </main>

        <aside className="w-full lg:w-[360px] shrink-0">
          <div className="border border-[#E2D5CA] rounded-[20px] bg-white p-6">
            <h2 className="m-0 mb-2 font-fraunces font-medium text-[22px]">Zapytaj o termin</h2>
            <p className="m-0 text-[15px] leading-[1.6] text-[#6A5C70]">
              Wysyłanie zapytań do firm przez Gościnnie uruchamiamy w najbliższym czasie.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

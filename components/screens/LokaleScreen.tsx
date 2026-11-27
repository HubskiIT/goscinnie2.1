"use client";

import Link from "next/link";
import { EtykietaPrzykladu } from "@/components/EtykietaPrzykladu";
import { WyszukiwarkaLokali } from "@/components/WyszukiwarkaLokali";
import { ZdjecieFirmy } from "@/components/ZdjecieFirmy";
import { odmiana, zlote } from "@/content/format";
import type { Lokal } from "@/content/ogloszenia";
import { useKrotkaLista } from "@/hooks/use-krotka-lista";
import { adresZPrzelaczonym, czySaFiltry, type KryteriaLokali } from "@/lib/wyszukiwanie";

/** Filtry dodatkowe. Okazja dołącza tu po zmianie kierunku z punktu 3 planu. */
const UDOGODNIENIA = ["ogród", "nocleg dla 40 osób", "sala na wyłączność", "parking"] as const;

interface LokaleScreenProps {
  lokale: readonly Lokal[];
  kryteria: KryteriaLokali;
  /**
   * Nazwa wyszukiwanej miejscowości albo `null`, gdy nikt jej nie podał.
   *
   * Przychodzi gotowa z serwera, bo rejestr TERYT siedzi w spakowanym pliku,
   * którego nie wysyłamy do przeglądarki, a ten ekran jest kliencki.
   */
  okolica: string | null;
}

export function LokaleScreen({ lokale, kryteria, okolica }: LokaleScreenProps) {
  const { lista: shortlist, przelacz: toggleShortlist } = useKrotkaLista();

  const venues = lokale.map((lokal) => ({
    slug: lokal.slug,
    name: lokal.nazwa,
    location:
      lokal.miejscowosc.odlegloscOdCentrumKm === null
        ? `${lokal.miejscowosc.nazwa} · powiat ${lokal.miejscowosc.powiat}`
        : `${lokal.miejscowosc.nazwa} · ${lokal.miejscowosc.odlegloscOdCentrumKm} km od centrum`,
    price: lokal.cenaOdGrosze === null ? "Cena niepodana" : `od ${zlote(lokal.cenaOdGrosze)}`,
    priceDesc: lokal.cenaOdGrosze === null ? "wpis nieprzejęty" : lokal.jednostkaCeny,
    tags: lokal.udogodnienia,
    details: lokal.pojemnoscMax === null ? "" : `do ${lokal.pojemnoscMax} osób`,
    isImported: lokal.status === "visitcard",
    przykladowe: lokal.przykladowe,
    zdjecie: lokal.zdjecie ?? null,
  }));

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      {/* Breadcrumbs & Title */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-10">
        <p className="m-0 mb-4 text-[14px] text-[#6A5C70]">
          <Link
            href="/"
            className="text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
          >
            Gościnnie
          </Link>{" "}
          &nbsp;›&nbsp; Sale i lokale
          {okolica === null ? null : <>&nbsp;›&nbsp; {okolica} i okolice</>}
        </p>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10">
          <div>
            <h1 className="m-0 mb-3 font-fraunces font-normal text-[36px] sm:text-[44px] md:text-[48px] tracking-tight">
              {okolica === null ? "Sale i lokale" : `Sale i lokale: ${okolica}`}
            </h1>
            <p className="m-0 text-[17px] leading-[1.6] text-[#3E3344] max-w-[62ch]">
              Obiekty, które przyjmują wesela, komunie, chrzciny, osiemnastki, przyjęcia firmowe i
              stypy. Każdy wpis prowadzi właściciel, ceny są podane od, bez prowizji dla serwisu.
            </p>
          </div>
          <div className="shrink-0 text-left md:text-right">
            <div className="font-fraunces text-[34px] font-medium">
              {venues.length} {odmiana(venues.length, "obiekt", "obiekty", "obiektów")}
            </div>
            {/*
             * Promień pokazujemy tylko wtedy, gdy jest od czego go liczyć.
             * Wcześniej stało tu „w promieniu 30 km” niezależnie od wszystkiego,
             * także przy pustym polu miejscowości i przy ustawionym suwaku 10 km.
             */}
            {okolica === null ? null : (
              <div className="text-[14px] text-[#6A5C70]">
                {kryteria.promienKm === 0
                  ? "tylko ta miejscowość"
                  : `w promieniu ${kryteria.promienKm} km`}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-[30px]">
        <WyszukiwarkaLokali kryteria={kryteria} />

        {/* Filters pills */}
        <div className="mt-[18px] flex items-center gap-2.5 flex-wrap">
          {UDOGODNIENIA.map((f) => {
            const isSelected = kryteria.udogodnienia.includes(f);
            return (
              <Link
                key={f}
                href={adresZPrzelaczonym(kryteria, f)}
                className={`text-[14px] rounded-full px-4 py-2 cursor-pointer transition-all ${
                  isSelected
                    ? "font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] shadow-sm"
                    : "text-[#3E3344] bg-white border border-[#D9CCC2] hover:border-[#241C2B]"
                }`}
              >
                {f}
              </Link>
            );
          })}
          <span className="ml-auto text-[14px] text-[#6A5C70]">
            Sortuj: <strong className="font-semibold text-[#241C2B]">najbliżej centrum</strong>
          </span>
        </div>
      </section>

      {/* Main Listing + Aside */}
      <section className="grow px-6 sm:px-12 md:px-[130px] pt-[34px] pb-16 flex flex-col lg:flex-row gap-[34px] items-start">
        <div className="grow w-full flex flex-col gap-[18px]">
          {venues.length === 0 ? (
            <div className="m-0 rounded-[18px] border border-dashed border-[#D9CCC2] bg-white p-8 text-center text-[15px] leading-[1.7] text-[#6A5C70]">
              <p className="m-0 mb-4">
                {czySaFiltry(kryteria)
                  ? "Żaden obiekt nie pasuje do tych filtrów."
                  : "Nie ma jeszcze ani jednego obiektu w katalogu."}{" "}
                <Link href="/lokale" className="font-semibold text-[#8A5405] underline">
                  {czySaFiltry(kryteria) ? "Wyczyść filtry" : "Odśwież listę"}
                </Link>
              </p>
              <Link
                href="/rejestracja-firmy"
                className="inline-block text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors rounded-[12px] px-6 py-3"
              >
                Dodaj swój lokal bezpłatnie
              </Link>
            </div>
          ) : null}

          {venues.map((venue) => {
            const isShortlisted = shortlist.includes(venue.name);
            return (
              <article
                key={venue.slug}
                className="border border-[#E2D5CA] rounded-[18px] bg-white flex flex-col sm:flex-row overflow-hidden shadow-2xs hover:shadow-sm transition-shadow"
              >
                <ZdjecieFirmy
                  adres={venue.zdjecie}
                  nazwaFirmy={venue.name}
                  className="w-full sm:w-[272px] h-[190px] sm:h-auto sm:min-h-[220px] shrink-0"
                />

                <div className="grow p-6 flex flex-col">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <h3 className="m-0 mb-1.5 font-fraunces font-medium text-[23px]">
                        <Link
                          href={`/f/${venue.slug}`}
                          className="text-[#241C2B] hover:text-[#8A5405] text-left bg-transparent border-0 cursor-pointer p-0 font-inherit"
                        >
                          {venue.name}
                        </Link>
                      </h3>
                      <p className="m-0 mb-2 text-[14px] text-[#6A5C70]">{venue.location}</p>
                      {venue.przykladowe ? <EtykietaPrzykladu /> : null}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-fraunces text-[24px] font-medium">{venue.price}</div>
                      <div className="text-[13px] text-[#6A5C70]">{venue.priceDesc}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap my-3.5">
                    {venue.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3 py-1.5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-3 flex flex-wrap items-center gap-3.5 border-t border-[#EFE5DD]">
                    {venue.isImported ? (
                      <Link
                        href={`/f/${venue.slug}`}
                        className="text-[15px] font-semibold text-[#241C2B] border-[1.5px] border-[#241C2B] rounded-[10px] px-5 py-2.5 hover:bg-[#241C2B] hover:text-white transition-colors cursor-pointer bg-transparent"
                      >
                        Zobacz wpis / Przejmij profil
                      </Link>
                    ) : (
                      <Link
                        href={`/f/${venue.slug}`}
                        className="text-[15px] font-semibold text-[#241C2B] border-[1.5px] border-[#241C2B] rounded-[10px] px-5 py-2.5 hover:bg-[#241C2B] hover:text-white transition-colors cursor-pointer bg-transparent"
                      >
                        Zapytaj o ofertę
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleShortlist(venue.name)}
                      className={`text-[15px] bg-transparent border-0 border-b pb-0.5 cursor-pointer transition-colors ${
                        isShortlisted
                          ? "text-[#3F5142] font-semibold border-[#3F5142]"
                          : "text-[#3E3344] border-[#D9CCC2] hover:text-[#241C2B]"
                      }`}
                    >
                      {isShortlisted ? "✓ Na krótkiej liście" : "Dodaj do krótkiej listy"}
                    </button>
                    <span className="ml-auto text-[13px] text-[#6A5C70]">{venue.details}</span>
                  </div>
                </div>
              </article>
            );
          })}

          <div className="border border-dashed border-[#D9CCC2] rounded-[16px] p-[26px] text-center bg-[#FBF7F4]">
            <p className="m-0 mb-3.5 text-[15px] text-[#3E3344]">
              Nie widzisz tego, czego szukasz? Opisz swoją uroczystość, a firmy zgłoszą się same.
            </p>
            <Link
              href="/dodaj-zlecenie"
              className="inline-block text-[15px] font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] rounded-[10px] px-6 py-3"
            >
              Dodaj zlecenie
            </Link>
          </div>
        </div>

        {/* Aside: krótka lista */}
        <aside className="w-full lg:w-[422px] shrink-0 lg:sticky lg:top-6">
          {/* Shortlist widget */}
          <div className="mt-[18px] border border-[#E2D5CA] rounded-[18px] bg-[#F2E9E2] p-[22px]">
            <div className="text-[16px] font-bold mb-2">Krótka lista ({shortlist.length})</div>
            <p className="m-0 mb-3.5 text-[14px] leading-[1.65] text-[#55485A]">
              Odkładaj obiekty na boku i wyślij jedno zapytanie do wszystkich naraz. Dopiero wtedy
              firma widzi Twoje dane kontaktowe.
            </p>
            <div className="flex gap-2 flex-wrap">
              {shortlist.map((name) => (
                <span
                  key={name}
                  title={name}
                  className="w-11 h-11 rounded-[10px] bg-[#E4D9CF] border border-[#241C2B]/20 flex items-center justify-center font-bold text-[12px] text-[#241C2B]"
                >
                  {name.charAt(0)}
                </span>
              ))}
              {Array.from(
                { length: Math.max(0, 4 - shortlist.length) },
                (_, i) => `miejsce-${i}`,
              ).map((klucz) => (
                <span
                  key={klucz}
                  className="w-11 h-11 rounded-[10px] border border-dashed border-[#D9CCC2]"
                />
              ))}
            </div>
            {shortlist.length > 0 && (
              /*
               * Prowadzi do zlecenia, nie do formularza jednego lokalu.
               *
               * Stał tu adres `/f/dwor-pod-lipami/zapytanie`, czyli zapytanie
               * do wpisu przykładowego, wpisany na sztywno jeszcze w prototypie.
               * Po usunięciu atrap ten adres oddaje 404, a przycisk pokazuje
               * się dopiero wtedy, gdy ktoś odłożył lokal na bok, więc trafiłby
               * w niego pierwszy prawdziwy zainteresowany klient.
               *
               * Zlecenie jest poprawnym celem także merytorycznie: krótka lista
               * ma kilka obiektów, a zapytanie do jednego z nich nie jest
               * zapytaniem do listy.
               */
              <Link
                href="/dodaj-zlecenie"
                className="mt-3.5 w-full text-[14px] font-semibold text-[#241C2B] bg-white border border-[#241C2B] rounded-[8px] py-2 cursor-pointer hover:bg-[#241C2B] hover:text-white transition-colors"
              >
                Wyślij zapytanie do listy ({shortlist.length})
              </Link>
            )}
          </div>
        </aside>
      </section>

      {/* Direct Order CTA */}
      <section className="shrink-0 mx-6 sm:mx-12 md:mx-[130px] mt-11 border border-[#E2D5CA] rounded-[20px] bg-white p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-sm">
        <div className="grow">
          <h2 className="m-0 mb-2.5 font-fraunces font-medium text-[27px]">
            Nie chcesz przeglądać osiemnastu profili?
          </h2>
          <p className="m-0 text-[16px] leading-[1.65] text-[#3E3344] max-w-[70ch]">
            Opisz raz, czego szukasz. Zlecenie trafia do sal, które mają wolny termin i mieszczą
            Twoją liczbę gości. Odpowiedzi dostajesz na skrzynkę, bez podawania numeru telefonu.
          </p>
        </div>
        <Link
          href="/dodaj-zlecenie"
          className="shrink-0 text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-8 py-4 cursor-pointer"
        >
          Wystaw zlecenie
        </Link>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { EtykietaPrzykladu } from "@/components/EtykietaPrzykladu";
import { zlote } from "@/content/format";
import { pobierzLokale } from "@/content/ogloszenia";
import { useKrotkaLista } from "@/hooks/use-krotka-lista";

export function LokaleScreen() {
  const { lista: shortlist, przelacz: toggleShortlist } = useKrotkaLista();
  const [activeFilters, setActiveFilters] = useState<string[]>(["Ogród"]);

  const filters = [
    "Ogród",
    "Nocleg",
    "Sala na wyłączność",
    "Parking",
    "Własny alkohol",
    "Bez korkowego",
    "Dostęp dla wózka",
  ];

  const toggleFilter = (f: string) => {
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((item) => item !== f) : [...prev, f],
    );
  };

  const venues = pobierzLokale().map((lokal) => ({
    slug: lokal.slug,
    name: lokal.nazwa,
    location: `${lokal.miejscowosc.nazwa} · ${lokal.miejscowosc.odlegloscOdCentrumKm} km od centrum`,
    price: lokal.cenaOdGrosze === null ? "Cena niepodana" : `od ${zlote(lokal.cenaOdGrosze)}`,
    priceDesc: lokal.cenaOdGrosze === null ? "wpis nieprzejęty" : lokal.jednostkaCeny,
    tags: lokal.udogodnienia,
    details: lokal.pojemnoscMax === null ? "" : `do ${lokal.pojemnoscMax} osób`,
    isImported: lokal.status === "visitcard",
    przykladowe: lokal.przykladowe,
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
          &nbsp;›&nbsp; Sale i lokale &nbsp;›&nbsp; Wrocław i okolice
        </p>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10">
          <div>
            <h1 className="m-0 mb-3 font-fraunces font-normal text-[36px] sm:text-[44px] md:text-[48px] tracking-tight">
              Sale i lokale we Wrocławiu
            </h1>
            <p className="m-0 text-[17px] leading-[1.6] text-[#3E3344] max-w-[62ch]">
              Obiekty, które przyjmują wesela, komunie, chrzciny, osiemnastki, przyjęcia firmowe i
              stypy. Każdy wpis prowadzi właściciel, ceny są podane od, bez prowizji dla serwisu.
            </p>
          </div>
          <div className="shrink-0 text-left md:text-right">
            <div className="font-fraunces text-[34px] font-medium">
              {venues.length} {venues.length === 1 ? "obiekt" : "obiekty"}
            </div>
            <div className="text-[14px] text-[#6A5C70]">w promieniu 30 km</div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-[30px]">
        <div className="border-[1.5px] border-[#D9CCC2] rounded-[16px] bg-white flex flex-col lg:flex-row items-stretch overflow-hidden shadow-sm">
          <div className="grow flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Okazja</span>
            <span className="flex items-center justify-between text-[15px] font-semibold text-[#241C2B]">
              Komunia
              <svg
                aria-hidden="true"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6A5C70"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <polyline points="5 9 12 16 19 9" />
              </svg>
            </span>
          </div>

          <div className="grow flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Miejscowość</span>
            <span className="flex items-center justify-between text-[15px] font-semibold text-[#241C2B]">
              Wrocław
              <svg
                aria-hidden="true"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6A5C70"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <polyline points="5 9 12 16 19 9" />
              </svg>
            </span>
          </div>

          <div className="grow flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Termin</span>
            <span className="flex items-center justify-between text-[15px] font-semibold text-[#241C2B]">
              czerwiec 2027
              <svg
                aria-hidden="true"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6A5C70"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <polyline points="5 9 12 16 19 9" />
              </svg>
            </span>
          </div>

          <div className="w-full lg:w-[150px] flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Liczba osób</span>
            <span className="flex items-center justify-between text-[15px] font-semibold text-[#241C2B]">
              80
              <svg
                aria-hidden="true"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6A5C70"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <polyline points="5 9 12 16 19 9" />
              </svg>
            </span>
          </div>

          <div className="w-full lg:w-[170px] flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Cena do</span>
            <span className="flex items-center justify-between text-[15px] font-semibold text-[#241C2B]">
              250 zł / os.
              <svg
                aria-hidden="true"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6A5C70"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <polyline points="5 9 12 16 19 9" />
              </svg>
            </span>
          </div>

          <button
            type="button"
            className="m-2 rounded-[10px] px-8 py-3.5 bg-[#F0A62E] hover:bg-[#e29922] transition-colors text-[16px] font-bold text-[#241C2B] border-0 cursor-pointer shrink-0"
          >
            Szukaj
          </button>
        </div>

        {/* Filters pills */}
        <div className="mt-[18px] flex items-center gap-2.5 flex-wrap">
          {filters.map((f) => {
            const isSelected = activeFilters.includes(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => toggleFilter(f)}
                className={`text-[14px] rounded-full px-4 py-2 cursor-pointer transition-all ${
                  isSelected
                    ? "font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] shadow-sm"
                    : "text-[#3E3344] bg-white border border-[#D9CCC2] hover:border-[#241C2B]"
                }`}
              >
                {f}
              </button>
            );
          })}
          <span className="ml-auto text-[14px] text-[#6A5C70]">
            Sortuj: <strong className="font-semibold text-[#241C2B]">najbliżej centrum</strong>
          </span>
        </div>
      </section>

      {/* Main Listing + Aside */}
      <section className="grow px-6 sm:px-12 md:px-[130px] pt-[34px] flex flex-col lg:flex-row gap-[34px] items-start">
        <div className="grow w-full flex flex-col gap-[18px]">
          {venues.map((venue) => {
            const isShortlisted = shortlist.includes(venue.name);
            return (
              <article
                key={venue.slug}
                className="border border-[#E2D5CA] rounded-[18px] bg-white flex flex-col sm:flex-row overflow-hidden"
              >
                <div
                  className={`w-full sm:w-[272px] h-[180px] sm:h-auto shrink-0 bg-[#E4D9CF]`}
                ></div>

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
        <aside className="w-full lg:w-[422px] shrink-0">
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
              <Link
                href="/f/dwor-pod-lipami/zapytanie"
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

      {/* Przeglądaj dalej */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] py-12">
        <h2 className="m-0 mb-5 text-[14px] font-bold tracking-wider uppercase text-[#55485A]">
          Przeglądaj dalej
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-9 gap-y-3">
          {[
            "Sale weselne Wrocław",
            "Sale na komunię Wrocław",
            "Sale na chrzciny Wrocław",
            "Sale na osiemnastkę Wrocław",
            "Sale na stypy Wrocław",
            "Sale firmowe Wrocław",
            "Sale z ogrodem Wrocław",
            "Sale z noclegiem Wrocław",
            "Sale weselne Kraków",
            "Sale weselne Poznań",
            "Sale weselne Warszawa",
            "Sale weselne Gdańsk",
          ].map((tag) => (
            <Link
              href="/lokale"
              key={tag}
              className="text-left text-[15px] text-[#3E3344] hover:text-[#8A5405] py-2 border-b border-[#EFE5DD] bg-transparent border-t-0 border-x-0 cursor-pointer"
            >
              {tag}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

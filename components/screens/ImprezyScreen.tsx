"use client";

import Link from "next/link";
import { EtykietaPrzykladu } from "@/components/EtykietaPrzykladu";
import { dzienTygodnia, zlote } from "@/content/format";
import { pobierzImprezy, pobierzLokal } from "@/content/ogloszenia";

const MIESIAC = new Intl.DateTimeFormat("pl-PL", { month: "short" });

import { useState } from "react";

export function ImprezyScreen() {
  const [selectedTag] = useState("Andrzejki");

  const events = pobierzImprezy().map((impreza) => {
    const data = new Date(impreza.data);
    const lokal = pobierzLokal(impreza.lokalSlug);
    return {
      slug: impreza.slug,
      day: String(data.getDate()),
      month: MIESIAC.format(data),
      title: impreza.nazwa,
      place: lokal === undefined ? "" : `${lokal.nazwa}, ${lokal.miejscowosc.nazwa}`,
      time: `${dzienTygodnia(impreza.data)}, ${impreza.godzinaOd} do ${impreza.godzinaDo}`,
      tags: impreza.dlaDoroslych ? ["dla dorosłych"] : [],
      price: zlote(impreza.cenaBiletuGrosze),
      przykladowe: impreza.przykladowe,
    };
  });

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      {/* Hero / Header */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-11">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10 mb-8">
          <div>
            <div className="text-[13px] font-bold tracking-wider uppercase text-[#3F5142] mb-3">
              Nowa sekcja
            </div>
            <h1 className="m-0 mb-3 font-fraunces font-normal text-[36px] sm:text-[44px] md:text-[48px] tracking-tight">
              Imprezy, na które można po prostu przyjść
            </h1>
            <p className="m-0 text-[17px] leading-[1.6] text-[#3E3344] max-w-[72ch]">
              Andrzejki, mikołajki, sylwester, karnawał, walentynki. Tu nie szukasz sali dla siebie,
              tylko kupujesz miejsce na imprezie, którą organizuje ktoś inny. Lokal wystawia termin,
              cenę i liczbę miejsc, serwis nie bierze prowizji od wejściówki.
            </p>
          </div>
          <div className="shrink-0 text-left md:text-right">
            <div className="font-fraunces text-[34px] font-medium">
              {events.length} {events.length === 1 ? "impreza" : "imprezy"}
            </div>
            <div className="text-[14px] text-[#6A5C70]">w najbliższych trzech miesiącach</div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-[30px]">
        <div className="border-[1.5px] border-[#D9CCC2] rounded-[16px] bg-white flex flex-col lg:flex-row items-stretch overflow-hidden shadow-sm">
          <div className="grow flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Okazja</span>
            <span className="text-[15px] font-semibold text-[#241C2B]">{selectedTag}</span>
          </div>
          <div className="grow flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Miasto</span>
            <span className="text-[15px] font-semibold text-[#241C2B]">Wrocław</span>
          </div>
          <div className="grow flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Data</span>
            <span className="text-[15px] font-semibold text-[#241C2B]">28 lub 29 listopada</span>
          </div>
          <div className="w-full lg:w-[190px] flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Cena do</span>
            <span className="text-[15px] font-semibold text-[#241C2B]">200 zł / os.</span>
          </div>
          <div className="w-full lg:w-[210px] flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Rodzaj wejścia</span>
            <span className="text-[15px] font-semibold text-[#241C2B]">stolik dla dwóch</span>
          </div>
          <button
            type="button"
            className="m-2 rounded-[10px] px-8 py-3.5 bg-white border-[1.5px] border-[#241C2B] hover:bg-[#241C2B] hover:text-white transition-colors text-[16px] font-semibold text-[#241C2B] cursor-pointer shrink-0"
          >
            Szukaj
          </button>
        </div>
      </section>

      {/* Events Grid */}
      <section className="grow px-6 sm:px-12 md:px-[130px] pt-7">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((e) => (
            <article
              key={e.slug}
              className="border border-[#E2D5CA] rounded-[18px] bg-white overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-[152px] bg-[#E4D9CF] relative">
                <div className="absolute top-3.5 left-3.5 bg-[#FBF7F4] rounded-[12px] px-3 py-2 text-center shadow-sm">
                  <div className="font-fraunces text-[22px] font-medium leading-none">{e.day}</div>
                  <div className="text-[11px] font-bold tracking-wider uppercase text-[#6A5C70] mt-0.5">
                    {e.month}
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-[22px] flex flex-col grow">
                <h3 className="m-0 mb-1.5 font-fraunces font-medium text-[21px]">
                  <Link
                    href={`/imprezy/${e.slug}`}
                    className="text-[#241C2B] hover:text-[#8A5405] text-left bg-transparent border-0 cursor-pointer p-0 font-inherit"
                  >
                    {e.title}
                  </Link>
                </h3>
                <p className="m-0 mb-3.5 text-[14px] leading-[1.6] text-[#6A5C70]">
                  {e.place}
                  <br />
                  {e.time}
                </p>

                <div className="flex gap-2 flex-wrap mb-3.5">
                  {e.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-2.5 py-1.5"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {e.przykladowe ? (
                  <div className="mb-4">
                    <EtykietaPrzykladu />
                  </div>
                ) : null}

                <div className="mt-auto pt-3 flex items-end justify-between gap-3 border-t border-[#EFE5DD]">
                  <div>
                    <div className="font-fraunces text-[22px] font-medium">{e.price}</div>
                    <div className="text-[13px] text-[#6A5C70]">od osoby</div>
                  </div>

                  <Link
                    href={`/imprezy/${e.slug}`}
                    className="text-[15px] font-semibold text-[#241C2B] border-[1.5px] border-[#241C2B] rounded-[10px] px-4 py-2 hover:bg-[#241C2B] hover:text-white transition-colors cursor-pointer bg-transparent"
                  >
                    Zobacz szczegóły
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 border border-dashed border-[#D9CCC2] rounded-[16px] p-6 text-center bg-[#FBF7F4]">
          <p className="m-0 mb-3.5 text-[15px] text-[#3E3344] max-w-2xl mx-auto">
            Każda impreza ma własny adres, więc hasło w stylu andrzejki Wrocław 2026 może prowadzić
            prosto tutaj. Terminy po dacie znikają z listy, ale strony zostają i przekierowują do
            kolejnej edycji.
          </p>
          <button
            type="button"
            disabled
            className="text-[15px] font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] rounded-[10px] px-6 py-3 cursor-pointer"
          >
            Pokaż następne 18
          </button>
        </div>
      </section>

      {/* Rozkład roku & Jak lokal dodaje imprezę */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-10 flex flex-col lg:flex-row gap-5 items-stretch">
        <div className="grow border border-[#E2D5CA] rounded-[20px] bg-white p-7 sm:p-8 shadow-sm">
          <h2 className="m-0 mb-2 font-fraunces font-medium text-[26px]">Rozkład roku</h2>
          <p className="m-0 text-[15px] leading-[1.6] text-[#6A5C70]">
            Sezon imprez otwartych nie pokrywa się z weselnym. To są dwa różne szczyty i dwa różne
            powody, żeby lokal opłacał abonament cały rok.
          </p>
        </div>

        <div className="w-full lg:w-[400px] shrink-0 border border-[#E2D5CA] rounded-[20px] bg-[#F2E9E2] p-7 sm:p-8">
          <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">
            Jak lokal dodaje imprezę
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex gap-3.5">
              <span className="shrink-0 w-[26px] h-[26px] rounded-full bg-[#241C2B] text-[#FBF7F4] text-[13px] font-bold flex items-center justify-center">
                1
              </span>
              <div className="text-[14px] leading-[1.6] text-[#3E3344]">
                Wybiera okazję ze słownika i datę z własnego kalendarza. Zajęty termin nie da się
                wystawić dwa razy.
              </div>
            </div>
            <div className="flex gap-3.5">
              <span className="shrink-0 w-[26px] h-[26px] rounded-full bg-[#241C2B] text-[#FBF7F4] text-[13px] font-bold flex items-center justify-center">
                2
              </span>
              <div className="text-[14px] leading-[1.6] text-[#3E3344]">
                Podaje cenę od osoby, liczbę miejsc i co jest w cenie. Bez ceny wpis się nie
                zapisuje.
              </div>
            </div>
            <div className="flex gap-3.5">
              <span className="shrink-0 w-[26px] h-[26px] rounded-full bg-[#241C2B] text-[#FBF7F4] text-[13px] font-bold flex items-center justify-center">
                3
              </span>
              <div className="text-[14px] leading-[1.6] text-[#3E3344]">
                Zapytania o rezerwację wpadają na skrzynkę lokalu. Licznik wolnych miejsc zmienia
                właściciel, serwis nie pobiera płatności.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Banner */}
      <section className="shrink-0 mx-6 sm:mx-12 md:mx-[130px] my-9 border border-[#E2D5CA] rounded-[20px] bg-white p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-sm">
        <div className="grow">
          <h2 className="m-0 mb-2.5 font-fraunces font-medium text-[27px]">
            Masz lokal i robisz andrzejki?
          </h2>
          <p className="m-0 text-[16px] leading-[1.65] text-[#3E3344] max-w-[74ch]">
            Wystaw termin w swoim profilu. Ta sama opłata abonamentowa, żadnej prowizji od
            sprzedanych miejsc. Wpis żyje do dnia imprezy, potem sam schodzi z listy.
          </p>
        </div>
        <Link
          href="/cennik"
          className="shrink-0 text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-8 py-4 cursor-pointer"
        >
          Dodaj swoją imprezę
        </Link>
      </section>
    </div>
  );
}

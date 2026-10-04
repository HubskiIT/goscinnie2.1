"use client";

import Link from "next/link";
import { useState } from "react";

export function ImprezyScreen() {
  const [selectedTag, setSelectedTag] = useState("Andrzejki");

  const occasionTags = [
    { name: "Andrzejki", date: "29 listopada", count: "24 imprezy" },
    { name: "Mikołajki", date: "6 grudnia", count: "11 imprez" },
    { name: "Wigilie firmowe", date: "grudzień", count: "17 imprez" },
    { name: "Sylwester", date: "31 grudnia", count: "38 imprez" },
    { name: "Karnawał", date: "styczeń i luty", count: "9 imprez" },
    { name: "Walentynki", date: "14 lutego", count: "14 imprez" },
    { name: "Ostatki", date: "17 lutego", count: "6 imprez" },
    { name: "Dzień Kobiet", date: "8 marca", count: "8 imprez" },
  ];

  const events = [
    {
      id: 1,
      day: "29",
      month: "lis",
      title: "Andrzejki pod Lipami",
      place: "Dwór pod Lipami, Kobierzyce",
      time: "sobota, 19:00 do 3:00",
      tags: ["kolacja", "DJ", "wróżby"],
      badge: "wolne 24 miejsca",
      badgeColor: "text-[#3F5142] bg-[#E7EDE7]",
      price: "180 zł",
      bgColor: "bg-[#E4D9CF]",
      soldOut: false,
    },
    {
      id: 2,
      day: "29",
      month: "lis",
      title: "Wróżby i winyle",
      place: "Restauracja Nad Odrą, Wrocław",
      time: "sobota, 20:00 do 2:00",
      tags: ["bufet", "open bar"],
      badge: "ostatnie 6 miejsc",
      badgeColor: "text-[#8A5405] bg-white border border-[#E2D5CA]",
      price: "140 zł",
      bgColor: "bg-[#DED4DC]",
      soldOut: false,
    },
    {
      id: 3,
      day: "28",
      month: "lis",
      title: "Andrzejkowy bal rodzinny",
      place: "Folwark Zielona Brama, Siechnice",
      time: "piątek, 18:00 do 1:00",
      tags: ["dla dzieci", "animator"],
      badge: "wolne 48 miejsc",
      badgeColor: "text-[#3F5142] bg-[#E7EDE7]",
      price: "120 zł",
      bgColor: "bg-[#DCE0D8]",
      soldOut: false,
    },
    {
      id: 4,
      day: "29",
      month: "lis",
      title: "Noc wróżb",
      place: "Sala Pod Kasztanem, Wrocław",
      time: "sobota, 19:30 do 3:00",
      tags: ["kolacja", "zespół na żywo"],
      badge: "wyprzedane",
      badgeColor: "text-[#8B7F91] bg-[#EDE6E9]",
      price: "165 zł",
      bgColor: "bg-[#E8DED2]",
      soldOut: true,
    },
    {
      id: 5,
      day: "06",
      month: "gru",
      title: "Mikołajki dla najmłodszych",
      place: "Folwark Zielona Brama, Siechnice",
      time: "sobota, 11:00 do 15:00",
      tags: ["dla dzieci", "paczka", "podwieczorek"],
      badge: "wolne 32 miejsca",
      badgeColor: "text-[#3F5142] bg-[#E7EDE7]",
      price: "60 zł",
      bgColor: "bg-[#D9CCC2]",
      soldOut: false,
    },
    {
      id: 6,
      day: "31",
      month: "gru",
      title: "Sylwester w ogrodzie",
      place: "Dwór pod Lipami, Kobierzyce",
      time: "wtorek, 20:00 do 5:00",
      tags: ["kolacja", "open bar", "nocleg"],
      badge: "wolne 70 miejsc",
      badgeColor: "text-[#3F5142] bg-[#E7EDE7]",
      price: "420 zł",
      bgColor: "bg-[#E7EDE7]",
      soldOut: false,
    },
  ];

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
            <div className="font-fraunces text-[34px] font-medium">63 imprezy</div>
            <div className="text-[14px] text-[#6A5C70]">w najbliższych trzech miesiącach</div>
          </div>
        </div>

        {/* Occasion Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {occasionTags.map((o) => {
            const isSelected = selectedTag === o.name;
            return (
              <button
                key={o.name}
                type="button"
                onClick={() => setSelectedTag(o.name)}
                className={`rounded-[14px] p-4 text-left flex flex-col gap-1.5 cursor-pointer transition-all border-0 ${
                  isSelected
                    ? "bg-[#F0A62E] text-[#241C2B] shadow-sm"
                    : "bg-white border border-[#E2D5CA] text-[#241C2B] hover:border-[#241C2B]"
                }`}
              >
                <span className="font-fraunces font-medium text-[20px]">{o.name}</span>
                <span
                  className={`text-[13px] font-semibold ${isSelected ? "text-[#241C2B]" : "text-[#6A5C70]"}`}
                >
                  {o.date}
                </span>
                <span className={`text-[13px] ${isSelected ? "text-[#241C2B]" : "text-[#6A5C70]"}`}>
                  {o.count}
                </span>
              </button>
            );
          })}
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
              key={e.id}
              className="border border-[#E2D5CA] rounded-[18px] bg-white overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`h-[152px] ${e.bgColor} relative`}>
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
                    href="/imprezy/andrzejki-pod-lipami"
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

                <div className="mb-4">
                  <span
                    className={`text-[13px] rounded-[8px] px-2.5 py-1.5 font-medium ${e.badgeColor}`}
                  >
                    {e.badge}
                  </span>
                </div>

                <div className="mt-auto pt-3 flex items-end justify-between gap-3 border-t border-[#EFE5DD]">
                  <div>
                    <div className="font-fraunces text-[22px] font-medium">{e.price}</div>
                    <div className="text-[13px] text-[#6A5C70]">od osoby</div>
                  </div>

                  {e.soldOut ? (
                    <span className="text-[15px] text-[#8B7F91] border-[1.5px] border-[#D9CCC2] rounded-[10px] px-4 py-2 font-medium">
                      Brak miejsc
                    </span>
                  ) : (
                    <Link
                      href="/imprezy/andrzejki-pod-lipami"
                      className="text-[15px] font-semibold text-[#241C2B] border-[1.5px] border-[#241C2B] rounded-[10px] px-4 py-2 hover:bg-[#241C2B] hover:text-white transition-colors cursor-pointer bg-transparent"
                    >
                      Zobacz szczegóły
                    </Link>
                  )}
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
            onClick={() => alert("Wszystkie nadchodzące imprezy w tym regionie zostały wczytane.")}
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
          <p className="m-0 mb-6 text-[15px] leading-[1.6] text-[#6A5C70]">
            Sezon imprez otwartych nie pokrywa się z weselnym. To są dwa różne szczyty i dwa różne
            powody, żeby lokal opłacał abonament cały rok.
          </p>

          <div className="flex gap-2.5 items-end justify-between pt-4">
            {[
              { month: "lis", count: 24, height: 54 },
              { month: "gru", count: 38, height: 86 },
              { month: "sty", count: 9, height: 22 },
              { month: "lut", count: 20, height: 46 },
              { month: "mar", count: 8, height: 20 },
              { month: "kwi", count: 5, height: 13 },
            ].map((bar) => (
              <div key={bar.month} className="flex flex-col items-center gap-2 grow">
                <div className="w-full h-[86px] flex items-end justify-center">
                  <div
                    style={{ height: `${bar.height}px` }}
                    className="w-full max-w-10 rounded-t-[8px] bg-[#5E7360]"
                  />
                </div>
                <div className="text-[13px] font-semibold">{bar.month}</div>
                <div className="text-[12px] text-[#6A5C70]">{bar.count}</div>
              </div>
            ))}
          </div>
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

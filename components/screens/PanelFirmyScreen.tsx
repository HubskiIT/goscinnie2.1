"use client";

import Link from "next/link";
import { useState } from "react";
import { pobierzLokale } from "@/content/ogloszenia";

const NAZWA_FIRMY = pobierzLokale().find((lokal) => lokal.status === "active")?.nazwa ?? "";

export function PanelFirmyScreen() {
  const [internalCalendar, setInternalCalendar] = useState<
    Record<number, "wolny" | "trzymany" | "zajety" | "sobota">
  >({
    1: "wolny",
    2: "wolny",
    3: "wolny",
    4: "zajety",
    5: "wolny",
    6: "sobota",
    7: "wolny",
    8: "wolny",
    9: "zajety",
    10: "wolny",
    11: "trzymany",
    12: "wolny",
    13: "sobota",
    14: "wolny",
  });

  const toggleDayState = (day: number) => {
    setInternalCalendar((prev) => {
      const current = prev[day] || "wolny";
      let next: "wolny" | "trzymany" | "zajety" | "sobota" = "wolny";
      if (current === "wolny") next = "trzymany";
      else if (current === "trzymany") next = "zajety";
      else if (current === "zajety") next = day === 6 || day === 13 ? "sobota" : "wolny";
      else if (current === "sobota") next = "zajety";

      return { ...prev, [day]: next };
    });
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <section className="grow px-6 sm:px-12 md:px-[60px] pt-10 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-7">
          <div>
            <h1 className="m-0 mb-1.5 font-fraunces font-normal text-[32px] sm:text-[40px] tracking-tight">
              {NAZWA_FIRMY}
            </h1>
            <p className="m-0 text-[15px] text-[#6A5C70]">
              Kobierzyce &nbsp;·&nbsp; plan Start do 14.03.2027 &nbsp;·&nbsp;{" "}
              <Link
                href="/f/dwor-pod-lipami"
                className="text-[#8A5405] hover:text-[#241C2B] underline bg-transparent border-0 cursor-pointer p-0"
              >
                zobacz profil oczami klienta
              </Link>
            </p>
          </div>

          <Link
            href="/imprezy"
            className="shrink-0 text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-6 py-3.5 cursor-pointer shadow-sm self-start sm:self-auto"
          >
            Dodaj imprezę
          </Link>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 mb-6.5">
          <div className="border border-[#E2D5CA] rounded-[16px] bg-white p-5.5 sm:p-6 shadow-xs">
            <div className="text-[13px] text-[#6A5C70] mb-2">Nowe zapytania</div>
            <div className="font-fraunces font-medium text-[32px] leading-none">3</div>
            <div className="text-[13px] text-[#6A5C70] mt-2">od 24 października</div>
          </div>

          <div className="border border-[#E2D5CA] rounded-[16px] bg-white p-5.5 sm:p-6 shadow-xs">
            <div className="text-[13px] text-[#6A5C70] mb-2">Złożone oferty</div>
            <div className="font-fraunces font-medium text-[32px] leading-none">11 z 15</div>
            <div className="text-[13px] text-[#6A5C70] mt-2">limit odnowi się 1 listopada</div>
          </div>

          <div className="border border-[#E2D5CA] rounded-[16px] bg-white p-5.5 sm:p-6 shadow-xs">
            <div className="text-[13px] text-[#6A5C70] mb-2">Wolne soboty w sezonie</div>
            <div className="font-fraunces font-medium text-[32px] leading-none">12</div>
            <div className="text-[13px] text-[#6A5C70] mt-2">czerwiec do września 2027</div>
          </div>

          <div className="border border-[#E2D5CA] rounded-[16px] bg-white p-5.5 sm:p-6 shadow-xs">
            <div className="text-[13px] text-[#6A5C70] mb-2">Wyświetlenia profilu</div>
            <div className="font-fraunces font-medium text-[32px] leading-none text-[#8B7F91]">
              —
            </div>
            <div className="text-[13px] text-[#6A5C70] mt-2">statystyki w planie Pełnym</div>
          </div>
        </div>

        {/* Content & Aside */}
        <div className="flex flex-col lg:flex-row gap-5.5 items-start">
          <div className="grow w-full flex flex-col gap-5.5">
            {/* Orders Table */}
            <div className="border border-[#E2D5CA] rounded-[18px] bg-white overflow-hidden shadow-sm">
              <div className="p-4.5 px-6 bg-[#F2E9E2] border-b border-[#E2D5CA] flex items-center justify-between">
                <span className="text-[16px] font-bold">Zapytania i oferty</span>
                <Link
                  href="/zlecenia"
                  className="text-[14px] font-semibold text-[#8A5405] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer"
                >
                  Przejdź do giełdy
                </Link>
              </div>

              {[
                {
                  title: "Komunia, powiat wrocławski",
                  date: "12.06.2027",
                  guests: "80 osób",
                  badge: "czeka na Twoją ofertę",
                  badgeStyle: "text-[#241C2B] bg-[#F0A62E] font-bold",
                  adres: "/zlecenia",
                },
                {
                  title: "Chrzciny, Wrocław",
                  date: "16.05.2027",
                  guests: "45 osób",
                  badge: "oferta złożona",
                  badgeStyle: "text-[#3F5142] bg-[#E7EDE7]",
                  adres: "/moje",
                },
                {
                  title: "Zapytanie bezpośrednie, Anna K.",
                  date: "12.06.2027",
                  guests: "80 osób",
                  badge: "odpowiedz do jutra",
                  badgeStyle: "text-[#3F5142] bg-[#E7EDE7]",
                  adres: "/wiadomosci",
                },
                {
                  title: "Osiemnastka, Święta Katarzyna",
                  date: "03.04.2027",
                  guests: "60 osób",
                  badge: "zlecenie zamknięte",
                  badgeStyle: "text-[#8B7F91] bg-[#EDE6E9]",
                  adres: "/zlecenia",
                },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.adres}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-4 items-center p-4 px-6 border-t border-[#EFE5DD] text-[15px] cursor-pointer hover:bg-[#FAF8F6] transition-colors"
                >
                  <span className="sm:col-span-2 font-semibold text-[#241C2B]">{item.title}</span>
                  <span className="text-[#3E3344]">{item.date}</span>
                  <span className="text-[#3E3344]">{item.guests}</span>
                  <span
                    className={`justify-self-start text-[13px] rounded-[8px] px-3 py-1.5 ${item.badgeStyle}`}
                  >
                    {item.badge}
                  </span>
                </Link>
              ))}
            </div>

            {/* Interactive Calendar */}
            <div className="border border-[#E2D5CA] rounded-[18px] bg-white p-6.5 sm:p-7 shadow-sm">
              <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">
                Kalendarz, czerwiec 2027
              </h2>
              <p className="m-0 mb-4.5 text-[15px] leading-[1.6] text-[#6A5C70]">
                Kliknięcie w dzień przełącza go między wolnym, wstępnie trzymanym i zajętym. Klient
                widzi tylko wolne i zajęte, stan wstępny jest Twoją notatką.
              </p>

              <div className="grid grid-cols-7 gap-2 max-w-[520px]">
                {["pn", "wt", "śr", "cz", "pt", "sb", "nd"].map((d) => (
                  <span
                    key={d}
                    className="text-[12px] text-[#6A5C70] text-center pb-1 font-semibold"
                  >
                    {d}
                  </span>
                ))}

                {Array.from({ length: 14 }).map((_, idx) => {
                  const day = idx + 1;
                  const state = internalCalendar[day] || "wolny";

                  if (state === "sobota") {
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDayState(day)}
                        title="Sobota wolna (kliknij, aby zmienić)"
                        className="h-11 rounded-[8px] bg-[#F0A62E] text-[#241C2B] font-bold flex items-center justify-center text-[14px] cursor-pointer border-0 shadow-sm transition-transform hover:scale-105"
                      >
                        {day}
                      </button>
                    );
                  }

                  if (state === "trzymany") {
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDayState(day)}
                        title="Trzymany wstępnie (kliknij, aby zmienić)"
                        className="h-11 rounded-[8px] bg-white border-[1.5px] border-dashed border-[#5E7360] text-[#3F5142] font-semibold flex items-center justify-center text-[14px] cursor-pointer shadow-xs transition-transform hover:scale-105"
                      >
                        {day}
                      </button>
                    );
                  }

                  if (state === "zajety") {
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDayState(day)}
                        title="Zajęty (kliknij, aby zmienić)"
                        className="h-11 rounded-[8px] bg-[#EDE6E9] text-[#8B7F91] line-through flex items-center justify-center text-[14px] cursor-pointer border-0 transition-transform hover:scale-105"
                      >
                        {day}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDayState(day)}
                      title="Wolny (kliknij, aby zmienić)"
                      className="h-11 rounded-[8px] bg-white border border-[#E2D5CA] text-[#241C2B] flex items-center justify-center text-[14px] cursor-pointer hover:border-[#241C2B] transition-transform hover:scale-105"
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-5 mt-4.5 text-[13px] text-[#6A5C70]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[3px] border border-[#E2D5CA] bg-white" />
                  wolne
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[3px] border-[1.5px] border-dashed border-[#5E7360]" />
                  trzymane wstępnie
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[3px] bg-[#EDE6E9]" />
                  zajęte
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[3px] bg-[#F0A62E]" />
                  wolna sobota
                </span>
              </div>
            </div>
          </div>

          {/* Aside Profile completeness & Subscription */}
          <aside className="w-full lg:w-[380px] shrink-0 flex flex-col gap-5">
            <div className="border border-[#D9CCC2] rounded-[18px] bg-white p-6 shadow-sm">
              <div className="text-[16px] font-bold mb-1">Kompletność profilu</div>
              <div className="text-[14px] text-[#6A5C70] mb-3.5">4 z 6 pozycji</div>
              <div className="h-2 rounded-full bg-[#EFE5DD] overflow-hidden mb-2">
                <div className="w-[67%] h-full bg-[#5E7360]" />
              </div>

              {[
                { title: "Opis miejsca", done: true },
                { title: "Cennik", done: true },
                { title: "Pojemność i udogodnienia", done: true },
                { title: "Kalendarz terminów", done: true },
                { title: "Zdjęcia", done: false },
                { title: "Potwierdzony telefon", done: false },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-3 py-3 border-t border-[#EFE5DD]"
                >
                  {item.done ? (
                    <svg
                      aria-hidden="true"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#5E7360"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0"
                    >
                      <polyline points="4 12 10 18 20 6" />
                    </svg>
                  ) : (
                    <span className="w-5 h-5 rounded-[6px] border-[1.5px] border-[#D9CCC2] shrink-0" />
                  )}
                  <span
                    className={`text-[15px] ${item.done ? "text-[#6A5C70]" : "text-[#241C2B]"}`}
                  >
                    {item.title}
                  </span>
                  {!item.done && (
                    <button
                      type="button"
                      disabled
                      className="ml-auto text-[14px] font-semibold text-[#8A5405] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer"
                    >
                      Uzupełnij
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="border border-[#E2D5CA] rounded-[18px] bg-[#F2E9E2] p-6">
              <div className="text-[16px] font-bold mb-2">Abonament</div>
              <p className="m-0 mb-4 text-[14px] leading-[1.7] text-[#55485A]">
                Plan Start, 1 490 zł netto za rok, odnowi się 14 marca 2027. Jeśli nie przedłużysz,
                profil zostaje w katalogu, znika tylko dostęp do zleceń.
              </p>
              <Link
                href="/cennik"
                className="w-full text-center text-[15px] font-semibold text-[#241C2B] border-[1.5px] border-[#241C2B] rounded-[10px] py-3 bg-white hover:bg-[#241C2B] hover:text-white transition-colors cursor-pointer"
              >
                Zmień plan lub pobierz fakturę
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

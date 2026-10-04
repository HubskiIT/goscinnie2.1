"use client";

import { useState } from "react";
import { Footer } from "../Footer";
import { Header } from "../Header";
import type { ScreenProps } from "../types";

export function CennikScreen({ navigate }: ScreenProps) {
  const [selectedClass, setSelectedClass] = useState<"A" | "B" | "C">("A");
  const [period, setPeriod] = useState<"miesiac" | "pol_roku" | "rok">("rok");

  // Pricing matrix from spec (Oct 3, 2026)
  const prices = {
    A: {
      label: "Klasa A · Sale, hotele, dwory, catering pełny",
      avgDeal: "15 000 – 60 000 zł",
      miesiac: { start: 189, pelny: 379, wyrozniony: 739 },
      pol_roku: { start: 890, pelny: 1790, wyrozniony: 3540 },
      rok: { start: 1490, pelny: 2990, wyrozniony: 5900 },
      categoryDesc:
        "Dla obiektów i firm, gdzie jedno pozyskane wesele lub przyjęcie zwraca koszt rocznego abonamentu z kilkukrotną nawiązką.",
    },
    B: {
      label: "Klasa B · Restauracje, agroturystyka, zespoły, foto, wideo, dekoracje",
      avgDeal: "3 000 – 15 000 zł",
      miesiac: { start: 89, pelny: 179, wyrozniony: 349 },
      pol_roku: { start: 410, pelny: 830, wyrozniony: 1670 },
      rok: { start: 690, pelny: 1390, wyrozniony: 2790 },
      categoryDesc:
        "Dla kluczowych twórców oprawy uroczystości szukających regularnych zleceń w wybranym regionie.",
    },
    C: {
      label: "Klasa C · DJ, barman, animator, fotobudka, transport, florysta",
      avgDeal: "500 – 3 000 zł",
      miesiac: { start: 49, pelny: 99, wyrozniony: 189 },
      pol_roku: { start: 230, pelny: 470, wyrozniony: 890 },
      rok: { start: 390, pelny: 790, wyrozniony: 1490 },
      categoryDesc:
        "Dla mobilnych specjalistów i usługodawców z krótszym czasem realizacji i dużą częstotliwością imprez.",
    },
  };

  const currentPrices = prices[selectedClass][period];

  const getPeriodLabel = () => {
    if (period === "miesiac") return "za miesiąc (odnawiany z karty)";
    if (period === "pol_roku") return "za pół roku (+20% vs baza roczna)";
    return "za rok (cena bazowa, najkorzystniejsza)";
  };

  const getOfferLimit = (plan: "start" | "pelny" | "wyrozniony") => {
    if (plan === "start") {
      if (period === "miesiac") return "2 oferty / miesiąc";
      if (period === "pol_roku") return "8 ofert / pół roku";
      return "15 ofert / rok";
    }
    if (plan === "pelny") {
      if (period === "miesiac") return "8 ofert / miesiąc";
      return "Bez limitu ofert";
    }
    if (plan === "wyrozniony") {
      if (period === "miesiac") return "15 ofert / miesiąc";
      return "Bez limitu ofert";
    }
    return "";
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <Header currentScreen="Cennik" navigate={navigate} />

      {/* Hero */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-14">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] font-bold tracking-wider uppercase text-[#5E7360] bg-[#E7EDE7] px-3 py-1 rounded-full">
            Model abonamentowy · Aktualizacja 3 października 2026
          </span>
        </div>
        <h1 className="m-0 mb-3.5 font-fraunces font-normal text-[36px] sm:text-[46px] md:text-[50px] tracking-tight max-w-[22ch]">
          Jedna opłata, zero prowizji od umów i wejściówek
        </h1>
        <p className="m-0 mb-6 text-[18px] leading-[1.6] text-[#3E3344] max-w-[72ch]">
          Nie bierzemy procentu od wesela ani 150 zł za pojedynczy kontakt, jak inne serwisy.
          Płacisz przejrzysty abonament za obecność w katalogu i prawo odpowiadania na zlecenia.
          Klient korzysta bezpłatnie i bez prowizji.
        </p>

        <div className="flex flex-wrap gap-y-3 gap-x-8 text-[15px] text-[#55485A] border-b border-[#E2D5CA] pb-8">
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#E7EDE7] text-[#5E7360] flex items-center justify-center font-bold text-[12px]">
              ✓
            </span>
            Gwarancja 90 dni (przedłużenie o pół roku gratis)
          </span>
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#E7EDE7] text-[#5E7360] flex items-center justify-center font-bold text-[12px]">
              ✓
            </span>
            30 dni próby bez podpinania karty
          </span>
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#E7EDE7] text-[#5E7360] flex items-center justify-center font-bold text-[12px]">
              ✓
            </span>
            Zwrot do 14 dni bez pytań
          </span>
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#E7EDE7] text-[#5E7360] flex items-center justify-center font-bold text-[12px]">
              ✓
            </span>
            Faktura VAT 23% gotowa pod KSeF
          </span>
        </div>
      </section>

      {/* Selectors: Class + Period */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          {/* Class Tabs */}
          <div>
            <div className="text-[13px] font-bold text-[#6A5C70] mb-2 uppercase tracking-wider">
              1. Wybierz klasę swojej branży
            </div>
            <div className="inline-flex flex-wrap p-1 bg-[#F2E9E2] rounded-[14px] border border-[#E2D5CA]">
              <button
                type="button"
                onClick={() => setSelectedClass("A")}
                className={`px-4 py-2.5 rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all ${
                  selectedClass === "A"
                    ? "bg-white text-[#241C2B] shadow-xs"
                    : "text-[#6A5C70] hover:text-[#241C2B] bg-transparent"
                }`}
              >
                Klasa A (Sale, hotele, catering)
              </button>
              <button
                type="button"
                onClick={() => setSelectedClass("B")}
                className={`px-4 py-2.5 rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all ${
                  selectedClass === "B"
                    ? "bg-white text-[#241C2B] shadow-xs"
                    : "text-[#6A5C70] hover:text-[#241C2B] bg-transparent"
                }`}
              >
                Klasa B (Restauracje, foto, wideo, zespół)
              </button>
              <button
                type="button"
                onClick={() => setSelectedClass("C")}
                className={`px-4 py-2.5 rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all ${
                  selectedClass === "C"
                    ? "bg-white text-[#241C2B] shadow-xs"
                    : "text-[#6A5C70] hover:text-[#241C2B] bg-transparent"
                }`}
              >
                Klasa C (DJ, barman, animator, transport)
              </button>
            </div>
          </div>

          {/* Period Toggle */}
          <div>
            <div className="text-[13px] font-bold text-[#6A5C70] mb-2 uppercase tracking-wider lg:text-right">
              2. Wybierz okres rozliczenia
            </div>
            <div className="inline-flex p-1 bg-[#F2E9E2] rounded-[14px] border border-[#E2D5CA]">
              <button
                type="button"
                onClick={() => setPeriod("miesiac")}
                className={`px-4 py-2.5 rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all ${
                  period === "miesiac"
                    ? "bg-white text-[#241C2B] shadow-xs"
                    : "text-[#6A5C70] hover:text-[#241C2B] bg-transparent"
                }`}
              >
                Miesiąc
              </button>
              <button
                type="button"
                onClick={() => setPeriod("pol_roku")}
                className={`px-4 py-2.5 rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all ${
                  period === "pol_roku"
                    ? "bg-white text-[#241C2B] shadow-xs"
                    : "text-[#6A5C70] hover:text-[#241C2B] bg-transparent"
                }`}
              >
                Pół roku
              </button>
              <button
                type="button"
                onClick={() => setPeriod("rok")}
                className={`px-4 py-2.5 rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all ${
                  period === "rok"
                    ? "bg-white text-[#241C2B] shadow-xs"
                    : "text-[#6A5C70] hover:text-[#241C2B] bg-transparent"
                }`}
              >
                Rok (Rekomendowany)
              </button>
            </div>
          </div>
        </div>

        {/* Selected class explanation bar */}
        <div className="border border-[#E2D5CA] bg-white rounded-[14px] p-4.5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <span className="font-semibold text-[15px] text-[#241C2B] mr-3">
              {prices[selectedClass].label}
            </span>
            <span className="text-[14px] text-[#6A5C70]">
              Średnia wartość zlecenia: {prices[selectedClass].avgDeal}
            </span>
          </div>
          <span className="text-[13px] text-[#55485A] italic">
            Ceny netto za okres:{" "}
            {period === "rok" ? "12 miesięcy" : period === "pol_roku" ? "6 miesięcy" : "1 miesiąc"}
          </span>
        </div>

        {/* 3 Pricing Plans Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan 1: Start */}
          <div className="border border-[#E2D5CA] rounded-[20px] bg-white p-7 sm:p-8 flex flex-col shadow-xs relative">
            <div className="font-fraunces font-medium text-[26px] mb-1.5">Start</div>
            <div className="text-[14px] text-[#6A5C70] mb-5 min-h-[44px]">
              Dla firm, które wchodzą na rynek i chcą zdobywać pierwsze zlecenia w regionie.
            </div>

            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="font-fraunces text-[42px] font-medium text-[#241C2B]">
                {currentPrices.start.toLocaleString("pl-PL")} zł
              </span>
              <span className="text-[14px] text-[#6A5C70]">netto</span>
            </div>
            <div className="text-[13px] text-[#6A5C70] mb-6">{getPeriodLabel()}</div>

            <div className="border-t border-[#EFE5DD] pt-5 mb-6 grow">
              <div className="text-[13px] font-bold text-[#241C2B] uppercase tracking-wider mb-3">
                W cenie planu:
              </div>
              <ul className="m-0 pl-0 list-none text-[14px] leading-[1.6] text-[#3E3344] space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-[#5E7360] font-bold">✓</span>
                  <span>Pełny profil z opisem, dojazdem i FAQ</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#5E7360] font-bold">✓</span>
                  <span>Do 30 zdjęć w galerii i cennik usług</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#5E7360] font-bold">✓</span>
                  <span>Kalendarz wolnych sobót i terminów</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#5E7360] font-bold">✓</span>
                  <span>Formularz bezpośrednich zapytań od klientów</span>
                </li>
                <li className="flex items-start gap-2 font-semibold text-[#241C2B]">
                  <span className="text-[#F0A62E] font-bold">★</span>
                  <span>Limit ofert na giełdzie: {getOfferLimit("start")}</span>
                </li>
                <li className="flex items-start gap-2 text-[#6A5C70]">
                  <span className="text-[#8B7F91]">·</span>
                  <span>Powiadomienia o zleceniach po 60 minutach</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate("ZamowienieAbonamentu")}
                className="w-full text-[15px] font-bold text-[#241C2B] bg-white border-2 border-[#241C2B] rounded-[12px] p-3.5 cursor-pointer hover:bg-[#241C2B] hover:text-white transition-colors"
              >
                Wybierz Start
              </button>
              <button
                type="button"
                onClick={() => navigate("RejestracjaFirmy")}
                className="w-full text-[13px] text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 py-1.5 cursor-pointer text-center"
              >
                lub wypróbuj 30 dni za darmo →
              </button>
            </div>
          </div>

          {/* Plan 2: Pełny (Najczęściej wybierany) */}
          <div className="border-2 border-[#241C2B] rounded-[20px] bg-white p-7 sm:p-8 flex flex-col shadow-md relative">
            <span className="absolute -top-3.5 left-7 text-[12px] font-bold tracking-wider uppercase text-[#241C2B] bg-[#F0A62E] rounded-full px-3.5 py-1 shadow-xs">
              Najczęściej wybierany
            </span>

            <div className="font-fraunces font-medium text-[26px] mb-1.5 mt-2">Pełny</div>
            <div className="text-[14px] text-[#6A5C70] mb-5 min-h-[44px]">
              Dla firm, które chcą regularnie zdobywać klientów i nie tracić żadnego pasującego
              zlecenia.
            </div>

            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="font-fraunces text-[42px] font-medium text-[#241C2B]">
                {currentPrices.pelny.toLocaleString("pl-PL")} zł
              </span>
              <span className="text-[14px] text-[#6A5C70]">netto</span>
            </div>
            <div className="text-[13px] text-[#6A5C70] mb-6">{getPeriodLabel()}</div>

            <div className="border-t border-[#EFE5DD] pt-5 mb-6 grow">
              <div className="text-[13px] font-bold text-[#241C2B] uppercase tracking-wider mb-3">
                Wszystko co w Start oraz:
              </div>
              <ul className="m-0 pl-0 list-none text-[14px] leading-[1.6] text-[#3E3344] space-y-2.5">
                <li className="flex items-start gap-2 font-semibold text-[#241C2B]">
                  <span className="text-[#5E7360] font-bold">✓</span>
                  <span>{getOfferLimit("pelny")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#5E7360] font-bold">✓</span>
                  <span>Wideo w tle profilu i prezentacja</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#5E7360] font-bold">✓</span>
                  <span>Wyższa pozycja w wynikach wyszukiwarki</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#5E7360] font-bold">✓</span>
                  <span>Odznaka „Zweryfikowany partner”</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#5E7360] font-bold">✓</span>
                  <span>Panel statystyk (wyświetlenia, zapytania, konwersja)</span>
                </li>
                <li className="flex items-start gap-2 text-[#241C2B]">
                  <span className="text-[#F0A62E] font-bold">★</span>
                  <span>Szybsze powiadomienia o zleceniach: już po 15 min</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate("ZamowienieAbonamentu")}
                className="w-full text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] p-3.5 cursor-pointer shadow-xs"
              >
                Wybierz Pełny
              </button>
              <button
                type="button"
                onClick={() => navigate("RejestracjaFirmy")}
                className="w-full text-[13px] text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 py-1.5 cursor-pointer text-center"
              >
                lub wypróbuj 30 dni za darmo →
              </button>
            </div>
          </div>

          {/* Plan 3: Wyróżniony */}
          <div className="border border-[#E2D5CA] rounded-[20px] bg-white p-7 sm:p-8 flex flex-col shadow-xs relative">
            <div className="font-fraunces font-medium text-[26px] mb-1.5">Wyróżniony</div>
            <div className="text-[14px] text-[#6A5C70] mb-5 min-h-[44px]">
              Dla liderów w swoich powiatach, którzy chcą być widoczni na samej górze.
            </div>

            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="font-fraunces text-[42px] font-medium text-[#241C2B]">
                {currentPrices.wyrozniony.toLocaleString("pl-PL")} zł
              </span>
              <span className="text-[14px] text-[#6A5C70]">netto</span>
            </div>
            <div className="text-[13px] text-[#6A5C70] mb-6">{getPeriodLabel()}</div>

            <div className="border-t border-[#EFE5DD] pt-5 mb-6 grow">
              <div className="text-[13px] font-bold text-[#241C2B] uppercase tracking-wider mb-3">
                Wszystko co w Pełny oraz:
              </div>
              <ul className="m-0 pl-0 list-none text-[14px] leading-[1.6] text-[#3E3344] space-y-2.5">
                <li className="flex items-start gap-2 font-semibold text-[#241C2B]">
                  <span className="text-[#5E7360] font-bold">✓</span>
                  <span>{getOfferLimit("wyrozniony")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#5E7360] font-bold">✓</span>
                  <span>Gwarantowane miejsce w pierwszej trójce w powiecie</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#5E7360] font-bold">✓</span>
                  <span>Banner promocyjny w Twojej kategorii</span>
                </li>
                <li className="flex items-start gap-2 font-semibold text-[#241C2B]">
                  <span className="text-[#F0A62E] font-bold">★</span>
                  <span>Powiadomienia o nowych zleceniach: NATYCHMIAST (0 min)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#5E7360] font-bold">✓</span>
                  <span>Osobisty opiekun profilu i pomoc w optymalizacji</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate("ZamowienieAbonamentu")}
                className="w-full text-[15px] font-bold text-[#241C2B] bg-white border-2 border-[#241C2B] rounded-[12px] p-3.5 cursor-pointer hover:bg-[#241C2B] hover:text-white transition-colors"
              >
                Wybierz Wyróżniony
              </button>
              <button
                type="button"
                onClick={() => navigate("RejestracjaFirmy")}
                className="w-full text-[13px] text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 py-1.5 cursor-pointer text-center"
              >
                lub wypróbuj 30 dni za darmo →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-14">
        <h2 className="font-fraunces text-[28px] sm:text-[34px] font-medium mb-3">
          Porównanie możliwości planów
        </h2>
        <p className="text-[16px] text-[#6A5C70] mb-7 max-w-[65ch]">
          Wszystkie plany gwarantują brak prowizji od transakcji. Różnią się widocznością oraz
          szybkością dostępu do giełdy zleceń.
        </p>

        <div className="border border-[#E2D5CA] rounded-[18px] bg-white overflow-x-auto shadow-xs">
          <table className="w-full text-left border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-[#E2D5CA] bg-[#F2E9E2]/50">
                <th className="p-4 sm:p-5 font-semibold text-[#241C2B] w-2/5">
                  Funkcja / uprawnienie
                </th>
                <th className="p-4 sm:p-5 font-semibold text-[#241C2B] text-center w-1/5">Start</th>
                <th className="p-4 sm:p-5 font-semibold text-[#241C2B] text-center w-1/5 bg-[#F2E9E2]">
                  Pełny
                </th>
                <th className="p-4 sm:p-5 font-semibold text-[#241C2B] text-center w-1/5">
                  Wyróżniony
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE5DD] text-[#3E3344]">
              <tr>
                <td className="p-4 sm:p-5 font-medium">Prowizja od pozyskanych umów</td>
                <td className="p-4 sm:p-5 text-center text-[#5E7360] font-bold">0% zawsze</td>
                <td className="p-4 sm:p-5 text-center text-[#5E7360] font-bold bg-[#FBF7F4]">
                  0% zawsze
                </td>
                <td className="p-4 sm:p-5 text-center text-[#5E7360] font-bold">0% zawsze</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium">Zdjęcia w galerii profilu</td>
                <td className="p-4 sm:p-5 text-center">do 30 zdjęć</td>
                <td className="p-4 sm:p-5 text-center bg-[#FBF7F4]">do 30 zdjęć + wideo</td>
                <td className="p-4 sm:p-5 text-center">do 30 zdjęć + wideo</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium">Kalendarz wolnych sobót i terminów</td>
                <td className="p-4 sm:p-5 text-center text-[#5E7360] font-bold">✓</td>
                <td className="p-4 sm:p-5 text-center text-[#5E7360] font-bold bg-[#FBF7F4]">✓</td>
                <td className="p-4 sm:p-5 text-center text-[#5E7360] font-bold">✓</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium">Powiadomienia o zleceniach klienta</td>
                <td className="p-4 sm:p-5 text-center text-[#6A5C70]">po 60 min</td>
                <td className="p-4 sm:p-5 text-center font-bold text-[#241C2B] bg-[#FBF7F4]">
                  po 15 min
                </td>
                <td className="p-4 sm:p-5 text-center font-bold text-[#F0A62E]">
                  natychmiast (0 min)
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium">Limit ofert na giełdzie (okres roczny)</td>
                <td className="p-4 sm:p-5 text-center">15 ofert / rok</td>
                <td className="p-4 sm:p-5 text-center font-bold text-[#5E7360] bg-[#FBF7F4]">
                  Bez limitu
                </td>
                <td className="p-4 sm:p-5 text-center font-bold text-[#5E7360]">Bez limitu</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium">Pozycja w katalogu w powiecie</td>
                <td className="p-4 sm:p-5 text-center text-[#6A5C70]">standardowa</td>
                <td className="p-4 sm:p-5 text-center font-medium bg-[#FBF7F4]">
                  wyżej w wynikach
                </td>
                <td className="p-4 sm:p-5 text-center font-bold text-[#241C2B]">pierwsza trójka</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium">Dedykowany opiekun profilu</td>
                <td className="p-4 sm:p-5 text-center text-[#8B7F91]">—</td>
                <td className="p-4 sm:p-5 text-center text-[#8B7F91] bg-[#FBF7F4]">—</td>
                <td className="p-4 sm:p-5 text-center text-[#5E7360] font-bold">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Add-ons */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-14 pb-16">
        <h2 className="font-fraunces text-[28px] sm:text-[34px] font-medium mb-3">
          Usługi dodatkowe dla wymagających
        </h2>
        <p className="text-[16px] text-[#6A5C70] mb-7 max-w-[65ch]">
          Opcjonalne pakiety, które możesz dokupić w dowolnym momencie trwania abonamentu w panelu
          firmy.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="border border-[#E2D5CA] rounded-[16px] bg-white p-6 shadow-xs">
            <div className="text-[13px] text-[#6A5C70] mb-1">Dla lokali i sal</div>
            <div className="font-fraunces text-[22px] font-medium mb-2">Sesja zdjęciowa lokalu</div>
            <div className="text-[20px] font-bold text-[#241C2B] mb-2">900 – 1 800 zł</div>
            <p className="text-[14px] text-[#55485A] leading-[1.5] m-0">
              Profesjonalny fotograf architektury wnętrz. 25 obrobionych kadrów fasady, sal, ogrodu
              i detali stołu.
            </p>
          </div>

          <div className="border border-[#E2D5CA] rounded-[16px] bg-white p-6 shadow-xs">
            <div className="text-[13px] text-[#6A5C70] mb-1">Dla klasy A</div>
            <div className="font-fraunces text-[22px] font-medium mb-2">Spacer wirtualny 360°</div>
            <div className="text-[20px] font-bold text-[#241C2B] mb-2">1 200 zł</div>
            <p className="text-[14px] text-[#55485A] leading-[1.5] m-0">
              Interaktywny spacer 3D po obiekcie zintegrowany w zakładce profilu. Klient ogląda salę
              bez wychodzenia z domu.
            </p>
          </div>

          <div className="border border-[#E2D5CA] rounded-[16px] bg-white p-6 shadow-xs">
            <div className="text-[13px] text-[#6A5C70] mb-1">Dotarcie bezpośrednie</div>
            <div className="font-fraunces text-[22px] font-medium mb-2">
              Wyróżnienie w newsletterze
            </div>
            <div className="text-[20px] font-bold text-[#241C2B] mb-2">400 zł / wysyłka</div>
            <p className="text-[14px] text-[#55485A] leading-[1.5] m-0">
              Maksymalnie 3 polecane firmy w cotygodniowym wydaniu do par i organizatorów
              planujących imprezę w danym miesiącu.
            </p>
          </div>
        </div>
      </section>

      <Footer navigate={navigate} />
    </div>
  );
}

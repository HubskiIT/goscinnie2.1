"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EtykietaPrzykladu } from "@/components/EtykietaPrzykladu";
import { zlote } from "@/content/format";
import { pobierzKategorie } from "@/content/kategorie";
import { pobierzUslugodawcow } from "@/content/ogloszenia";

export function UslugodawcyScreen() {
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");

  const kategorie = pobierzKategorie();

  // Dopóki nie ma bazy, filtrujemy po tym, co jest w content/.
  const filteredProviders = useMemo(() => {
    const fraza = searchInput.trim().toLowerCase();
    return pobierzUslugodawcow()
      .map((u) => ({
        slug: u.slug,
        name: u.nazwa,
        category: kategorie.find((k) => k.slug === u.kategoriaGlowna)?.nazwa ?? "",
        base: `Baza: ${u.miejscowosc.nazwa} · dojeżdża do ${u.zasiegDojazduKm} km`,
        description: u.opis,
        tags: u.udogodnienia,
        price: u.cenaOdGrosze === null ? "Cena niepodana" : `od ${zlote(u.cenaOdGrosze)}`,
        unit: u.jednostkaCeny,
        przykladowe: u.przykladowe,
      }))
      .filter((u) => {
        if (!fraza) return true;
        return (
          u.name.toLowerCase().includes(fraza) ||
          u.category.toLowerCase().includes(fraza) ||
          u.tags.some((t) => t.toLowerCase().includes(fraza)) ||
          u.description.toLowerCase().includes(fraza)
        );
      });
  }, [searchInput, kategorie]);

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen font-figtree">
      {/* Header z aktywnym stanem Usługodawcy ^ */}

      {/* Kategorie usługodawców: 14 ze specyfikacji, bez podkategorii i bez liczników */}
      <section className="shrink-0 px-6 sm:px-10 lg:px-[130px] pt-6 pb-4">
        <div className="border border-[#E2D5CA] rounded-[24px] bg-white shadow-md overflow-hidden flex flex-col lg:flex-row">
          <div className="grow p-6 lg:p-7">
            <h2 className="m-0 mb-5 font-fraunces font-normal text-[26px] sm:text-[28px] text-[#241C2B] tracking-tight">
              Kogo szukasz
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
              {kategorie.map((kategoria) => (
                <Link
                  key={kategoria.slug}
                  href={`/uslugodawcy/${kategoria.slug}/wroclaw`}
                  className="text-[15px] text-[#3E3344] hover:text-[#241C2B] hover:underline"
                >
                  {kategoria.nazwa}
                </Link>
              ))}
            </div>
          </div>
          {/* PRAWA KOLUMNA: KARTA "POTRZEBUJESZ KILKU NARAZ?" */}
          <div className="w-full lg:w-[320px] shrink-0 p-6 lg:p-7 flex items-center">
            <div className="w-full bg-[#F2E9E2] rounded-[18px] p-6 sm:p-7 flex flex-col justify-between gap-5 border border-[#E8DDD2]">
              <div>
                <h3 className="m-0 font-fraunces font-medium text-[19px] sm:text-[20px] text-[#241C2B] mb-2.5">
                  Potrzebujesz kilku naraz?
                </h3>
                <p className="m-0 text-[14px] leading-[1.6] text-[#3E3344]">
                  Wystaw jedno zlecenie na fotografa, zespół i catering. Każda kategoria dostanie je
                  osobno.
                </p>
              </div>

              <Link
                href="/dodaj-zlecenie"
                className="w-full py-3.5 px-5 bg-white hover:bg-[#241C2B] hover:text-white transition-colors text-[#241C2B] text-[15px] font-semibold rounded-[12px] border border-[#241C2B] cursor-pointer shadow-xs"
              >
                Wystaw zlecenie
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sekcja główna */}
      <section className="shrink-0 px-6 sm:px-10 lg:px-[130px] pt-10 pb-6">
        <h1 className="m-0 mb-3.5 font-fraunces font-normal text-[36px] sm:text-[46px] md:text-[50px] tracking-tight leading-[1.12]">
          Usługodawcy na każdą okazję
        </h1>
        <p className="m-0 mb-8 text-[17px] leading-[1.6] text-[#3E3344] max-w-[76ch]">
          Jeśli wiesz, kogo szukasz, wpisz to w jednym polu. Jeśli nie wiesz, zjedź niżej i
          przeglądaj kategoriami. Te dwie drogi prowadzą w to samo miejsce i obie działają bez
          konta.
        </p>

        {/* Wyszukiwarka z podziałem na treść i lokalizację */}
        <div className="border-[2px] border-[#241C2B] rounded-[16px] bg-white p-2 sm:p-2.5 flex flex-col sm:flex-row items-center gap-2 shadow-sm">
          {/* Input tekstowy */}
          <div className="grow w-full flex items-center px-4 py-2 gap-3">
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6A5C70"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Wpisz kogo szukasz, np. zespół na wesele, który gra też na ceremonii..."
              className="w-full text-[16px] text-[#241C2B] bg-transparent border-0 focus:outline-none placeholder:text-[#6A5C70]"
            />
          </div>

          {/* Separator pionowy */}
          <div className="hidden sm:block w-[1px] h-9 bg-[#D9CCC2]" />

          {/* Lokalizacja */}
          <div className="w-full sm:w-[170px] shrink-0 px-4 py-2 text-[15px] font-semibold text-[#241C2B] flex items-center justify-between sm:justify-start">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="w-full text-[15px] font-semibold text-[#241C2B] bg-transparent border-0 focus:outline-none"
            />
          </div>

          {/* Przycisk Szukaj */}
          <button
            type="button"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#F0A62E] hover:bg-[#e29922] transition-colors rounded-[12px] text-[16px] font-bold text-[#241C2B] border-0 cursor-pointer shrink-0 shadow-xs"
          >
            Szukaj
          </button>
        </div>

        {/* Tekst wyjaśniający działanie wyszukiwarki */}
        <p className="m-0 mt-5 text-[14px] leading-[1.65] text-[#6A5C70] max-w-[85ch]">
          Wyszukiwarka przeszukuje nazwy kategorii, nazwy firm, miejscowości oraz opisy, które firmy
          same o sobie napisały. Dzięki temu fraza w rodzaju „gra też na ceremonii” trafia, nawet
          jeśli nie ma takiej kategorii.
        </p>
      </section>

      {/* Siatka wyników */}
      <section className="grow px-6 sm:px-10 lg:px-[130px] pt-8 pb-14">
        <div className="flex items-center justify-between mb-6">
          <div className="text-[15px] text-[#55485A]">
            Pokazuję:{" "}
            <strong>
              {filteredProviders.length}{" "}
              {filteredProviders.length === 1 ? "wykonawcę" : "wykonawców"}
            </strong>
          </div>
          {searchInput ? (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="text-[13px] text-[#8A5405] hover:text-[#241C2B] font-semibold underline bg-transparent border-0 cursor-pointer"
            >
              Wyczyść wyszukiwanie
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((p) => (
            <article
              key={p.slug}
              className="border border-[#E2D5CA] rounded-[18px] bg-white overflow-hidden flex flex-col shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="h-[168px] bg-[#E4D9CF]" />
              <div className="p-5 sm:p-6 flex flex-col grow">
                <div className="text-[13px] text-[#3F5142] mb-1 font-medium">{p.category}</div>
                <h3 className="m-0 mb-2 font-fraunces font-medium text-[21px]">
                  <Link
                    href={`/f/${p.slug}`}
                    className="text-[#241C2B] hover:text-[#8A5405] text-left bg-transparent border-0 cursor-pointer p-0 font-inherit"
                  >
                    {p.name}
                  </Link>
                </h3>
                <p className="m-0 mb-3 text-[14px] leading-[1.6] text-[#6A5C70]">{p.base}</p>
                {p.przykladowe ? (
                  <div className="mb-3">
                    <EtykietaPrzykladu />
                  </div>
                ) : null}
                <p className="m-0 mb-3.5 text-[14px] leading-[1.6] text-[#3E3344] line-clamp-2">
                  {p.description}
                </p>

                <div className="flex gap-2 flex-wrap mb-4">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[12px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-2.5 py-1.5 font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-3 flex items-end justify-between gap-3 border-t border-[#EFE5DD]">
                  <div>
                    <div className="font-fraunces text-[22px] font-medium text-[#241C2B]">
                      {p.price}
                    </div>
                    <div className="text-[12px] text-[#6A5C70]">{p.unit}</div>
                  </div>
                  <Link
                    href="/f/dwor-pod-lipami/zapytanie"
                    className="text-[14px] font-semibold text-[#241C2B] border-[1.5px] border-[#241C2B] rounded-[10px] px-4 py-2 hover:bg-[#241C2B] hover:text-white transition-colors cursor-pointer bg-transparent"
                  >
                    Zapytaj
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

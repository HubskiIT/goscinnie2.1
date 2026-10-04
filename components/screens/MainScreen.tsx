"use client";

import Link from "next/link";
import { useState } from "react";

export function MainScreen() {
  const [selectedPlace, setSelectedPlace] = useState("sali");
  const [selectedOccasion, setSelectedOccasion] = useState("komunię");
  const [selectedCity, setSelectedCity] = useState("Wrocławiu");
  const [selectedGuests, setSelectedGuests] = useState("80");
  const [termin, setTermin] = useState("czerwiec 2027");
  const [promien, setPromien] = useState("30 km");

  const places = ["sali", "lokalu", "ogrodu", "dworku"];
  const occasions = ["komunię", "wesele", "chrzciny", "urodziny", "event firmowy", "stypę"];
  const cities = ["Wrocławiu", "Warszawie", "Krakowie", "Poznaniu"];
  const guestsList = ["40", "60", "80", "120", "150"];

  const cycle = (current: string, list: string[], setter: (val: string) => void) => {
    const idx = list.indexOf(current);
    const next = list[(idx + 1) % list.length];
    if (next !== undefined) setter(next);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      {/* Hero Section */}
      <section
        id="top"
        className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-16 md:pt-24 pb-16 md:pb-[92px] relative"
        style={{
          background:
            "radial-gradient(760px 420px at 34% 34%, rgba(240,166,46,0.20), rgba(240,166,46,0) 68%)",
        }}
      >
        <p className="m-0 mb-6 md:mb-[34px] text-[16px] text-[#6A5C70] max-w-[520px]">
          Miejsca i ludzie na każdą okazję, od chrzcin po firmową wigilię.
        </p>

        <h1 className="m-0 font-fraunces font-normal text-[36px] sm:text-[48px] md:text-[62px] leading-[1.3] md:leading-[1.45] tracking-tight max-w-[1000px]">
          Szukam{" "}
          <button
            type="button"
            onClick={() => cycle(selectedPlace, places, setSelectedPlace)}
            title="Kliknij, aby zmienić"
            className="font-inherit bg-transparent border-0 border-b-4 border-[#F0A62E] text-[#241C2B] px-1 pb-1 mx-1 cursor-pointer inline-flex items-baseline gap-2 hover:bg-[#F0A62E]/10 rounded-t"
          >
            {selectedPlace}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8A5405"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="translate-y-[2px]"
            >
              <polyline points="5 9 12 16 19 9" />
            </svg>
          </button>{" "}
          na{" "}
          <button
            type="button"
            onClick={() => cycle(selectedOccasion, occasions, setSelectedOccasion)}
            title="Kliknij, aby zmienić"
            className="font-inherit bg-transparent border-0 border-b-4 border-[#F0A62E] text-[#241C2B] px-1 pb-1 mx-1 cursor-pointer inline-flex items-baseline gap-2 hover:bg-[#F0A62E]/10 rounded-t"
          >
            {selectedOccasion}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8A5405"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="translate-y-[2px]"
            >
              <polyline points="5 9 12 16 19 9" />
            </svg>
          </button>
          <br className="hidden sm:inline" /> we{" "}
          <button
            type="button"
            onClick={() => cycle(selectedCity, cities, setSelectedCity)}
            title="Kliknij, aby zmienić"
            className="font-inherit bg-transparent border-0 border-b-4 border-[#F0A62E] text-[#241C2B] px-1 pb-1 mx-1 cursor-pointer inline-flex items-baseline gap-2 hover:bg-[#F0A62E]/10 rounded-t"
          >
            {selectedCity}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8A5405"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="translate-y-[2px]"
            >
              <polyline points="5 9 12 16 19 9" />
            </svg>
          </button>{" "}
          dla{" "}
          <button
            type="button"
            onClick={() => cycle(selectedGuests, guestsList, setSelectedGuests)}
            title="Kliknij, aby zmienić"
            className="font-inherit bg-transparent border-0 border-b-4 border-[#F0A62E] text-[#241C2B] px-1 pb-1 mx-1 cursor-pointer inline-flex items-baseline gap-2 hover:bg-[#F0A62E]/10 rounded-t"
          >
            {selectedGuests}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8A5405"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="translate-y-[2px]"
            >
              <polyline points="5 9 12 16 19 9" />
            </svg>
          </button>{" "}
          osób
        </h1>

        <div className="mt-8 md:mt-[46px] flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5 border-[1.5px] border-[#D9CCC2] rounded-full px-5 py-3.5 bg-white shadow-sm">
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6A5C70"
              strokeWidth="1.7"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
            <label htmlFor="termin-input" className="text-[15px] text-[#6A5C70]">
              Termin
            </label>
            <input
              id="termin-input"
              type="text"
              value={termin}
              onChange={(e) => setTermin(e.target.value)}
              className="text-[15px] font-semibold text-[#241C2B] border-0 bg-transparent w-[130px] p-0 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2.5 border-[1.5px] border-[#D9CCC2] rounded-full px-5 py-3.5 bg-white shadow-sm">
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6A5C70"
              strokeWidth="1.7"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="10" r="3" />
              <path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11z" />
            </svg>
            <label htmlFor="promien-input" className="text-[15px] text-[#6A5C70]">
              W promieniu
            </label>
            <input
              id="promien-input"
              type="text"
              value={promien}
              onChange={(e) => setPromien(e.target.value)}
              className="text-[15px] font-semibold text-[#241C2B] border-0 bg-transparent w-[64px] p-0 focus:outline-none"
            />
          </div>

          <Link
            href="/lokale"
            className="text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-full px-9 py-4 cursor-pointer shadow"
          >
            Pokaż miejsca
          </Link>
        </div>
      </section>

      {/* Na jaką okazję */}
      <section id="lokale" className="shrink-0 px-6 sm:px-12 md:px-[130px] py-[76px] bg-[#F2E9E2]">
        <h2 className="m-0 mb-8 font-fraunces font-medium text-[32px]">Na jaką okazję</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              title: "Wesele",
              icon: (
                <svg
                  aria-hidden="true"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5E7360"
                  strokeWidth="1.5"
                >
                  <circle cx="9" cy="14" r="5" />
                  <circle cx="15" cy="14" r="5" />
                </svg>
              ),
            },
            {
              title: "Komunia",
              icon: (
                <svg
                  aria-hidden="true"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5E7360"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M7 4h10l-1.5 6a4 4 0 0 1-7 0z" />
                  <path d="M12 14v5M8 21h8" />
                </svg>
              ),
            },
            {
              title: "Chrzciny",
              icon: (
                <svg
                  aria-hidden="true"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5E7360"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                >
                  <path d="M12 3c3.5 4.3 5.5 7.2 5.5 9.6A5.5 5.5 0 0 1 12 18a5.5 5.5 0 0 1-5.5-5.4C6.5 10.2 8.5 7.3 12 3z" />
                </svg>
              ),
            },
            {
              title: "Urodziny",
              icon: (
                <svg
                  aria-hidden="true"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5E7360"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <rect x="4" y="11" width="16" height="9" rx="2" />
                  <path d="M12 11V7M9 20v-9M15 20v-9" />
                </svg>
              ),
            },
            {
              title: "Osiemnastka",
              icon: (
                <svg
                  aria-hidden="true"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5E7360"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M12 3a5.5 5.5 0 0 1 5.5 5.5c0 3.6-3.4 6.5-5.5 6.5s-5.5-2.9-5.5-6.5A5.5 5.5 0 0 1 12 3z" />
                  <path d="M12 15v6" />
                </svg>
              ),
            },
            {
              title: "Event firmowy",
              icon: (
                <svg
                  aria-hidden="true"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5E7360"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <rect x="3" y="8" width="18" height="12" rx="2" />
                  <path d="M9 8V5h6v3M3 13h18" />
                </svg>
              ),
            },
            {
              title: "Stypa",
              icon: (
                <svg
                  aria-hidden="true"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5E7360"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <rect x="9" y="9" width="6" height="11" rx="1.5" />
                  <path d="M12 9V6M12 3v1.5" />
                </svg>
              ),
            },
            {
              title: "Plener",
              icon: (
                <svg
                  aria-hidden="true"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5E7360"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                >
                  <path d="M3 19l9-14 9 14z" />
                  <path d="M12 19V9" />
                </svg>
              ),
            },
          ].map((item) => (
            <Link
              href="/lokale"
              key={item.title}
              className="text-left bg-[#FBF7F4] hover:bg-white hover:shadow-md transition-all border border-[#E2D5CA] rounded-[14px] p-6 flex flex-col gap-3.5 cursor-pointer text-[#241C2B]"
            >
              {item.icon}
              <span className="text-[17px] font-semibold">{item.title}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Reverse Marketplace CTA Banner */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] py-[72px] bg-[#241C2B] text-[#FBF7F4] flex flex-col lg:flex-row gap-12 lg:gap-[90px] items-center">
        <div className="grow max-w-[620px]">
          <h2 className="m-0 mb-4 font-fraunces font-normal text-[32px] md:text-[40px] leading-[1.24] text-[#FBF7F4]">
            Albo odwrotnie: niech oferty przyjdą do Ciebie
          </h2>
          <p className="m-0 mb-8 text-[17px] leading-[1.65] text-[#D5C7D0]">
            Opisz wydarzenie jeden raz. Firmy z okolicy składają oferty, nie widząc nawzajem swoich
            cen. Twoje dane zobaczy tylko ta firma, którą sam wybierzesz.
          </p>
          <Link
            href="/dodaj-zlecenie"
            className="inline-block text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors rounded-full px-[34px] py-[17px] border-0 cursor-pointer"
          >
            Opisz wydarzenie
          </Link>
        </div>

        <div className="w-full lg:w-[430px] shrink-0 bg-[#3A2D42] rounded-[18px] p-[30px] flex flex-col gap-4 shadow-xl">
          <p className="m-0 text-[13px] text-[#B9A8B6] tracking-wide">
            Twoje zlecenie widzą firmy jako
          </p>
          <div className="bg-[#241C2B] rounded-[12px] p-[22px] flex flex-col gap-3">
            <div className="font-fraunces text-[21px] text-[#FBF7F4]">
              Komunia, powiat wrocławski
            </div>
            <div className="text-[15px] text-[#D5C7D0]">12 czerwca 2027 &nbsp;·&nbsp; 80 osób</div>
            <div className="h-[1px] bg-[#4A3D50]" />
            <div className="flex items-center gap-2.5 text-[14px] text-[#B9A8B6]">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F0A62E"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              Opis, budżet i kontakt tylko dla firm z abonamentem
            </div>
          </div>
        </div>
      </section>

      {/* Sale w okolicy Wrocławia */}
      <section id="uslugodawcy-preview" className="shrink-0 px-6 sm:px-12 md:px-[130px] py-20">
        <div className="flex items-baseline justify-between mb-[34px]">
          <h2 className="m-0 font-fraunces font-medium text-[32px]">Sale w okolicy Wrocławia</h2>
          <Link
            href="/lokale"
            className="text-[15px] font-semibold text-[#8A5405] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer"
          >
            Zobacz wszystkie
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[26px]">
          {/* Card 1 */}
          <Link
            href="/f/dwor-pod-lipami"
            className="text-left border border-[#E2D5CA] rounded-[16px] overflow-hidden bg-white flex flex-col cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="h-[180px] bg-[#E4D9CF] flex items-end p-3.5 relative">
              <span className="bg-[#FBF7F4] rounded-full px-3.5 py-[7px] text-[13px] font-semibold shadow-sm">
                Wolne soboty w czerwcu
              </span>
            </div>
            <div className="p-[22px] flex flex-col gap-2.5">
              <div className="font-fraunces text-[22px]">Dwór pod Lipami</div>
              <div className="text-[14px] text-[#6A5C70]">
                Kobierzyce &nbsp;·&nbsp; 18 km od centrum
              </div>
              <div className="flex gap-2 my-1 flex-wrap">
                <span className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[6px] px-2.5 py-1">
                  do 140 osób
                </span>
                <span className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[6px] px-2.5 py-1">
                  ogród
                </span>
                <span className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[6px] px-2.5 py-1">
                  nocleg
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-[#EFE5DD] pt-3.5 mt-2">
                <span className="text-[15px]">
                  <strong className="text-[20px] border-b-2 border-[#F0A62E]">320 zł</strong> / os.
                </span>
                <span className="text-[14px] text-[#6A5C70]">4,8 &nbsp;·&nbsp; 36 opinii</span>
              </div>
            </div>
          </Link>

          {/* Card 2 */}
          <Link
            href="/f/dwor-pod-lipami"
            className="text-left border border-[#E2D5CA] rounded-[16px] overflow-hidden bg-white flex flex-col cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="h-[180px] bg-[#DED4DC] flex items-end p-3.5">
              <span className="bg-[#FBF7F4] rounded-full px-3.5 py-[7px] text-[13px] font-semibold shadow-sm">
                Odpowiada tego samego dnia
              </span>
            </div>
            <div className="p-[22px] flex flex-col gap-2.5">
              <div className="font-fraunces text-[22px]">Stodoła Zielona Dolina</div>
              <div className="text-[14px] text-[#6A5C70]">
                Sobótka &nbsp;·&nbsp; 31 km od centrum
              </div>
              <div className="flex gap-2 my-1 flex-wrap">
                <span className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[6px] px-2.5 py-1">
                  do 90 osób
                </span>
                <span className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[6px] px-2.5 py-1">
                  parkiet
                </span>
                <span className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[6px] px-2.5 py-1">
                  bez alkoholu
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-[#EFE5DD] pt-3.5 mt-2">
                <span className="text-[15px]">
                  <strong className="text-[20px] border-b-2 border-[#F0A62E]">210 zł</strong> / os.
                </span>
                <span className="text-[14px] text-[#6A5C70]">4,6 &nbsp;·&nbsp; 12 opinii</span>
              </div>
            </div>
          </Link>

          {/* Card 3 */}
          <Link
            href="/f/dwor-pod-lipami"
            className="text-left border border-[#E2D5CA] rounded-[16px] overflow-hidden bg-white flex flex-col cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="h-[180px] bg-[#DCE0D8] flex items-end p-3.5">
              <span className="bg-[#FBF7F4] rounded-full px-3.5 py-[7px] text-[13px] font-semibold shadow-sm">
                Nowa w serwisie
              </span>
            </div>
            <div className="p-[22px] flex flex-col gap-2.5">
              <div className="font-fraunces text-[22px]">Remiza Wiejska Krzyki</div>
              <div className="text-[14px] text-[#6A5C70]">
                Żórawina &nbsp;·&nbsp; 22 km od centrum
              </div>
              <div className="flex gap-2 my-1 flex-wrap">
                <span className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[6px] px-2.5 py-1">
                  do 70 osób
                </span>
                <span className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[6px] px-2.5 py-1">
                  parking
                </span>
                <span className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[6px] px-2.5 py-1">
                  własny catering
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-[#EFE5DD] pt-3.5 mt-2">
                <span className="text-[15px]">
                  <strong className="text-[20px] border-b-2 border-[#F0A62E]">1 400 zł</strong> /
                  doba
                </span>
                <span className="text-[14px] text-[#6A5C70]">bez opinii</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Jak to działa */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] py-[74px] bg-[#F2E9E2]">
        <h2 className="m-0 mb-[38px] font-fraunces font-medium text-[32px]">Jak to działa</h2>
        <ol className="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-3 gap-10">
          <li className="flex flex-col gap-3">
            <span className="font-fraunces text-[42px] text-[#C9B5A6] leading-none">1</span>
            <span className="text-[19px] font-bold">Powiedz, czego szukasz</span>
            <span className="text-[16px] leading-[1.62] text-[#55485A]">
              Przeglądaj miejsca sam albo opisz wydarzenie i pozwól firmom się zgłosić.
            </span>
          </li>
          <li className="flex flex-col gap-3">
            <span className="font-fraunces text-[42px] text-[#C9B5A6] leading-none">2</span>
            <span className="text-[19px] font-bold">Porównaj oferty obok siebie</span>
            <span className="text-[16px] leading-[1.62] text-[#55485A]">
              Cena, zakres i wolny termin w jednej tabeli. Bez dzwonienia po dwudziestu numerach.
            </span>
          </li>
          <li className="flex flex-col gap-3">
            <span className="font-fraunces text-[42px] text-[#C9B5A6] leading-none">3</span>
            <span className="text-[19px] font-bold">Dogadaj się bezpośrednio</span>
            <span className="text-[16px] leading-[1.62] text-[#55485A]">
              Umowę i pieniądze ustalacie między sobą. Nie bierzemy prowizji od Twojego wesela.
            </span>
          </li>
        </ol>
      </section>

      {/* Po wydarzeniu */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] py-20">
        <h2 className="m-0 mb-[34px] font-fraunces font-medium text-[32px]">Po wydarzeniu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[26px]">
          <figure className="m-0 border border-[#E2D5CA] rounded-[16px] p-[26px] flex flex-col gap-4 bg-white shadow-sm">
            <blockquote className="m-0 font-fraunces text-[19px] leading-[1.55]">
              Cena z oferty zgadzała się co do złotówki z fakturą. Po dwóch poprzednich salach to
              była ulga.
            </blockquote>
            <figcaption className="text-[14px] text-[#6A5C70] leading-[1.6]">
              Anna K. &nbsp;·&nbsp; komunia, 60 osób
              <br />
              maj 2026 &nbsp;·&nbsp; zlecenie przez Gościnnie
            </figcaption>
          </figure>

          <figure className="m-0 border border-[#E2D5CA] rounded-[16px] p-[26px] flex flex-col gap-4 bg-white shadow-sm">
            <blockquote className="m-0 font-fraunces text-[19px] leading-[1.55]">
              Sześć ofert na DJ w jeden wieczór. Wybraliśmy nie najtańszą, tylko tę z najlepiej
              opisanym zakresem.
            </blockquote>
            <figcaption className="text-[14px] text-[#6A5C70] leading-[1.6]">
              Michał i Ola &nbsp;·&nbsp; wesele, 120 osób
              <br />
              sierpień 2026 &nbsp;·&nbsp; zlecenie przez Gościnnie
            </figcaption>
          </figure>

          <figure className="m-0 border border-[#E2D5CA] rounded-[16px] p-[26px] flex flex-col gap-4 bg-white shadow-sm">
            <blockquote className="m-0 font-fraunces text-[19px] leading-[1.55]">
              Szukałam sali na stypę w dwa dni. Trzy miejsca odpisały tego samego popołudnia.
            </blockquote>
            <figcaption className="text-[14px] text-[#6A5C70] leading-[1.6]">
              Barbara W. &nbsp;·&nbsp; stypa, 35 osób
              <br />
              marzec 2026 &nbsp;·&nbsp; zapytanie przez Gościnnie
            </figcaption>
          </figure>
        </div>
        <p className="mt-6 mb-0 text-[14px] text-[#6A5C70]">
          Opinię wystawia tylko osoba, której zapytanie lub zlecenie przeszło przez serwis.{" "}
          <Link
            href="/kontakt"
            className="text-[#8A5405] hover:text-[#241C2B] underline bg-transparent border-0 cursor-pointer"
          >
            Jak weryfikujemy opinie
          </Link>
        </p>
      </section>

      {/* For businesses banner */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] py-[60px] bg-[#F0A62E] flex flex-col md:flex-row items-center gap-8 md:gap-[60px]">
        <div className="grow">
          <h2 className="m-0 mb-2.5 font-fraunces font-medium text-[31px] text-[#241C2B]">
            Prowadzisz salę albo grasz na weselach?
          </h2>
          <p className="m-0 text-[17px] text-[#4A3312]">
            Stały abonament roczny zamiast płacenia za każdy kontakt. Jedno pozyskane zlecenie
            zwraca cały rok.
          </p>
        </div>
        <Link
          href="/cennik"
          className="shrink-0 text-[16px] font-bold text-[#FBF7F4] bg-[#241C2B] hover:bg-black transition-colors rounded-full px-9 py-[18px] border-0 cursor-pointer"
        >
          Zobacz cennik
        </Link>
      </section>
    </div>
  );
}

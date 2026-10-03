'use client';

import React, { useState } from 'react';
import { ScreenProps } from '../types';
import { Header } from '../Header';
import { Footer } from '../Footer';

export function LokaleScreen({ navigate, shortlist, toggleShortlist }: ScreenProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>(['Ogród']);
  const [selectedPin, setSelectedPin] = useState<number>(1);

  const filters = [
    'Ogród',
    'Nocleg',
    'Sala na wyłączność',
    'Parking',
    'Własny alkohol',
    'Bez korkowego',
    'Dostęp dla wózka',
  ];

  const toggleFilter = (f: string) => {
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((item) => item !== f) : [...prev, f]
    );
  };

  const venues = [
    {
      id: 1,
      num: 1,
      name: 'Dwór pod Lipami',
      location: 'Kobierzyce · 18 km od centrum',
      price: '180 zł',
      priceDesc: 'od, za osobę',
      tags: ['ogród', 'nocleg dla 40', 'na wyłączność'],
      details: 'do 140 osób · 12 wolnych sobót',
      bgColor: 'bg-[#E4D9CF]',
    },
    {
      id: 2,
      num: 2,
      name: 'Sala Pod Kasztanem',
      location: 'Wrocław Psie Pole · 7 km od centrum',
      price: '145 zł',
      priceDesc: 'od, za osobę',
      tags: ['parking 40 miejsc', 'własny alkohol'],
      details: 'do 90 osób · 5 wolnych sobót',
      bgColor: 'bg-[#DED4DC]',
    },
    {
      id: 3,
      num: 3,
      name: 'Folwark Zielona Brama',
      location: 'Siechnice · 14 km od centrum',
      price: '210 zł',
      priceDesc: 'od, za osobę',
      tags: ['ogród', 'dwie sale', 'nocleg dla 60'],
      details: 'do 200 osób · 3 wolne soboty',
      bgColor: 'bg-[#DCE0D8]',
    },
    {
      id: 4,
      num: 4,
      name: 'Restauracja Nad Odrą',
      location: 'Wrocław Stare Miasto · 1 km od centrum',
      price: '120 zł',
      priceDesc: 'od, za osobę',
      tags: ['taras', 'dostęp dla wózka'],
      details: 'do 60 osób · 9 wolnych sobót',
      bgColor: 'bg-[#E8DED2]',
      isImported: false,
    },
    {
      id: 5,
      num: 5,
      name: 'Stary Spichlerz (Wpis z rejestru)',
      location: 'Trzebnica · 24 km od centrum',
      price: 'Cena niepodana',
      priceDesc: 'wpis nieprzejęty',
      tags: ['import z CEIDG', 'oczekuje na weryfikację'],
      details: 'profil nieaktywny · brak cennika',
      bgColor: 'bg-[#ECE5DF]',
      isImported: true,
    },
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <Header currentScreen="Lokale" navigate={navigate} />

      {/* Breadcrumbs & Title */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-10">
        <p className="m-0 mb-4 text-[14px] text-[#6A5C70]">
          <button
            onClick={() => navigate('Main')}
            className="text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
          >
            Gościnnie
          </button>{' '}
          &nbsp;›&nbsp; Sale i lokale &nbsp;›&nbsp; Wrocław i okolice
        </p>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10">
          <div>
            <h1 className="m-0 mb-3 font-fraunces font-normal text-[36px] sm:text-[44px] md:text-[48px] tracking-tight">
              Sale i lokale we Wrocławiu
            </h1>
            <p className="m-0 text-[17px] leading-[1.6] text-[#3E3344] max-w-[62ch]">
              Obiekty, które przyjmują wesela, komunie, chrzciny, osiemnastki, przyjęcia firmowe i stypy. Każdy wpis
              prowadzi właściciel, ceny są podane od, bez prowizji dla serwisu.
            </p>
          </div>
          <div className="shrink-0 text-left md:text-right">
            <div className="font-fraunces text-[34px] font-medium">18 obiektów</div>
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6A5C70" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="5 9 12 16 19 9" />
              </svg>
            </span>
          </div>

          <div className="grow flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Miejscowość</span>
            <span className="flex items-center justify-between text-[15px] font-semibold text-[#241C2B]">
              Wrocław
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6A5C70" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="5 9 12 16 19 9" />
              </svg>
            </span>
          </div>

          <div className="grow flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Termin</span>
            <span className="flex items-center justify-between text-[15px] font-semibold text-[#241C2B]">
              czerwiec 2027
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6A5C70" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="5 9 12 16 19 9" />
              </svg>
            </span>
          </div>

          <div className="w-full lg:w-[150px] flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Liczba osób</span>
            <span className="flex items-center justify-between text-[15px] font-semibold text-[#241C2B]">
              80
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6A5C70" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="5 9 12 16 19 9" />
              </svg>
            </span>
          </div>

          <div className="w-full lg:w-[170px] flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Cena do</span>
            <span className="flex items-center justify-between text-[15px] font-semibold text-[#241C2B]">
              250 zł / os.
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6A5C70" strokeWidth="2.2" strokeLinecap="round">
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
                    ? 'font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] shadow-sm'
                    : 'text-[#3E3344] bg-white border border-[#D9CCC2] hover:border-[#241C2B]'
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
                key={venue.id}
                className={`border rounded-[18px] bg-white flex flex-col sm:flex-row overflow-hidden transition-all ${
                  selectedPin === venue.num ? 'border-[#5E7360] ring-2 ring-[#5E7360]/20' : 'border-[#E2D5CA]'
                }`}
              >
                <div className={`w-full sm:w-[272px] h-[180px] sm:h-auto shrink-0 ${venue.bgColor} relative`}>
                  <span className="absolute top-3.5 left-3.5 w-[26px] h-[26px] rounded-full bg-[#241C2B] text-[#FBF7F4] text-[13px] font-bold flex items-center justify-center shadow">
                    {venue.num}
                  </span>
                </div>

                <div className="grow p-6 flex flex-col">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <h3 className="m-0 mb-1.5 font-fraunces font-medium text-[23px]">
                        <button
                          onClick={() => navigate(venue.isImported ? 'WpisBezProfilu' : 'Profil')}
                          className="text-[#241C2B] hover:text-[#8A5405] text-left bg-transparent border-0 cursor-pointer p-0 font-inherit"
                        >
                          {venue.name}
                        </button>
                      </h3>
                      <p className="m-0 text-[14px] text-[#6A5C70]">{venue.location}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-fraunces text-[24px] font-medium">{venue.price}</div>
                      <div className="text-[13px] text-[#6A5C70]">{venue.priceDesc}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap my-3.5">
                    {venue.tags.map((t, idx) => (
                      <span key={idx} className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3 py-1.5">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-3 flex flex-wrap items-center gap-3.5 border-t border-[#EFE5DD]">
                    {venue.isImported ? (
                      <button
                        onClick={() => navigate('WpisBezProfilu')}
                        className="text-[15px] font-semibold text-[#241C2B] border-[1.5px] border-[#241C2B] rounded-[10px] px-5 py-2.5 hover:bg-[#241C2B] hover:text-white transition-colors cursor-pointer bg-transparent"
                      >
                        Zobacz wpis / Przejmij profil
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('Profil')}
                        className="text-[15px] font-semibold text-[#241C2B] border-[1.5px] border-[#241C2B] rounded-[10px] px-5 py-2.5 hover:bg-[#241C2B] hover:text-white transition-colors cursor-pointer bg-transparent"
                      >
                        Zapytaj o ofertę
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleShortlist(venue.name)}
                      className={`text-[15px] bg-transparent border-0 border-b pb-0.5 cursor-pointer transition-colors ${
                        isShortlisted
                          ? 'text-[#3F5142] font-semibold border-[#3F5142]'
                          : 'text-[#3E3344] border-[#D9CCC2] hover:text-[#241C2B]'
                      }`}
                    >
                      {isShortlisted ? '✓ Na krótkiej liście' : 'Dodaj do krótkiej listy'}
                    </button>
                    <span className="ml-auto text-[13px] text-[#6A5C70]">{venue.details}</span>
                  </div>
                </div>
              </article>
            );
          })}

          <div className="border border-dashed border-[#D9CCC2] rounded-[16px] p-[26px] text-center bg-[#FBF7F4]">
            <p className="m-0 mb-3.5 text-[15px] text-[#3E3344]">
              Pokażemy kolejne czternaście obiektów. Lista jest renderowana po stronie serwera, żeby każdy wpis miał swój
              adres i był widoczny w wyszukiwarce.
            </p>
            <button
              onClick={() => alert('Wszystkie 18 obiektów z bazy jest załadowanych w tym prototypie.')}
              className="text-[15px] font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] rounded-[10px] px-6 py-3 cursor-pointer"
            >
              Pokaż następne 14
            </button>
          </div>
        </div>

        {/* Aside: Map and Shortlist */}
        <aside className="w-full lg:w-[422px] shrink-0">
          <div className="border border-[#D9CCC2] rounded-[18px] overflow-hidden bg-white shadow-sm">
            <div className="p-4 sm:px-5 border-b border-[#EFE5DD] flex items-center justify-between">
              <span className="text-[14px] font-semibold">Mapa obiektów</span>
              <span className="text-[13px] text-[#6A5C70]">18 pinezek</span>
            </div>

            <div className="relative h-[470px] bg-[#E7EDE7] overflow-hidden">
              {/* Map grid lines */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(94,115,96,0.10) 1px, transparent 1px) 0 0 / 46px 46px, linear-gradient(0deg, rgba(94,115,96,0.10) 1px, transparent 1px) 0 0 / 46px 46px',
                }}
              />
              {/* Odra river representation */}
              <div className="absolute -left-10 top-[180px] w-[520px] h-[46px] bg-[#D7E2EA] -rotate-12" />

              {/* City Center marker */}
              <span className="absolute left-[196px] top-[214px] w-3.5 h-3.5 rounded-full border-[3px] border-[#241C2B] bg-[#FBF7F4] shadow" />
              <span className="absolute left-[182px] top-[236px] text-[12px] font-bold text-[#241C2B]">
                Wrocław
              </span>

              {/* Pin 1 - Dwór pod Lipami */}
              <button
                type="button"
                onClick={() => setSelectedPin(1)}
                className={`absolute left-[140px] top-[318px] w-8 h-8 rounded-full rounded-br-[2px] text-[#FBF7F4] text-[13px] font-bold flex items-center justify-center -rotate-45 cursor-pointer border-0 shadow-md transition-transform hover:scale-110 ${
                  selectedPin === 1 ? 'bg-[#5E7360]' : 'bg-[#241C2B]'
                }`}
              >
                <span className="rotate-45">1</span>
              </button>

              {/* Pin 2 - Sala Pod Kasztanem */}
              <button
                type="button"
                onClick={() => setSelectedPin(2)}
                className={`absolute left-[252px] top-[96px] w-8 h-8 rounded-full rounded-br-[2px] text-[#FBF7F4] text-[13px] font-bold flex items-center justify-center -rotate-45 cursor-pointer border-0 shadow-md transition-transform hover:scale-110 ${
                  selectedPin === 2 ? 'bg-[#5E7360]' : 'bg-[#241C2B]'
                }`}
              >
                <span className="rotate-45">2</span>
              </button>

              {/* Pin 3 - Folwark Zielona Brama */}
              <button
                type="button"
                onClick={() => setSelectedPin(3)}
                className={`absolute left-[96px] top-[128px] w-8 h-8 rounded-full rounded-br-[2px] text-[#FBF7F4] text-[13px] font-bold flex items-center justify-center -rotate-45 cursor-pointer border-0 shadow-md transition-transform hover:scale-110 ${
                  selectedPin === 3 ? 'bg-[#5E7360]' : 'bg-[#241C2B]'
                }`}
              >
                <span className="rotate-45">3</span>
              </button>

              {/* Pin 4 - Nad Odrą */}
              <button
                type="button"
                onClick={() => setSelectedPin(4)}
                className={`absolute left-[300px] top-[286px] w-8 h-8 rounded-full rounded-br-[2px] text-[#FBF7F4] text-[13px] font-bold flex items-center justify-center -rotate-45 cursor-pointer border-0 shadow-md transition-transform hover:scale-110 ${
                  selectedPin === 4 ? 'bg-[#5E7360]' : 'bg-[#241C2B]'
                }`}
              >
                <span className="rotate-45">4</span>
              </button>

              {/* Pin 5 */}
              <button
                type="button"
                onClick={() => setSelectedPin(5)}
                className={`absolute left-[338px] top-[182px] w-8 h-8 rounded-full rounded-br-[2px] text-[#FBF7F4] text-[13px] font-bold flex items-center justify-center -rotate-45 cursor-pointer border-0 shadow-md transition-transform hover:scale-110 ${
                  selectedPin === 5 ? 'bg-[#5E7360]' : 'bg-[#241C2B]'
                }`}
              >
                <span className="rotate-45">5</span>
              </button>

              {/* Map legend */}
              <div className="absolute left-4 bottom-4 bg-white border border-[#D9CCC2] rounded-[12px] p-3 shadow-md">
                <div className="text-[12px] text-[#6A5C70] mb-1.5">Kliknij pinezkę, żeby podświetlić wpis na liście</div>
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="w-[11px] h-[11px] rounded-[3px] bg-[#5E7360]" />
                  podglądany obiekt
                  <span className="w-[11px] h-[11px] rounded-[3px] bg-[#241C2B] ml-2.5" />
                  pozostałe
                </div>
              </div>
            </div>

            <div className="p-4 sm:px-5 border-t border-[#EFE5DD] text-[13px] leading-[1.6] text-[#6A5C70]">
              Mapa jest dodatkiem do listy. Lista działa bez mapy, bo od niej zależy widoczność w wyszukiwarce.
            </div>
          </div>

          {/* Shortlist widget */}
          <div className="mt-[18px] border border-[#E2D5CA] rounded-[18px] bg-[#F2E9E2] p-[22px]">
            <div className="text-[16px] font-bold mb-2">Krótka lista ({shortlist.length})</div>
            <p className="m-0 mb-3.5 text-[14px] leading-[1.65] text-[#55485A]">
              Odkładaj obiekty na boku i wyślij jedno zapytanie do wszystkich naraz. Dopiero wtedy firma widzi Twoje dane
              kontaktowe.
            </p>
            <div className="flex gap-2 flex-wrap">
              {shortlist.map((name, i) => (
                <span
                  key={i}
                  title={name}
                  className="w-11 h-11 rounded-[10px] bg-[#E4D9CF] border border-[#241C2B]/20 flex items-center justify-center font-bold text-[12px] text-[#241C2B]"
                >
                  {name.charAt(0)}
                </span>
              ))}
              {Array.from({ length: Math.max(0, 4 - shortlist.length) }).map((_, i) => (
                <span key={i} className="w-11 h-11 rounded-[10px] border border-dashed border-[#D9CCC2]" />
              ))}
            </div>
            {shortlist.length > 0 && (
              <button
                onClick={() => navigate('Zapytanie')}
                className="mt-3.5 w-full text-[14px] font-semibold text-[#241C2B] bg-white border border-[#241C2B] rounded-[8px] py-2 cursor-pointer hover:bg-[#241C2B] hover:text-white transition-colors"
              >
                Wyślij zapytanie do listy ({shortlist.length})
              </button>
            )}
          </div>
        </aside>
      </section>

      {/* Direct Order CTA */}
      <section className="shrink-0 mx-6 sm:mx-12 md:mx-[130px] mt-11 border border-[#E2D5CA] rounded-[20px] bg-white p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-sm">
        <div className="grow">
          <h2 className="m-0 mb-2.5 font-fraunces font-medium text-[27px]">Nie chcesz przeglądać osiemnastu profili?</h2>
          <p className="m-0 text-[16px] leading-[1.65] text-[#3E3344] max-w-[70ch]">
            Opisz raz, czego szukasz. Zlecenie trafia do sal, które mają wolny termin i mieszczą Twoją liczbę gości.
            Odpowiedzi dostajesz na skrzynkę, bez podawania numeru telefonu.
          </p>
        </div>
        <button
          onClick={() => navigate('NoweZlecenie')}
          className="shrink-0 text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-8 py-4 cursor-pointer"
        >
          Wystaw zlecenie
        </button>
      </section>

      {/* Przeglądaj dalej */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] py-12">
        <h2 className="m-0 mb-5 text-[14px] font-bold tracking-wider uppercase text-[#55485A]">Przeglądaj dalej</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-9 gap-y-3">
          {[
            'Sale weselne Wrocław',
            'Sale na komunię Wrocław',
            'Sale na chrzciny Wrocław',
            'Sale na osiemnastkę Wrocław',
            'Sale na stypy Wrocław',
            'Sale firmowe Wrocław',
            'Sale z ogrodem Wrocław',
            'Sale z noclegiem Wrocław',
            'Sale weselne Kraków',
            'Sale weselne Poznań',
            'Sale weselne Warszawa',
            'Sale weselne Gdańsk',
          ].map((tag, idx) => (
            <button
              key={idx}
              onClick={() => navigate('Lokale')}
              className="text-left text-[15px] text-[#3E3344] hover:text-[#8A5405] py-2 border-b border-[#EFE5DD] bg-transparent border-t-0 border-x-0 cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      <Footer navigate={navigate} />
    </div>
  );
}

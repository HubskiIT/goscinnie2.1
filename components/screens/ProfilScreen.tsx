'use client';

import React, { useState } from 'react';
import { ScreenProps } from '../types';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { ReviewsSection } from '../ReviewsSection';

export function ProfilScreen({ navigate }: ScreenProps) {
  const [selectedOccasion, setSelectedOccasion] = useState('Komunia');
  const [selectedDate, setSelectedDate] = useState('12.06.2027');
  const [selectedGuests, setSelectedGuests] = useState('80');
  const [activeTab, setActiveTab] = useState('przeglad');

  const tabs = [
    { id: 'przeglad', label: 'Przegląd' },
    { id: 'cennik', label: 'Cennik' },
    { id: 'pojemnosc', label: 'Pojemność i udogodnienia' },
    { id: 'terminy', label: 'Terminy' },
    { id: 'zdjecia', label: 'Zdjęcia' },
    { id: 'pytania', label: 'Pytania (FAQ)' },
    { id: 'dojazd', label: 'Dojazd' },
    { id: 'opinie', label: 'Opinie' },
    { id: 'imprezy', label: 'Imprezy w obiekcie' },
  ];

  // Calendar dates
  const calendarDays = [
    { day: 1, state: 'wolny' },
    { day: 2, state: 'wolny' },
    { day: 3, state: 'wolny' },
    { day: 4, state: 'zajety' },
    { day: 5, state: 'wolny' },
    { day: 6, state: 'sobota-wolna' },
    { day: 7, state: 'wolny' },
    { day: 8, state: 'wolny' },
    { day: 9, state: 'zajety' },
    { day: 10, state: 'wolny' },
    { day: 11, state: 'wolny' },
    { day: 12, state: 'wolny' },
    { day: 13, state: 'sobota-wolna' },
    { day: 14, state: 'wolny' },
    { day: 15, state: 'wolny' },
    { day: 16, state: 'wolny' },
    { day: 17, state: 'wolny' },
    { day: 18, state: 'wolny' },
    { day: 19, state: 'sobota-wolna' },
    { day: 20, state: 'wolny' },
    { day: 21, state: 'wolny' },
  ];

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <Header currentScreen="Profil" navigate={navigate} />

      {/* Breadcrumb */}
      <div className="px-6 md:px-[110px] pt-4 text-[14px] text-[#6A5C70]">
        <button
          onClick={() => navigate('Lokale')}
          className="text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
        >
          Sale weselne i lokale
        </button>{' '}
        &nbsp;›&nbsp; Wrocław i okolice &nbsp;›&nbsp; Dwór pod Lipami
      </div>

      {/* Photo Gallery Mosaic */}
      <div id="zdjecia" className="shrink-0 h-[260px] sm:h-[340px] grid grid-cols-2 md:grid-cols-4 gap-1.5 px-6 md:px-[110px] box-border mt-4">
        <div className="col-span-2 bg-[#E4D9CF] rounded-l-[16px] relative flex items-end p-4">
          <span className="text-[13px] font-semibold bg-white/90 backdrop-blur px-3.5 py-1.5 rounded-full text-[#241C2B] shadow-xs">
            Fasada dworu i park zabytkowy (Kobierzyce)
          </span>
        </div>
        <div className="grid grid-rows-2 gap-1.5">
          <div className="bg-[#DED4DC] relative flex items-end p-3">
            <span className="text-[11px] font-semibold bg-white/80 px-2.5 py-1 rounded">Sala balowa (do 140 osób)</span>
          </div>
          <div className="bg-[#DCE0D8] relative flex items-end p-3">
            <span className="text-[11px] font-semibold bg-white/80 px-2.5 py-1 rounded">Altana w ogrodzie</span>
          </div>
        </div>
        <div className="grid grid-rows-2 gap-1.5">
          <div className="bg-[#E8DED2] rounded-tr-[16px] relative flex items-end p-3">
            <span className="text-[11px] font-semibold bg-white/80 px-2.5 py-1 rounded">Pokoje gościnne</span>
          </div>
          <div className="bg-[#D9CCC2] rounded-br-[16px] flex items-end justify-end p-4">
            <span className="bg-[#FBF7F4] rounded-full px-4 py-2 text-[13px] font-semibold shadow-xs cursor-pointer hover:bg-white transition-colors">
              Zobacz wszystkie 24 zdjęcia →
            </span>
          </div>
        </div>
      </div>

      {/* 9 Anchor Tabs Navigation Bar (Sticky) */}
      <div className="sticky top-0 z-20 bg-[#FBF7F4]/95 backdrop-blur border-y border-[#E2D5CA] px-6 md:px-[110px] mt-6 shadow-2xs overflow-x-auto">
        <nav className="flex space-x-1 sm:space-x-2 py-2 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={`px-3.5 py-2 rounded-[10px] text-[14px] font-semibold cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#241C2B] text-white shadow-2xs'
                  : 'text-[#6A5C70] hover:text-[#241C2B] hover:bg-[#F2E9E2]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content & Sticky Inquiry Sidebar */}
      <div className="grow px-6 sm:px-12 md:px-[110px] pt-8 flex flex-col lg:flex-row gap-10 md:gap-14 pb-20">
        <main className="grow w-full space-y-12">
          {/* Section 1: Przegląd */}
          <section id="przeglad" className="scroll-mt-20">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="text-[12px] font-bold tracking-wider uppercase text-[#5E7360] bg-[#E7EDE7] px-3 py-1 rounded-full">
                Zweryfikowany lokal · Klasa A
              </span>
              <span className="text-[13px] text-[#55485A]">ID obiektu: GOS-LOK-012</span>
            </div>

            <h1 className="m-0 mb-3 font-fraunces font-normal text-[36px] sm:text-[46px] tracking-tight">
              Dwór pod Lipami
            </h1>
            <p className="m-0 mb-5 text-[16px] text-[#6A5C70]">
              Kobierzyce, 18 km od centrum Wrocławia (powiat wrocławski) &nbsp;·&nbsp;{' '}
              <a
                href="#opinie"
                onClick={(e) => { e.preventDefault(); scrollToSection('opinie'); }}
                className="text-[#8A5405] hover:text-[#241C2B] font-semibold underline"
              >
                ★ 4,8 (36 zweryfikowanych opinii)
              </a>{' '}
              &nbsp;·&nbsp; Odpowiada średnio w 3,5 godziny
            </p>

            <div className="flex gap-2 flex-wrap mb-6">
              <span className="text-[14px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3 py-1.5">do 140 osób</span>
              <span className="text-[14px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3 py-1.5">sala na wyłączność</span>
              <span className="text-[14px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3 py-1.5">ogród 1,5 ha</span>
              <span className="text-[14px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3 py-1.5">parking 60 aut</span>
              <span className="text-[14px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3 py-1.5">nocleg dla 40 osób</span>
              <span className="text-[14px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3 py-1.5">klimatyzacja</span>
              <span className="text-[14px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3 py-1.5">brak korkowego</span>
            </div>

            <h2 className="m-0 mb-3 font-fraunces font-medium text-[24px]">O obiekcie</h2>
            <p className="m-0 text-[16px] leading-[1.75] text-[#3E3344] max-w-[70ch]">
              Dwór z 1902 roku z salą balową na 140 osób i osobną salą kameralną na 40 gości. Prowadzimy obiekt rodzinnie od
              czternastu lat. Obsługujemy wesela, komunie, chrzciny, jubileusze i przyjęcia firmowe. Menu ustalamy indywidualnie,
              dopuszczamy własny tort bez opłat oraz własny alkohol bez korkowego. Obiekt otacza stary park z aleją lipową i zadaszoną altaną na śluby plenerowe.
            </p>
          </section>

          {/* Section 2: Cennik */}
          <section id="cennik" className="scroll-mt-20 border-t border-[#E2D5CA] pt-10">
            <h2 className="m-0 mb-3 font-fraunces font-medium text-[26px]">Cennik usług (ceny jawne)</h2>
            <p className="text-[15px] text-[#6A5C70] mb-5">
              Ceny nie zawierają ukrytych kosztów serwisu. Rozliczenie i umowa podpisywane są bezpośrednio z nami.
            </p>

            <div className="border border-[#E2D5CA] rounded-[16px] overflow-hidden bg-white shadow-xs">
              <div className="grid grid-cols-4 p-3.5 px-5 bg-[#F2E9E2] text-[13px] font-bold text-[#55485A]">
                <span className="col-span-2">Rodzaj przyjęcia / opcja</span>
                <span>Cena od</span>
                <span>Jednostka</span>
              </div>
              <div className="grid grid-cols-4 p-4 px-5 border-t border-[#EFE5DD] text-[15px]">
                <span className="col-span-2 font-medium">Wesele (pełne menu z ciepłymi daniami i deserami)</span>
                <strong className="font-bold text-[#241C2B]">320 zł</strong>
                <span className="text-[#6A5C70]">osoba</span>
              </div>
              <div className="grid grid-cols-4 p-4 px-5 border-t border-[#EFE5DD] text-[15px]">
                <span className="col-span-2 font-medium">Komunia i chrzciny (obiad 3 dania + bufet zimny)</span>
                <strong className="font-bold text-[#241C2B]">180 zł</strong>
                <span className="text-[#6A5C70]">osoba</span>
              </div>
              <div className="grid grid-cols-4 p-4 px-5 border-t border-[#EFE5DD] text-[15px]">
                <span className="col-span-2 font-medium">Urodziny / jubileusz (wieczór od 18:00)</span>
                <strong className="font-bold text-[#241C2B]">165 zł</strong>
                <span className="text-[#6A5C70]">osoba</span>
              </div>
              <div className="grid grid-cols-4 p-4 px-5 border-t border-[#EFE5DD] text-[15px]">
                <span className="col-span-2 font-medium">Wynajem sali na wyłączność (imprezy firmowe, doba)</span>
                <strong className="font-bold text-[#241C2B]">4 500 zł</strong>
                <span className="text-[#6A5C70]">doba</span>
              </div>
              <div className="grid grid-cols-4 p-4 px-5 border-t border-[#EFE5DD] text-[15px]">
                <span className="col-span-2 font-medium">Nocleg ze śniadaniem (dla gości weselnych)</span>
                <strong className="font-bold text-[#241C2B]">150 zł</strong>
                <span className="text-[#6A5C70]">osoba / doba</span>
              </div>
            </div>
          </section>

          {/* Section 3: Pojemność i udogodnienia */}
          <section id="pojemnosc" className="scroll-mt-20 border-t border-[#E2D5CA] pt-10">
            <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">Pojemność i wyposażenie</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="border border-[#E2D5CA] bg-white rounded-[14px] p-5 shadow-2xs">
                <div className="text-[13px] text-[#6A5C70] mb-1">Miejsca siedzące</div>
                <div className="text-[24px] font-bold text-[#241C2B]">30 – 140 osób</div>
                <div className="text-[13px] text-[#55485A]">stoły okrągłe lub tradycyjne</div>
              </div>
              <div className="border border-[#E2D5CA] bg-white rounded-[14px] p-5 shadow-2xs">
                <div className="text-[13px] text-[#6A5C70] mb-1">Liczba sal</div>
                <div className="text-[24px] font-bold text-[#241C2B]">2 osobne sale</div>
                <div className="text-[13px] text-[#55485A]">Balowa (140) + Kameralna (40)</div>
              </div>
              <div className="border border-[#E2D5CA] bg-white rounded-[14px] p-5 shadow-2xs">
                <div className="text-[13px] text-[#6A5C70] mb-1">Noclegi na miejscu</div>
                <div className="text-[24px] font-bold text-[#241C2B]">40 miejsc</div>
                <div className="text-[13px] text-[#55485A]">apartament nowożeńców gratis</div>
              </div>
            </div>

            <h3 className="font-fraunces text-[20px] font-medium mb-3">Udogodnienia obiektu</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[14px] text-[#3E3344]">
              <div className="flex items-center gap-2.5 p-3 rounded-[10px] bg-white border border-[#E2D5CA]">
                <span className="text-[#5E7360] font-bold">✓</span> Osobna sala na wyłączność
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-[10px] bg-white border border-[#E2D5CA]">
                <span className="text-[#5E7360] font-bold">✓</span> Ogród i altana plenerowa
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-[10px] bg-white border border-[#E2D5CA]">
                <span className="text-[#5E7360] font-bold">✓</span> Bezpłatny parking na 60 aut
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-[10px] bg-white border border-[#E2D5CA]">
                <span className="text-[#5E7360] font-bold">✓</span> Wydajna klimatyzacja
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-[10px] bg-white border border-[#E2D5CA]">
                <span className="text-[#5E7360] font-bold">✓</span> Drewniany parkiet taneczny
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-[10px] bg-white border border-[#E2D5CA]">
                <span className="text-[#5E7360] font-bold">✓</span> Własny alkohol bez korkowego
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-[10px] bg-white border border-[#E2D5CA]">
                <span className="text-[#5E7360] font-bold">✓</span> Opcja wesela bezalkoholowego
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-[10px] bg-white border border-[#E2D5CA]">
                <span className="text-[#5E7360] font-bold">✓</span> Dostęp dla wózków inwalidzkich
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-[10px] bg-white border border-[#E2D5CA]">
                <span className="text-[#5E7360] font-bold">✓</span> Kącik zabaw i animacji dla dzieci
              </div>
            </div>
          </section>

          {/* Section 4: Terminy */}
          <section id="terminy" className="scroll-mt-20 border-t border-[#E2D5CA] pt-10">
            <h2 className="m-0 mb-3 font-fraunces font-medium text-[26px]">Kalendarz wolnych sobót i terminów (Czerwiec 2027)</h2>
            <p className="text-[15px] text-[#6A5C70] mb-5">
              Poniższy kalendarz jest na bieżąco synchronizowany. Żółte pole oznacza wolną sobotę w sezonie.
            </p>

            <div className="border border-[#E2D5CA] rounded-[16px] bg-white p-6 max-w-[520px] shadow-xs mb-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-[16px]">Czerwiec 2027</span>
                <span className="text-[13px] text-[#5E7360] font-semibold bg-[#E7EDE7] px-2.5 py-1 rounded">
                  3 wolne soboty
                </span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {['pn', 'wt', 'śr', 'cz', 'pt', 'sb', 'nd'].map((d) => (
                  <span key={d} className="text-[12px] font-bold text-[#6A5C70] text-center pb-1">
                    {d}
                  </span>
                ))}
                {calendarDays.map((item) => {
                  if (item.state === 'sobota-wolna') {
                    return (
                      <span
                        key={item.day}
                        title="Wolna sobota!"
                        className="h-10 rounded-[8px] bg-[#F0A62E] text-[#241C2B] font-bold flex items-center justify-center text-[14px] shadow-xs cursor-pointer hover:bg-[#e29922]"
                      >
                        {item.day}
                      </span>
                    );
                  }
                  if (item.state === 'zajety') {
                    return (
                      <span
                        key={item.day}
                        title="Termin zajęty"
                        className="h-10 rounded-[8px] bg-[#EDE6E9] text-[#8B7F91] flex items-center justify-center text-[14px] line-through cursor-not-allowed"
                      >
                        {item.day}
                      </span>
                    );
                  }
                  return (
                    <span
                      key={item.day}
                      className="h-10 rounded-[8px] bg-white border border-[#E2D5CA] flex items-center justify-center text-[14px] hover:border-[#241C2B] cursor-pointer"
                    >
                      {item.day}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-6 text-[13px] text-[#6A5C70]">
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-[#F0A62E]" /> Wolna sobota
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-white border border-[#E2D5CA]" /> Wolny dzień roboczy / niedziela
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-[#EDE6E9] line-through text-[10px] flex items-center justify-center" /> Zajęty
              </span>
            </div>
          </section>

          {/* Section 6: FAQ */}
          <section id="pytania" className="scroll-mt-20 border-t border-[#E2D5CA] pt-10">
            <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">Najczęściej zadawane pytania (FAQ)</h2>
            <div className="space-y-3.5 max-w-[72ch]">
              <div className="border border-[#E2D5CA] rounded-[14px] bg-white p-5 shadow-2xs">
                <h3 className="font-bold text-[16px] text-[#241C2B] mb-1.5">Czy można wnieść własny alkohol?</h3>
                <p className="text-[14px] text-[#55485A] leading-[1.6] m-0">
                  Tak, umożliwiamy wniesienie własnych napojów alkoholowych i bezalkoholowych bez opłaty korkowej.
                  Zapewniamy bezpłatne szkło, lód i schłodzenie przed imprezą.
                </p>
              </div>
              <div className="border border-[#E2D5CA] rounded-[14px] bg-white p-5 shadow-2xs">
                <h3 className="font-bold text-[16px] text-[#241C2B] mb-1.5">Czy jest opłata za krojenie własnego tortu?</h3>
                <p className="text-[14px] text-[#55485A] leading-[1.6] m-0">
                  Nie pobieramy żadnych opłat za krojenie tortu dostarczonego przez wybraną przez Państwa cukiernię.
                  Wymagany jest jedynie certyfikat zgodności sanitarno-epidemiologicznej od dostawcy.
                </p>
              </div>
              <div className="border border-[#E2D5CA] rounded-[14px] bg-white p-5 shadow-2xs">
                <h3 className="font-bold text-[16px] text-[#241C2B] mb-1.5">Do której godziny może trwać przyjęcie?</h3>
                <p className="text-[14px] text-[#55485A] leading-[1.6] m-0">
                  Wesela trwają standardowo do godziny 5:00 rano. Przyjęcia komunijne i chrzciny kończą się zwykle
                  do godziny 20:00–21:00. Istnieje możliwość przedłużenia za dodatkową opłatą ryczałtową za każdą godzinę.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Dojazd */}
          <section id="dojazd" className="scroll-mt-20 border-t border-[#E2D5CA] pt-10">
            <h2 className="m-0 mb-3 font-fraunces font-medium text-[26px]">Lokalizacja i dojazd</h2>
            <p className="text-[15px] text-[#6A5C70] mb-5">
              Dwór pod Lipami, ul. Pałacowa 4, 55-040 Kobierzyce · 18 km na południe od centrum Wrocławia (trasa DK8 / S8).
            </p>

            <div className="border border-[#E2D5CA] rounded-[18px] overflow-hidden bg-[#F2E9E2] relative h-[260px] flex items-center justify-center p-6 shadow-xs">
              <div className="text-center z-10 bg-white/95 backdrop-blur rounded-[16px] p-6 max-w-[420px] shadow-sm border border-[#E2D5CA]">
                <div className="w-8 h-8 rounded-full bg-[#F0A62E] text-[#241C2B] font-bold flex items-center justify-center mx-auto mb-2 text-[14px]">
                  📍
                </div>
                <div className="font-fraunces font-medium text-[18px] mb-1">Dwór pod Lipami</div>
                <div className="text-[13px] text-[#6A5C70] mb-3">ul. Pałacowa 4, 55-040 Kobierzyce</div>
                <div className="inline-block text-[12px] font-semibold text-[#5E7360] bg-[#E7EDE7] px-3 py-1 rounded-full">
                  Dojazd z Bielan Wrocławskich: 12 min
                </div>
              </div>
            </div>
          </section>

          {/* Section 8: Opinie */}
          <section id="opinie" className="scroll-mt-20 border-t border-[#E2D5CA] pt-10">
            <ReviewsSection navigate={navigate} venueName="Dwór pod Lipami" />
          </section>

          {/* Section 9: Imprezy w obiekcie */}
          <section id="imprezy" className="scroll-mt-20 border-t border-[#E2D5CA] pt-10">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="m-0 mb-1.5 font-fraunces font-medium text-[26px]">Nadchodzące imprezy w tym obiekcie</h2>
                <p className="text-[15px] text-[#6A5C70] m-0">
                  Otwarte wieczory tematyczne i bale organizowane przez Dwór pod Lipami.
                </p>
              </div>
              <button
                onClick={() => navigate('Imprezy')}
                className="text-[14px] text-[#6A5C70] hover:text-[#241C2B] underline bg-transparent border-0 cursor-pointer"
              >
                Wszystkie imprezy →
              </button>
            </div>

            <div className="border border-[#E2D5CA] rounded-[16px] bg-white p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
              <div>
                <span className="text-[12px] font-semibold text-[#5E7360] bg-[#E7EDE7] px-2.5 py-0.5 rounded mb-1.5 inline-block">
                  Andrzejki
                </span>
                <h3 className="font-fraunces text-[20px] font-medium m-0 mb-1">Andrzejki pod Lipami z muzyką na żywo</h3>
                <p className="text-[14px] text-[#6A5C70] m-0">28 listopada 2026, godz. 19:00 · Kolacja 3 dania + zabawa z DJ-em</p>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                <div className="text-[18px] font-bold text-[#241C2B]">220 zł <span className="text-[12px] font-normal text-[#6A5C70]">/ osoba</span></div>
                <button
                  onClick={() => navigate('Impreza')}
                  className="text-[13px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[8px] px-4 py-2 cursor-pointer shadow-2xs"
                >
                  Zobacz szczegóły i zapytaj
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* Right Sticky Enquiry Sidebar (Desktop) */}
        <aside className="w-full lg:w-[360px] shrink-0 sticky top-24 self-start">
          <div className="border border-[#D9CCC2] rounded-[20px] p-6 sm:p-7 bg-white flex flex-col gap-4 shadow-sm">
            <div className="text-[15px] text-[#6A5C70]">
              Cena od{' '}
              <strong className="font-fraunces text-[32px] text-[#241C2B] font-medium">180 zł</strong> za osobę
            </div>
            <div className="h-[1px] bg-[#EFE5DD]" />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="profil-okazja" className="text-[13px] text-[#6A5C70]">
                Okazja
              </label>
              <input
                id="profil-okazja"
                type="text"
                value={selectedOccasion}
                onChange={(e) => setSelectedOccasion(e.target.value)}
                className="border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3 text-[15px] font-semibold text-[#241C2B] bg-transparent outline-none focus:border-[#241C2B]"
              />
            </div>

            <div className="flex gap-2.5">
              <div className="grow flex flex-col gap-1.5">
                <label htmlFor="profil-termin" className="text-[13px] text-[#6A5C70]">
                  Termin
                </label>
                <input
                  id="profil-termin"
                  type="text"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3 text-[15px] font-semibold text-[#241C2B] bg-transparent outline-none focus:border-[#241C2B]"
                />
              </div>
              <div className="w-[110px] flex flex-col gap-1.5">
                <label htmlFor="profil-osoby" className="text-[13px] text-[#6A5C70]">
                  Osób
                </label>
                <input
                  id="profil-osoby"
                  type="text"
                  value={selectedGuests}
                  onChange={(e) => setSelectedGuests(e.target.value)}
                  className="border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3 text-[15px] font-semibold text-[#241C2B] bg-transparent outline-none focus:border-[#241C2B]"
                />
              </div>
            </div>

            <div className="pt-2">
              <p className="m-0 mb-2.5 text-[12px] text-[#6A5C70] text-center font-medium">
                ✓ Zapytanie jest w 100% bezpłatne i nie zobowiązuje
              </p>
              <button
                type="button"
                onClick={() => navigate('Zapytanie')}
                className="w-full text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] p-4 cursor-pointer shadow-sm text-center"
              >
                Zapytaj o ofertę
              </button>
            </div>

            <p className="m-0 text-[12px] leading-[1.5] text-[#8B7F91] text-center">
              Ten sam formularz możesz wysłać do maksymalnie 5 firm naraz jednym kliknięciem.
            </p>
          </div>

          <div className="mt-4 border border-[#E2D5CA] rounded-[16px] p-4.5 bg-[#F2E9E2] flex gap-3 items-center">
            <span className="w-8 h-8 rounded-full bg-[#5E7360] text-white flex items-center justify-center font-bold text-[14px] shrink-0">
              ✓
            </span>
            <div>
              <div className="text-[14px] font-bold text-[#241C2B]">Zweryfikowany lokal</div>
              <div className="text-[12px] text-[#55485A]">
                NIP sprawdzony w wykazie VAT, numer telefonu potwierdzony kodem SMS.
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky Bottom Bar on Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E2D5CA] p-3 px-6 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-[12px] text-[#6A5C70]">Cena od</span>
          <div className="font-fraunces text-[20px] font-bold text-[#241C2B]">180 zł <span className="text-[12px] font-normal text-[#6A5C70]">/ osoba</span></div>
        </div>
        <button
          onClick={() => navigate('Zapytanie')}
          className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[10px] px-6 py-3 cursor-pointer shadow-xs"
        >
          Zapytaj o ofertę
        </button>
      </div>

      <Footer navigate={navigate} />
    </div>
  );
}

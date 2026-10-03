'use client';

import React, { useState } from 'react';
import { ScreenProps } from '../types';
import { Header } from '../Header';
import { Footer } from '../Footer';

export function ImprezaScreen({ navigate }: ScreenProps) {
  const [ticketCount, setTicketCount] = useState(2);
  const [tableType, setTableType] = useState('wspólny');

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <Header currentScreen="Impreza" navigate={navigate} />

      {/* Breadcrumb & Gallery */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-8">
        <p className="m-0 mb-4 text-[14px] text-[#6A5C70]">
          <button
            onClick={() => navigate('Imprezy')}
            className="text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
          >
            Imprezy
          </button>{' '}
          &nbsp;›&nbsp;{' '}
          <button
            onClick={() => navigate('Imprezy')}
            className="text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
          >
            Andrzejki
          </button>{' '}
          &nbsp;›&nbsp; Wrocław i okolice
        </p>

        <div className="h-[240px] sm:h-[300px] grid grid-cols-3 gap-1.5 rounded-[16px] overflow-hidden">
          <div className="col-span-2 bg-[#E4D9CF]" />
          <div className="grid grid-rows-2 gap-1.5">
            <div className="bg-[#DED4DC]" />
            <div className="bg-[#DCE0D8]" />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="grow px-6 sm:px-12 md:px-[130px] pt-8 flex flex-col lg:flex-row gap-10 lg:gap-14 items-start pb-16">
        <main className="grow w-full">
          <div className="flex items-center gap-3 mb-3.5 flex-wrap">
            <span className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3 py-1.5 font-medium">
              Andrzejki
            </span>
            <span className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3 py-1.5 font-medium">
              sobota
            </span>
            <span className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3 py-1.5 font-medium">
              dla dorosłych
            </span>
          </div>

          <h1 className="m-0 mb-3 font-fraunces font-normal text-[36px] sm:text-[46px] tracking-tight">
            Andrzejki pod Lipami
          </h1>
          <p className="m-0 mb-8 text-[17px] text-[#6A5C70]">
            29 listopada 2026, 19:00 do 3:00 &nbsp;·&nbsp;{' '}
            <button
              onClick={() => navigate('Profil')}
              className="text-[#8A5405] hover:text-[#241C2B] underline bg-transparent border-0 cursor-pointer p-0 font-inherit"
            >
              Dwór pod Lipami
            </button>
            , Kobierzyce, 18 km od centrum Wrocławia
          </p>

          <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">O imprezie</h2>
          <p className="m-0 mb-8 text-[16px] leading-[1.72] text-[#3E3344] max-w-[68ch]">
            Wieczór w sali balowej, z kolacją zasiadaną i muzyką do trzeciej. Wróżby prowadzi para aktorów, lanie wosku
            na starym sprzęcie, bez elektroniki. Sala jest tego wieczoru tylko dla uczestników tej imprezy.
          </p>

          <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">Co jest w cenie</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-7 gap-y-3 mb-9 max-w-[72ch]">
            <div className="flex gap-2.5 items-center text-[15px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5E7360" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 12 10 18 20 6" />
              </svg>
              Kolacja zasiadana, trzy dania
            </div>
            <div className="flex gap-2.5 items-center text-[15px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5E7360" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 12 10 18 20 6" />
              </svg>
              Bufet słodki i kawa przez cały wieczór
            </div>
            <div className="flex gap-2.5 items-center text-[15px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5E7360" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 12 10 18 20 6" />
              </svg>
              DJ i parkiet
            </div>
            <div className="flex gap-2.5 items-center text-[15px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5E7360" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 12 10 18 20 6" />
              </svg>
              Wróżby i lanie wosku
            </div>
            <div className="flex gap-2.5 items-center text-[15px] text-[#6A5C70]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B7F91" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
              Alkohol, płatny przy barze
            </div>
            <div className="flex gap-2.5 items-center text-[15px] text-[#6A5C70]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B7F91" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
              Nocleg, osobno 150 zł od osoby
            </div>
          </div>

          <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">Plan wieczoru</h2>
          <div className="mb-9 max-w-[72ch]">
            {[
              { time: '19:00', desc: 'Przyjęcie gości, aperitif w sieni' },
              { time: '20:00', desc: 'Kolacja' },
              { time: '21:30', desc: 'Wróżby i lanie wosku' },
              { time: '22:30', desc: 'Parkiet' },
              { time: '00:30', desc: 'Bufet nocny' },
              { time: '03:00', desc: 'Koniec' },
            ].map((plan, idx) => (
              <div key={idx} className="flex gap-5 py-3.5 border-t border-[#EFE5DD]">
                <span className="w-[70px] shrink-0 text-[15px] font-bold">{plan.time}</span>
                <span className="text-[15px] leading-[1.6] text-[#3E3344]">{plan.desc}</span>
              </div>
            ))}
          </div>

          <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">Dojazd</h2>
          <div className="h-[240px] border border-[#D9CCC2] rounded-[16px] bg-[#E7EDE7] relative overflow-hidden max-w-[72ch]">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(94,115,96,0.10) 1px, transparent 1px) 0 0 / 46px 46px, linear-gradient(0deg, rgba(94,115,96,0.10) 1px, transparent 1px) 0 0 / 46px 46px',
              }}
            />
            <span className="absolute left-[300px] top-[100px] w-8 h-8 rounded-full rounded-br-[2px] bg-[#241C2B] -rotate-45" />
            <div className="absolute left-4 bottom-4 bg-white border border-[#D9CCC2] rounded-[12px] p-3 px-4 text-[13px] leading-[1.6] shadow-sm">
              Kobierzyce, 18 km od Rynku
              <br />
              Parking na 60 aut, bezpłatny
            </div>
          </div>
        </main>

        {/* Aside Booking */}
        <aside className="w-full lg:w-[360px] shrink-0">
          <div className="border border-[#D9CCC2] rounded-[20px] bg-white p-[26px] flex flex-col gap-4 shadow-sm">
            <div>
              <span className="font-fraunces text-[34px] font-medium">180 zł</span>{' '}
              <span className="text-[15px] text-[#6A5C70]">od osoby</span>
            </div>
            <div className="h-[1px] bg-[#EFE5DD]" />

            <div className="flex items-center justify-between text-[15px]">
              <span className="text-[#6A5C70]">Wolne miejsca</span>
              <strong className="font-bold">24 z 120</strong>
            </div>
            <div className="h-2 rounded-full bg-[#EFE5DD] overflow-hidden">
              <div className="w-[80%] h-full bg-[#5E7360]" />
            </div>

            <div className="flex gap-3">
              <div className="grow flex flex-col gap-2">
                <label htmlFor="i-osoby" className="text-[13px] text-[#6A5C70]">
                  Ile osób
                </label>
                <div className="flex items-center border-[1.5px] border-[#D9CCC2] rounded-[10px] bg-white">
                  <button
                    type="button"
                    onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                    className="px-3 py-2 text-lg font-bold bg-transparent border-0 cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    id="i-osoby"
                    type="number"
                    value={ticketCount}
                    onChange={(e) => setTicketCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-center border-0 p-0 text-[15px] font-semibold text-[#241C2B] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setTicketCount(ticketCount + 1)}
                    className="px-3 py-2 text-lg font-bold bg-transparent border-0 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grow flex flex-col gap-2">
                <label htmlFor="i-stolik" className="text-[13px] text-[#6A5C70]">
                  Stolik
                </label>
                <select
                  id="i-stolik"
                  value={tableType}
                  onChange={(e) => setTableType(e.target.value)}
                  className="border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3 text-[15px] font-semibold text-[#241C2B] bg-white cursor-pointer"
                >
                  <option value="wspólny">wspólny</option>
                  <option value="indywidualny">indywidualny</option>
                </select>
              </div>
            </div>

            <div className="text-[14px] text-[#6A5C70] flex justify-between pt-1">
              <span>Suma:</span>
              <strong className="text-[16px] text-[#241C2B] font-bold">{ticketCount * 180} zł</strong>
            </div>

            <button
              type="button"
              onClick={() => navigate('PotwierdzenieRezerwacji')}
              className="text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] p-4 cursor-pointer shadow-sm text-center"
            >
              Zarezerwuj miejsca
            </button>

            <p className="m-0 text-[13px] leading-[1.6] text-[#6A5C70]">
              Rezerwację potwierdza lokal, płacisz na miejscu albo przelewem do niego. Serwis nie pośredniczy w płatności
              i nie pobiera prowizji.
            </p>
          </div>

          <div className="mt-[18px] border border-[#E2D5CA] rounded-[20px] bg-[#F2E9E2] p-[22px]">
            <div className="text-[15px] font-bold mb-2.5">Inne terminy tego miejsca</div>
            <button
              onClick={() => navigate('Imprezy')}
              className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] py-2 border-b border-[#E2D5CA] bg-transparent border-0 border-b cursor-pointer w-full"
            >
              Mikołajki, 6 grudnia
            </button>
            <button
              onClick={() => navigate('Imprezy')}
              className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] py-2 border-b border-[#E2D5CA] bg-transparent border-0 border-b cursor-pointer w-full"
            >
              Sylwester w ogrodzie, 31 grudnia
            </button>
            <button
              onClick={() => navigate('Profil')}
              className="block text-left text-[14px] text-[#8A5405] hover:text-[#241C2B] pt-2.5 bg-transparent border-0 cursor-pointer font-semibold"
            >
              Zobacz cały profil lokalu
            </button>
          </div>
        </aside>
      </section>

      <Footer navigate={navigate} />
    </div>
  );
}

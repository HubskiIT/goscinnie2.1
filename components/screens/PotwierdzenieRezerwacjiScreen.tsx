'use client';

import React from 'react';
import { ScreenProps } from '../types';
import { Header } from '../Header';
import { Footer } from '../Footer';

export function PotwierdzenieRezerwacjiScreen({ navigate }: ScreenProps) {
  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <Header currentScreen="PotwierdzenieRezerwacji" navigate={navigate} />

      <section className="grow px-6 sm:px-12 md:px-[130px] pt-14 flex flex-col lg:flex-row gap-11 items-start pb-16">
        <div className="grow w-full">
          <div className="flex items-center gap-3.5 mb-4">
            <span className="w-11 h-11 rounded-full bg-[#E7EDE7] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3F5142" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 12 10 18 20 6" />
              </svg>
            </span>
            <span className="text-[15px] font-bold text-[#3F5142]">Prośba o rezerwację wysłana</span>
          </div>

          <h1 className="m-0 mb-3 font-fraunces font-normal text-[36px] sm:text-[44px] tracking-tight">
            Dwór pod Lipami dostał Twoje zgłoszenie
          </h1>
          <p className="m-0 mb-8 text-[17px] leading-[1.65] text-[#3E3344] max-w-[68ch]">
            Miejsca nie są jeszcze zajęte. Rezerwację potwierdza lokal, zwykle tego samego dnia. Dopóki nie potwierdzi,
            nic nie płacisz i do niczego się nie zobowiązujesz.
          </p>

          <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">Co dalej</h2>
          <div className="max-w-[72ch] mb-9">
            <div className="flex gap-4 py-4.5 border-t border-[#EFE5DD]">
              <span className="w-[30px] h-[30px] rounded-full bg-[#241C2B] text-[#FBF7F4] text-[14px] font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <div className="text-[16px] font-bold mb-1">Lokal potwierdza miejsca</div>
                <div className="text-[15px] leading-[1.65] text-[#3E3344]">
                  Dostaniesz maila z potwierdzeniem albo z propozycją innego terminu, jeśli miejsca rozeszły się w
                  międzyczasie.
                </div>
              </div>
            </div>

            <div className="flex gap-4 py-4.5 border-t border-[#EFE5DD]">
              <span className="w-[30px] h-[30px] rounded-full bg-[#241C2B] text-[#FBF7F4] text-[14px] font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <div className="text-[16px] font-bold mb-1">Ustalacie płatność bezpośrednio</div>
                <div className="text-[15px] leading-[1.65] text-[#3E3344]">
                  Zadatek, przelew albo płatność na miejscu, tak jak ustali z Tobą lokal. Gościnnie nie pośredniczy w
                  płatności i nie pobiera prowizji od wejściówek.
                </div>
              </div>
            </div>

            <div className="flex gap-4 py-4.5 border-t border-[#EFE5DD]">
              <span className="w-[30px] h-[30px] rounded-full bg-[#241C2B] text-[#FBF7F4] text-[14px] font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <div className="text-[16px] font-bold mb-1">Przychodzisz</div>
                <div className="text-[15px] leading-[1.65] text-[#3E3344]">
                  Na liście przy wejściu będzie Twoje nazwisko i liczba osób. Potwierdzenie z numerem masz w skrzynce.
                </div>
              </div>
            </div>
          </div>

          <div className="border border-[#E2D5CA] rounded-[16px] bg-[#F2E9E2] p-6 sm:p-7 max-w-[72ch]">
            <div className="text-[16px] font-bold mb-2">Chcesz coś zmienić albo zrezygnować?</div>
            <p className="m-0 mb-4 text-[15px] leading-[1.7] text-[#3E3344]">
              Napisz do lokalu przez serwis. Dopóki rezerwacja nie jest potwierdzona, rezygnacja nic nie kosztuje i nie
              wymaga tłumaczenia się.
            </p>
            <button
              onClick={() => navigate('Wiadomosci')}
              className="text-[15px] font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] rounded-[10px] px-5 py-3 cursor-pointer hover:bg-[#241C2B] hover:text-white transition-colors"
            >
              Napisz do lokalu
            </button>
          </div>
        </div>

        {/* Right reservation receipt */}
        <aside className="w-full lg:w-[400px] shrink-0 flex flex-col gap-4">
          <div className="border border-[#D9CCC2] rounded-[20px] bg-white overflow-hidden shadow-sm">
            <div className="h-[130px] bg-[#E4D9CF]" />
            <div className="p-6">
              <div className="font-fraunces font-medium text-[21px] mb-1.5">Andrzejki pod Lipami</div>
              <div className="text-[14px] text-[#6A5C70] mb-4">
                29 listopada 2026, 19:00
                <br />
                Kobierzyce, ul. Parkowa 3
              </div>

              <div className="flex justify-between py-2.5 border-t border-[#EFE5DD] text-[15px]">
                <span className="text-[#6A5C70]">Osoby</span>
                <strong className="font-bold">2</strong>
              </div>
              <div className="flex justify-between py-2.5 border-t border-[#EFE5DD] text-[15px]">
                <span className="text-[#6A5C70]">Stolik</span>
                <strong className="font-bold">wspólny</strong>
              </div>
              <div className="flex justify-between py-2.5 border-t border-[#EFE5DD] text-[15px]">
                <span className="text-[#6A5C70]">Do zapłaty na miejscu</span>
                <strong className="font-bold text-[#3F5142]">360 zł</strong>
              </div>
              <div className="flex justify-between py-2.5 border-t border-[#EFE5DD] text-[15px]">
                <span className="text-[#6A5C70]">Numer zgłoszenia</span>
                <strong className="font-bold font-mono">GS-2026-0418</strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('Imprezy')}
            className="w-full text-center text-[15px] font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] rounded-[12px] p-3.5 hover:bg-[#241C2B] hover:text-white transition-colors cursor-pointer"
          >
            Zobacz inne imprezy
          </button>
        </aside>
      </section>

      <Footer navigate={navigate} />
    </div>
  );
}

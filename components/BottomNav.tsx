'use client';

import React from 'react';
import { ScreenId } from './types';

interface BottomNavProps {
  currentScreen: ScreenId;
  navigate: (screen: ScreenId) => void;
}

const SCREENS: { id: ScreenId; label: string }[] = [
  { id: 'Main', label: 'Strona główna' },
  { id: 'Lokale', label: 'Lokale' },
  { id: 'Uslugodawcy', label: 'Usługodawcy' },
  { id: 'Profil', label: 'Profil lokalu' },
  { id: 'WpisBezProfilu', label: 'Wpis bez profilu' },
  { id: 'Zlecenia', label: 'Zlecenia' },
  { id: 'NoweZlecenie', label: 'Nowe zlecenie' },
  { id: 'Zapytanie', label: 'Zapytanie' },
  { id: 'Imprezy', label: 'Imprezy' },
  { id: 'Impreza', label: 'Impreza' },
  { id: 'PotwierdzenieRezerwacji', label: 'Rezerwacja' },
  { id: 'Cennik', label: 'Dla firm' },
  { id: 'ZamowienieAbonamentu', label: 'Zamówienie' },
  { id: 'RejestracjaFirmy', label: 'Rejestracja firmy' },
  { id: 'Logowanie', label: 'Logowanie' },
  { id: 'PanelFirmy', label: 'Panel firmy' },
  { id: 'PanelKlienta', label: 'Panel klienta' },
  { id: 'Wiadomosci', label: 'Wiadomości' },
  { id: 'Kontakt', label: 'Kontakt' },
  { id: 'Stany', label: 'Stany' },
];

export function BottomNav({ currentScreen, navigate }: BottomNavProps) {
  return (
    <nav
      id="pasek"
      aria-label="Ekrany prototypu"
      className="fixed left-0 right-0 bottom-0 z-50 flex gap-1 overflow-x-auto py-2.5 px-3 bg-[#241C2B] shadow-2xl border-t border-[#3A2D42]"
    >
      <div className="flex items-center px-2 mr-2 text-[11px] font-bold uppercase tracking-wider text-[#A093A7] shrink-0 hidden sm:flex">
        Ekrany prototypu:
      </div>
      {SCREENS.map((item) => {
        const isActive = currentScreen === item.id;
        return (
          <button
            key={item.id}
            data-ekran={item.id}
            onClick={() => navigate(item.id)}
            className={`shrink-0 text-[13px] py-1.5 px-3.5 rounded-full whitespace-nowrap transition-colors border-0 cursor-pointer ${
              isActive
                ? 'text-[#241C2B] bg-[#F0A62E] font-bold shadow-sm'
                : 'text-[#D8CFDC] bg-transparent hover:text-[#241C2B] hover:bg-[#F2E9E2]'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

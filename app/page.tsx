'use client';

import React, { useState, useEffect } from 'react';
import { ScreenId } from '@/components/types';
import { BottomNav } from '@/components/BottomNav';
import { MainScreen } from '@/components/screens/MainScreen';
import { LokaleScreen } from '@/components/screens/LokaleScreen';
import { UslugodawcyScreen } from '@/components/screens/UslugodawcyScreen';
import { ProfilScreen } from '@/components/screens/ProfilScreen';
import { WpisBezProfiluScreen } from '@/components/screens/WpisBezProfiluScreen';
import { ZleceniaScreen } from '@/components/screens/ZleceniaScreen';
import { NoweZlecenieScreen } from '@/components/screens/NoweZlecenieScreen';
import { ZapytanieScreen } from '@/components/screens/ZapytanieScreen';
import { ImprezyScreen } from '@/components/screens/ImprezyScreen';
import { ImprezaScreen } from '@/components/screens/ImprezaScreen';
import { PotwierdzenieRezerwacjiScreen } from '@/components/screens/PotwierdzenieRezerwacjiScreen';
import { CennikScreen } from '@/components/screens/CennikScreen';
import { ZamowienieAbonamentuScreen } from '@/components/screens/ZamowienieAbonamentuScreen';
import { RejestracjaFirmyScreen } from '@/components/screens/RejestracjaFirmyScreen';
import { LogowanieScreen } from '@/components/screens/LogowanieScreen';
import { PanelFirmyScreen } from '@/components/screens/PanelFirmyScreen';
import { PanelKlientaScreen } from '@/components/screens/PanelKlientaScreen';
import { WiadomosciScreen } from '@/components/screens/WiadomosciScreen';
import { KontaktScreen } from '@/components/screens/KontaktScreen';
import { StanyScreen } from '@/components/screens/StanyScreen';

const VALID_SCREENS: ScreenId[] = [
  'Main',
  'Lokale',
  'Uslugodawcy',
  'Profil',
  'WpisBezProfilu',
  'Zlecenia',
  'NoweZlecenie',
  'Zapytanie',
  'Imprezy',
  'Impreza',
  'PotwierdzenieRezerwacji',
  'Cennik',
  'ZamowienieAbonamentu',
  'RejestracjaFirmy',
  'Logowanie',
  'PanelFirmy',
  'PanelKlienta',
  'Wiadomosci',
  'Kontakt',
  'Stany',
];

export default function Page() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('Main');
  const [shortlist, setShortlist] = useState<string[]>(['Dwór pod Lipami']);
  const [calendarState, setCalendarState] = useState<Record<number, 'wolny' | 'trzymany' | 'zajety'>>({
    4: 'zajety',
    6: 'wolny',
    9: 'zajety',
    11: 'trzymany',
    13: 'wolny',
  });

  const toggleShortlist = (venueName: string) => {
    setShortlist((prev) =>
      prev.includes(venueName) ? prev.filter((v) => v !== venueName) : [...prev, venueName]
    );
  };

  const toggleCalendarDay = (day: number) => {
    setCalendarState((prev) => {
      const current = prev[day] || 'wolny';
      let next: 'wolny' | 'trzymany' | 'zajety' = 'wolny';
      if (current === 'wolny') next = 'trzymany';
      else if (current === 'trzymany') next = 'zajety';
      else next = 'wolny';
      return { ...prev, [day]: next };
    });
  };

  // URL hash sync: #screen=Lokale or #Lokale
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash) {
        const screenParam = hash.startsWith('screen=') ? hash.replace('screen=', '') : hash;
        if (VALID_SCREENS.includes(screenParam as ScreenId)) {
          setCurrentScreen(screenParam as ScreenId);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (screen: ScreenId) => {
    setCurrentScreen(screen);
    window.location.hash = screen;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const screenProps = {
    navigate,
    shortlist,
    toggleShortlist,
    calendarState,
    toggleCalendarDay,
  };

  return (
    <div className="relative min-h-screen bg-[#FBF7F4] text-[#241C2B] font-figtree pb-16">
      {currentScreen === 'Main' && <MainScreen {...screenProps} />}
      {currentScreen === 'Lokale' && <LokaleScreen {...screenProps} />}
      {currentScreen === 'Uslugodawcy' && <UslugodawcyScreen {...screenProps} />}
      {currentScreen === 'Profil' && <ProfilScreen {...screenProps} />}
      {currentScreen === 'WpisBezProfilu' && <WpisBezProfiluScreen {...screenProps} />}
      {currentScreen === 'Zlecenia' && <ZleceniaScreen {...screenProps} />}
      {currentScreen === 'NoweZlecenie' && <NoweZlecenieScreen {...screenProps} />}
      {currentScreen === 'Zapytanie' && <ZapytanieScreen {...screenProps} />}
      {currentScreen === 'Imprezy' && <ImprezyScreen {...screenProps} />}
      {currentScreen === 'Impreza' && <ImprezaScreen {...screenProps} />}
      {currentScreen === 'PotwierdzenieRezerwacji' && <PotwierdzenieRezerwacjiScreen {...screenProps} />}
      {currentScreen === 'Cennik' && <CennikScreen {...screenProps} />}
      {currentScreen === 'ZamowienieAbonamentu' && <ZamowienieAbonamentuScreen {...screenProps} />}
      {currentScreen === 'RejestracjaFirmy' && <RejestracjaFirmyScreen {...screenProps} />}
      {currentScreen === 'Logowanie' && <LogowanieScreen {...screenProps} />}
      {currentScreen === 'PanelFirmy' && <PanelFirmyScreen {...screenProps} />}
      {currentScreen === 'PanelKlienta' && <PanelKlientaScreen {...screenProps} />}
      {currentScreen === 'Wiadomosci' && <WiadomosciScreen {...screenProps} />}
      {currentScreen === 'Kontakt' && <KontaktScreen {...screenProps} />}
      {currentScreen === 'Stany' && <StanyScreen {...screenProps} />}

      {/* Global Bottom Navigation Bar */}
      <BottomNav currentScreen={currentScreen} navigate={navigate} />
    </div>
  );
}

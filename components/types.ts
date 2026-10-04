export type ScreenId =
  | "Main"
  | "Lokale"
  | "Uslugodawcy"
  | "Profil"
  | "WpisBezProfilu"
  | "Zlecenia"
  | "NoweZlecenie"
  | "Zapytanie"
  | "Imprezy"
  | "Impreza"
  | "PotwierdzenieRezerwacji"
  | "Cennik"
  | "ZamowienieAbonamentu"
  | "RejestracjaFirmy"
  | "Logowanie"
  | "PanelFirmy"
  | "PanelKlienta"
  | "Wiadomosci"
  | "Kontakt"
  | "Stany";

export interface ScreenProps {
  navigate: (screen: ScreenId) => void;
  shortlist: string[];
  toggleShortlist: (venue: string) => void;
  calendarState: Record<number, "wolny" | "trzymany" | "zajety">;
  toggleCalendarDay: (day: number) => void;
}

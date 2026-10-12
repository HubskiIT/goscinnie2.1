/**
 * Jedyne miejsce, w którym żyją adresy serwisu.
 * Komponenty nie składają ścieżek z kawałków tekstu.
 */
import type { RolaKonta } from "@/lib/db/queries/konto";
export const TRASY = {
  glowna: "/",
  lokale: "/lokale",
  uslugodawcy: "/uslugodawcy",
  zlecenia: "/zlecenia",
  dodajZlecenie: "/dodaj-zlecenie",
  imprezy: "/imprezy",
  dlaFirm: "/dla-firm",
  cennik: "/cennik",
  kontakt: "/kontakt",
  logowanie: "/logowanie",
  /** Rozdroże: firma albo klient. Tu prowadzi każde ogólne „załóż konto". */
  rejestracja: "/rejestracja",
  rejestracjaKlienta: "/rejestracja/klient",
  rejestracjaFirmy: "/rejestracja-firmy",
  panel: "/panel",
  panelProfil: "/panel/profil",
  panelAbonament: "/panel/abonament",
  moje: "/moje",
  wiadomosci: "/wiadomosci",
} as const;

/** Drugi krok kreatora, czyli pierwszy po założeniu konta. */
export const KREATOR_KROK_2 = `${TRASY.rejestracjaFirmy}?krok=2`;

/**
 * Dokąd odesłać człowieka po potwierdzeniu adresu kodem z maila.
 *
 * Wcześniej była tu stała prowadząca zawsze do kreatora firmy, bo inna droga
 * do konta nie istniała. Klient, który potwierdzał adres, lądował na ekranie
 * „Dodaj swoją firmę do katalogu".
 *
 * Nieznana rola i brak odczytu prowadzą na `/moje`. To jest właściwy kierunek
 * pomyłki: `/moje` niczego nie odsłania i nie zaczyna żadnego procesu,
 * a kreator firmy wyglądałby jak polecenie założenia firmy.
 */
export function trasaPoWeryfikacji(rola: RolaKonta | null): string {
  return rola === "company_owner" ? KREATOR_KROK_2 : TRASY.moje;
}

export const firma = (slug: string) => `/f/${slug}`;
export const zapytanieDoFirmy = (slug: string) => `/f/${slug}/zapytanie`;
export const impreza = (slug: string) => `/imprezy/${slug}`;
export const zlecenie = (id: string) => `/zlecenia/${id}`;
export const okazja = (nazwa: string) => `/okazje/${nazwa}`;
export const lokaleWg = (rodzaj: string, miejscowosc: string) => `/lokale/${rodzaj}/${miejscowosc}`;
export const uslugodawcyWg = (kategoria: string, miejscowosc: string) =>
  `/uslugodawcy/${kategoria}/${miejscowosc}`;

/**
 * Przykładowe ogłoszenia z punktu 6 planu. Do Etapu 2, gdy wejdzie
 * content/ogloszenia.ts, trzymamy je tutaj, żeby linki nie zgadywały slugów.
 */
export const PRZYKLADY = {
  lokal: "dwor-pod-lipami",
  wpisBezProfilu: "stary-spichlerz",
  impreza: "andrzejki-pod-lipami",
  zlecenie: "k7m2x9",
} as const;

/**
 * Jedyne miejsce, w którym żyją adresy serwisu.
 * Komponenty nie składają ścieżek z kawałków tekstu.
 */
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
  rejestracjaFirmy: "/rejestracja-firmy",
  panel: "/panel",
  panelProfil: "/panel/profil",
  panelAbonament: "/panel/abonament",
  moje: "/moje",
  wiadomosci: "/wiadomosci",
} as const;

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

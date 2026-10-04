import type { KlasaCenowa } from "@/content/kategorie";

/**
 * Cennik abonamentu, stan z 3 października 2026.
 *
 * Jedyne miejsce z kwotami. Czytają stąd zarówno strona cennika, jak i kreator
 * profilu, żeby firma widziała w kreatorze dokładnie tę cenę, którą zobaczy
 * na stronie cennika.
 *
 * Kwoty są w złotych i netto.
 */
export type Okres = "miesiac" | "pol_roku" | "rok";
export type Plan = "start" | "pelny" | "wyrozniony";

export interface CenyOkresu {
  start: number;
  pelny: number;
  wyrozniony: number;
}

export interface KlasaCennika {
  etykieta: string;
  typowaTransakcja: string;
  opis: string;
  miesiac: CenyOkresu;
  pol_roku: CenyOkresu;
  rok: CenyOkresu;
}

export const CENNIK: Record<KlasaCenowa, KlasaCennika> = {
  A: {
    etykieta: "Klasa A · Sale, hotele, dwory, catering pełny",
    typowaTransakcja: "15 000 – 60 000 zł",
    opis:
      "Dla obiektów i firm, gdzie jedno pozyskane wesele lub przyjęcie zwraca koszt " +
      "rocznego abonamentu z kilkukrotną nawiązką.",
    miesiac: { start: 189, pelny: 379, wyrozniony: 739 },
    pol_roku: { start: 890, pelny: 1790, wyrozniony: 3540 },
    rok: { start: 1490, pelny: 2990, wyrozniony: 5900 },
  },
  B: {
    etykieta: "Klasa B · Restauracje, agroturystyka, zespoły, foto, wideo, dekoracje",
    typowaTransakcja: "3 000 – 15 000 zł",
    opis:
      "Dla kluczowych twórców oprawy uroczystości szukających regularnych zleceń " +
      "w wybranym regionie.",
    miesiac: { start: 89, pelny: 179, wyrozniony: 349 },
    pol_roku: { start: 410, pelny: 830, wyrozniony: 1670 },
    rok: { start: 690, pelny: 1390, wyrozniony: 2790 },
  },
  C: {
    etykieta: "Klasa C · DJ, barman, animator, fotobudka, transport, florysta",
    typowaTransakcja: "500 – 3 000 zł",
    opis:
      "Dla mobilnych specjalistów i usługodawców z krótszym czasem realizacji " +
      "i dużą częstotliwością imprez.",
    miesiac: { start: 49, pelny: 99, wyrozniony: 189 },
    pol_roku: { start: 230, pelny: 470, wyrozniony: 890 },
    rok: { start: 390, pelny: 790, wyrozniony: 1490 },
  },
};

export const NAZWY_PLANOW: Record<Plan, string> = {
  start: "Start",
  pelny: "Pełny",
  wyrozniony: "Wyróżniony",
};

export const NAZWY_OKRESOW: Record<Okres, string> = {
  miesiac: "Miesiąc",
  pol_roku: "Pół roku",
  rok: "Rok (baza)",
};

/**
 * Polskie CLDR nie grupuje liczb czterocyfrowych, więc 2990 zostałoby bez
 * spacji. W cenniku czyta się to źle, dlatego wymuszamy grupowanie.
 */
const ZLOTE = new Intl.NumberFormat("pl-PL", { useGrouping: true });

export function zlotePelne(kwota: number): string {
  return `${ZLOTE.format(kwota)} zł`;
}

export function cena(klasa: KlasaCenowa, okres: Okres, plan: Plan): number {
  return CENNIK[klasa][okres][plan];
}

/** „1 490 zł / rok”. Jedno miejsce na format, żeby nigdzie się nie rozjechał. */
export function cenaZOkresem(klasa: KlasaCenowa, okres: Okres, plan: Plan): string {
  const skrot: Record<Okres, string> = { miesiac: "mies.", pol_roku: "pół roku", rok: "rok" };
  return `${zlotePelne(cena(klasa, okres, plan))} / ${skrot[okres]}`;
}

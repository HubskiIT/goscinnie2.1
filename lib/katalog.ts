/**
 * Firmy z bazy w kształcie, który znają ekrany katalogu.
 *
 * Ekrany list powstały na przykładowych ogłoszeniach z `content/ogloszenia.ts`.
 * Zamiast przepisywać je pod drugi typ, firmy z bazy zamieniamy tutaj na ten
 * sam kształt. Pola, których kreator nie zbiera (udogodnienia, okazje,
 * odległość od centrum, zasięg dojazdu), zostają puste, a ekrany wtedy ich
 * nie pokazują. Nie zgadujemy ich.
 *
 * Tylko po stronie serwera: sięga do bazy.
 */
import { pobierzKategorie } from "@/content/kategorie";
import type { Lokal, Uslugodawca } from "@/content/ogloszenia";
import { pobierzRodzajeLokali } from "@/content/rodzaje-lokali";
import { type FirmaWKatalogu, pobierzFirmyKatalogu } from "@/lib/db/queries/katalog";
import type { Widz } from "@/lib/permissions";

const SLUGI_LOKALI = pobierzRodzajeLokali().map((r) => r.slug);
const SLUGI_USLUG = pobierzKategorie().map((k) => k.slug);

export function czyRodzajLokalu(slugKategorii: string): boolean {
  return SLUGI_LOKALI.includes(slugKategorii);
}

function miejscowosc(firma: FirmaWKatalogu): Lokal["miejscowosc"] {
  return {
    slug: firma.miejscowosc.slug,
    nazwa: firma.miejscowosc.nazwa,
    gmina: firma.miejscowosc.gmina ?? "",
    powiat: firma.miejscowosc.powiat,
    wojewodztwo: firma.miejscowosc.wojewodztwo,
    odlegloscOdCentrumKm: null,
  };
}

export function lokalZFirmy(firma: FirmaWKatalogu): Lokal {
  return {
    slug: firma.slug,
    nazwa: firma.nazwa,
    rodzaj: firma.kategoria,
    status: "active",
    przykladowe: false,
    miejscowosc: miejscowosc(firma),
    cenaOdGrosze: firma.cenaOd,
    jednostkaCeny: "",
    pojemnoscMin: firma.pojemnoscMin,
    pojemnoscMax: firma.pojemnoscMax,
    opis: firma.opis,
    udogodnienia: [],
    okazje: [],
    zdjecie: firma.glowneZdjecie,
  };
}

export function uslugodawcaZFirmy(firma: FirmaWKatalogu): Uslugodawca {
  return {
    slug: firma.slug,
    nazwa: firma.nazwa,
    status: "active",
    przykladowe: false,
    kategoriaGlowna: firma.kategoria,
    miejscowosc: miejscowosc(firma),
    zasiegDojazduKm: null,
    cenaOdGrosze: firma.cenaOd,
    jednostkaCeny: "",
    opis: firma.opis,
    udogodnienia: [],
    zdjecie: firma.glowneZdjecie,
  };
}

export async function lokaleZBazy(widz: Widz): Promise<Lokal[]> {
  return (await pobierzFirmyKatalogu(widz, SLUGI_LOKALI)).map(lokalZFirmy);
}

export async function uslugodawcyZBazy(widz: Widz): Promise<Uslugodawca[]> {
  return (await pobierzFirmyKatalogu(widz, SLUGI_USLUG)).map(uslugodawcaZFirmy);
}

import {
  bezZnakow,
  type Miejscowosc,
  pobierzMiejscowosc,
  podpowiedzMiejscowosci,
} from "@/content/miejscowosci";
import { type Lokal, pobierzLokale } from "@/content/ogloszenia";
import type { KryteriaLokali } from "@/lib/wyszukiwanie";

/**
 * Filtrowanie po stronie serwera. Ta część sięga po plik z miejscowościami,
 * więc nie może trafić do paczki przeglądarki i stoi osobno od lib/wyszukiwanie.ts.
 */

const PROMIEN_ZIEMI_KM = 6371;

/** Odległość po wielkim kole. Do czasu wejścia PostGIS liczymy ją tutaj. */
function odlegloscKm(
  aSzerokosc: number,
  aDlugosc: number,
  bSzerokosc: number,
  bDlugosc: number,
): number {
  const naRadiany = (stopnie: number) => (stopnie * Math.PI) / 180;
  const roznicaSzerokosci = naRadiany(bSzerokosc - aSzerokosc);
  const roznicaDlugosci = naRadiany(bDlugosc - aDlugosc);
  const a =
    Math.sin(roznicaSzerokosci / 2) ** 2 +
    Math.cos(naRadiany(aSzerokosc)) *
      Math.cos(naRadiany(bSzerokosc)) *
      Math.sin(roznicaDlugosci / 2) ** 2;
  return 2 * PROMIEN_ZIEMI_KM * Math.asin(Math.sqrt(a));
}

/**
 * Z adresu przychodzi albo slug (`m=wroclaw`), albo tekst wpisany w pole
 * bez JavaScriptu. W drugim przypadku bierzemy najlepszą podpowiedź,
 * zgodnie z punktem 5.3.3 planu.
 */
export function dopasujMiejscowosc(wartosc: string | null): Miejscowosc | null {
  if (wartosc === null) return null;
  const poSlugu = pobierzMiejscowosc(wartosc);
  if (poSlugu !== undefined) return poSlugu;
  const dokladne = podpowiedzMiejscowosci(wartosc, 8).find(
    (m) => bezZnakow(m.nazwa) === bezZnakow(wartosc),
  );
  return dokladne ?? podpowiedzMiejscowosci(wartosc, 1)[0] ?? null;
}

export function wyszukajLokale(kryteria: KryteriaLokali): readonly Lokal[] {
  const szukana = dopasujMiejscowosc(kryteria.miejscowosc);

  return pobierzLokale().filter((lokal) => {
    if (kryteria.rodzaj !== null && lokal.rodzaj !== kryteria.rodzaj) return false;

    if (kryteria.goscie !== null) {
      if (lokal.pojemnoscMax !== null && lokal.pojemnoscMax < kryteria.goscie) return false;
      if (lokal.pojemnoscMin !== null && lokal.pojemnoscMin > kryteria.goscie) return false;
    }

    if (
      kryteria.udogodnienia.length > 0 &&
      !kryteria.udogodnienia.every((u) => lokal.udogodnienia.includes(u))
    ) {
      return false;
    }

    if (szukana === null) return true;
    if (kryteria.promienKm === 0) return lokal.miejscowosc.slug === szukana.slug;

    const tutaj = pobierzMiejscowosc(lokal.miejscowosc.slug);
    if (
      tutaj === undefined ||
      tutaj.szerokosc === null ||
      tutaj.dlugosc === null ||
      szukana.szerokosc === null ||
      szukana.dlugosc === null
    ) {
      // Brak współrzędnych po którejś stronie: nie wycinamy wpisu po cichu.
      return true;
    }
    return (
      odlegloscKm(szukana.szerokosc, szukana.dlugosc, tutaj.szerokosc, tutaj.dlugosc) <=
      kryteria.promienKm
    );
  });
}

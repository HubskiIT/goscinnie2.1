/**
 * Zamknięcie serwisu przed robotami wyszukiwarek.
 *
 * To jest dziś najważniejsze ustawienie całego wdrożenia. Sześćset cienkich
 * profili zaindeksowanych przed zapełnieniem katalogu kosztuje miesiące
 * wychodzenia z filtra jakościowego, a odkręcić się tego nie da.
 *
 * Dlatego sprawdzamy nie tylko, że nagłówek jest, ale też że domyślną
 * odpowiedzią przy braku zmiennej jest „zamknięte”.
 */
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import {
  indeksowanieWlaczone,
  NAGLOWEK_ROBOTOW,
  robotyWMetadanych,
  WARTOSC_WLACZAJACA,
} from "@/lib/indeksowanie";

const POCZATKOWA = process.env.INDEKSOWANIE;

afterEach(() => {
  if (POCZATKOWA === undefined) delete process.env.INDEKSOWANIE;
  else process.env.INDEKSOWANIE = POCZATKOWA;
});

async function naglowkiOdpowiedzi(): Promise<Headers> {
  // Import w środku, żeby każdy przypadek dostał świeży moduł ze swoją
  // wartością zmiennej środowiskowej.
  const { middleware } = await import("@/middleware");
  const { NextRequest } = await import("next/server");
  const odpowiedz = middleware(new NextRequest("http://localhost:3000/f/firma-1"));
  return odpowiedz.headers;
}

describe("domyślnie zamknięte", () => {
  it("brak zmiennej znaczy: nie indeksuj", () => {
    delete process.env.INDEKSOWANIE;
    expect(indeksowanieWlaczone()).toBe(false);
  });

  it("pusta wartość też znaczy: nie indeksuj", () => {
    process.env.INDEKSOWANIE = "";
    expect(indeksowanieWlaczone()).toBe(false);
  });

  it("przypadkowa wartość nie otwiera serwisu", () => {
    // Kierunek pomyłki ma być bezpieczny: literówka zostawia serwis zamknięty.
    process.env.INDEKSOWANIE = "true";
    expect(indeksowanieWlaczone()).toBe(false);
    process.env.INDEKSOWANIE = "tak";
    expect(indeksowanieWlaczone()).toBe(false);
  });

  it("otwiera wyłącznie jedna dokładna wartość", () => {
    process.env.INDEKSOWANIE = WARTOSC_WLACZAJACA;
    expect(indeksowanieWlaczone()).toBe(true);
  });
});

describe("nagłówek X-Robots-Tag", () => {
  it("przy wyłączonym indeksowaniu odpowiedź ma noindex", async () => {
    delete process.env.INDEKSOWANIE;
    const naglowki = await naglowkiOdpowiedzi();

    expect(naglowki.get(NAGLOWEK_ROBOTOW)).toContain("noindex");
    expect(naglowki.get(NAGLOWEK_ROBOTOW)).toContain("nofollow");
  });

  it("przy włączonym indeksowaniu nagłówka nie ma", async () => {
    process.env.INDEKSOWANIE = WARTOSC_WLACZAJACA;
    const naglowki = await naglowkiOdpowiedzi();

    expect(naglowki.get(NAGLOWEK_ROBOTOW)).toBeNull();
  });
});

describe("robots.txt", () => {
  it("przy wyłączonym indeksowaniu blokuje wszystko", async () => {
    delete process.env.INDEKSOWANIE;
    const { default: robots } = await import("@/app/robots");
    const regula = robots().rules;
    const pierwsza = Array.isArray(regula) ? regula[0] : regula;

    expect(pierwsza?.userAgent).toBe("*");
    expect(pierwsza?.disallow).toBe("/");
  });

  it("przy włączonym indeksowaniu wpuszcza, ale nie do panelu i API", async () => {
    process.env.INDEKSOWANIE = WARTOSC_WLACZAJACA;
    const { default: robots } = await import("@/app/robots");
    const regula = robots().rules;
    const pierwsza = Array.isArray(regula) ? regula[0] : regula;

    expect(pierwsza?.allow).toBe("/");
    expect(pierwsza?.disallow).toContain("/api/");
  });
});

/**
 * Trzecia bariera: znacznik `robots` w treści strony.
 *
 * To ta, która była zepsuta. `app/layout.tsx` miał wpisane na sztywno
 * `{ index: false, follow: false }` i nie czytał flagi wcale, więc
 * `INDEKSOWANIE=wlaczone` zdejmowało nagłówek i otwierało robots.txt,
 * a każda strona dalej niosła `noindex` w `<head>`. Serwis zostawał
 * zamknięty, tylko już bez śladu w robots.txt, który by to tłumaczył.
 */
describe("znacznik robots w metadanych", () => {
  it("przy wyłączonym indeksowaniu odmawia indeksu", () => {
    delete process.env.INDEKSOWANIE;

    expect(robotyWMetadanych()).toMatchObject({ index: false, follow: false });
  });

  it("przy włączonym indeksowaniu wpuszcza i prosi o dużą miniaturę", () => {
    process.env.INDEKSOWANIE = WARTOSC_WLACZAJACA;
    const robots = robotyWMetadanych();

    expect(robots).toMatchObject({ index: true, follow: true });
    // Katalog miejsc sprzedaje się zdjęciem sali, nie samym napisem.
    expect(robots.googleBot?.["max-image-preview"]).toBe("large");
  });
});

/**
 * Trzy bariery, jedna zmienna.
 *
 * Każda sprawdzana **osobno i w obu stanach flagi**, bo bariera, która
 * flagi nie czyta, wygląda poprawnie dopóki patrzy się na pozostałe.
 * Dokładnie tak przeszła poprzednia wersja: dwie bariery słuchały zmiennej,
 * trzecia nie, a test sprawdzał tylko te dwie i był zielony.
 */
describe("trzy bariery zgadzają się z flagą", () => {
  async function stanBarier() {
    const { default: robots } = await import("@/app/robots");
    const regula = robots().rules;
    const pierwsza = Array.isArray(regula) ? regula[0] : regula;

    return {
      naglowek: (await naglowkiOdpowiedzi()).get(NAGLOWEK_ROBOTOW),
      robotsTxt: pierwsza?.disallow,
      metadane: robotyWMetadanych().index,
    };
  }

  it("wyłączona flaga zamyka wszystkie trzy", async () => {
    delete process.env.INDEKSOWANIE;
    const stan = await stanBarier();

    expect(stan.naglowek).toContain("noindex");
    expect(stan.robotsTxt).toBe("/");
    expect(stan.metadane).toBe(false);
  });

  it("włączona flaga otwiera wszystkie trzy", async () => {
    process.env.INDEKSOWANIE = WARTOSC_WLACZAJACA;
    const stan = await stanBarier();

    expect(stan.naglowek).toBeNull();
    expect(stan.robotsTxt).not.toBe("/");
    expect(stan.metadane).toBe(true);
  });
});

describe("konwencja: layout nie decyduje o indeksowaniu sam", () => {
  it("app/layout.tsx czyta flagę, zamiast wpisywać odpowiedź na sztywno", () => {
    /*
     * Test na treść pliku, a nie na zachowanie, i to jest celowe. Metadanych
     * layoutu nie da się tu zaimportować, bo moduł ciągnie `next/font/google`,
     * a sam wynik niczego by nie dowiódł: wartość wpisana na sztywno na „tak”
     * wygląda w jednym przebiegu identycznie jak wartość czytana z flagi.
     *
     * Pilnujemy więc źródła prawdy, nie wyniku: w layoucie nie ma prawa stać
     * literał, bo wtedy zmienna środowiskowa przestaje cokolwiek znaczyć.
     */
    const layout = readFileSync("app/layout.tsx", "utf8");

    expect(layout).toContain("robotyWMetadanych()");
    expect(layout).not.toMatch(/index:\s*(true|false)/);
  });
});

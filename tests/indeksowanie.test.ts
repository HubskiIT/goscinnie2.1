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
import { afterEach, describe, expect, it } from "vitest";
import { indeksowanieWlaczone, NAGLOWEK_ROBOTOW, WARTOSC_WLACZAJACA } from "@/lib/indeksowanie";

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

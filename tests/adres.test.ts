/**
 * Adres, pod którym biblioteka sesji wystawia swoje punkty końcowe.
 *
 * Reguła: na Vercelu **nigdy nie schodzimy na localhost**. Zapasem jest adres
 * wdrożenia, bo `BETTER_AUTH_URL` jest ustawiony tylko dla produkcji, a
 * biblioteka buduje z tego adresu odnośniki w mailach i po nim sprawdza
 * pochodzenie żądania. Zły adres nie wywala wdrożenia, tylko cicho psuje
 * logowanie na każdej gałęzi, więc jedyne, co to wyłapie, to test.
 *
 * Środowisko wstrzykiwane argumentem, nie przez `process.env`: testy nie
 * zostawiają po sobie stanu, a ten sam przebieg daje ten sam wynik na
 * maszynie dewelopera i w CI, gdzie `VERCEL_URL` bywa ustawione naprawdę.
 *
 * Nie wymaga bazy.
 */
import { describe, expect, it } from "vitest";
import { adresSesji } from "@/lib/adres";

describe("adresSesji", () => {
  it("bierze BETTER_AUTH_URL, gdy jest ustawiony", () => {
    const adres = adresSesji({ BETTER_AUTH_URL: "https://goscinnie.pl" });

    expect(adres).toBe("https://goscinnie.pl");
  });

  it("na podglądzie schodzi na adres wdrożenia, nie na localhost", () => {
    /*
     * TO JEST TEST NA NAPRAWIANY BŁĄD. Podgląd nie dostaje
     * `BETTER_AUTH_URL`, bo zmienna jest ustawiona tylko dla produkcji.
     * Poprzedni zapis dawał tu `http://localhost:3000`.
     */
    const adres = adresSesji({
      VERCEL_URL: "goscinnie2-1-m8j7-git-jakas-galaz.vercel.app",
    });

    expect(adres).toBe("https://goscinnie2-1-m8j7-git-jakas-galaz.vercel.app");
    expect(adres).not.toContain("localhost");
  });

  it("pusta zmienna znaczy brak zmiennej, nie pusty adres", () => {
    // Skasowanie wartości w panelu Vercela zostawia pole puste, nie usuwa
    // zmiennej. `??` przepuściłoby tu pusty napis jako wartość poprawną.
    const adres = adresSesji({
      BETTER_AUTH_URL: "   ",
      VERCEL_URL: "podglad.vercel.app",
    });

    expect(adres).toBe("https://podglad.vercel.app");
  });

  it("bez żadnej zmiennej zostaje localhost, bo to praca lokalna", () => {
    // Instancja pozytywna dla przypadku wyżej: localhost nadal jest
    // osiągalny, więc tamten test dowodzi wyboru, a nie tego, że tej
    // wartości nie da się zwrócić w ogóle.
    expect(adresSesji({})).toBe("http://localhost:3000");
  });
});

/**
 * Reguła: czyścimy zapis ceny, nie zmieniamy treści.
 *
 * Czułość sprawdzona: po przywróceniu dawnego `replace(/[^\d.,]/g, "")`
 * padają testy „tekst, który nie jest ceną, zostaje nietknięty" oraz
 * „cena z opisem jednostki nie udaje liczby".
 */
import { describe, expect, it } from "vitest";
import { normalizujCene } from "./cena";

describe("normalizujCene", () => {
  it("zdejmuje jednostkę i odstępy", () => {
    expect(normalizujCene("180 zł")).toBe("180");
    expect(normalizujCene(" 180zł ")).toBe("180");
    expect(normalizujCene("1 800 PLN")).toBe("1800");
  });

  it("przecinek dziesiętny zamienia na kropkę", () => {
    expect(normalizujCene("180,50 zł")).toBe("180.50");
  });

  it("tekst, który nie jest ceną, zostaje nietknięty", () => {
    /*
     * Najważniejszy test tego pliku. Wynik ma być **różny od pustego**,
     * bo pusty napis znaczy na serwerze „nie podano ceny" i firma zapisałaby
     * się bez ceny, zamiast dostać odmowę.
     */
    expect(normalizujCene("sto osiemdziesiąt")).toBe("stoosiemdziesiąt");
    expect(normalizujCene("do ustalenia")).toBe("doustalenia");
  });

  it("cena z opisem jednostki nie udaje liczby", () => {
    // „180 zł od osoby" to nie liczba: kreator nie zbiera jednostki ceny,
    // więc człowiek ma usłyszeć, że ma wpisać samą kwotę.
    expect(normalizujCene("180 zł od osoby")).not.toBe("180");
  });

  it("puste pole zostaje puste, bo to znaczy „nie podano”", () => {
    expect(normalizujCene("")).toBe("");
    expect(normalizujCene("   ")).toBe("");
  });
});

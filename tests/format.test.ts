/**
 * Odmiana rzeczownika po liczbie.
 *
 * Powód, dla którego to w ogóle ma test: ekrany miały wpisane
 * `ile === 1 ? "obiekt" : "obiekty"`, co jest poprawne dla jedynki i dla
 * dwójki, a w każdym innym przypadku nie. Pusty katalog, czyli stan, w którym
 * serwis startuje, pokazywał „0 obiekty”.
 *
 * Nie wymaga bazy.
 */
import { describe, expect, it } from "vitest";
import { odmiana } from "@/content/format";

describe("odmiana", () => {
  const obiekt = (ile: number) => odmiana(ile, "obiekt", "obiekty", "obiektów");

  it("zero bierze formę mnogą drugą, nie pierwszą", () => {
    // To jest ten przypadek, który był zepsuty, i to na pustym katalogu,
    // czyli w jedynym stanie, jaki serwis miał na starcie.
    expect(obiekt(0)).toBe("obiektów");
  });

  it("jedynka", () => {
    expect(obiekt(1)).toBe("obiekt");
  });

  it("końcówki od dwóch do czterech", () => {
    expect([obiekt(2), obiekt(3), obiekt(4)]).toEqual(["obiekty", "obiekty", "obiekty"]);
    expect([obiekt(22), obiekt(104)]).toEqual(["obiekty", "obiekty"]);
  });

  it("nastki idą wbrew swojej końcówce", () => {
    /*
     * Tu siedzi cała trudność tej reguły: 12 kończy się dwójką, a mimo to
     * „12 obiekty” jest błędne. Bez tego przypadku prostsze, złe wyrażenie
     * oparte na samej cyfrze jedności przeszłoby ten zestaw.
     */
    expect([obiekt(12), obiekt(13), obiekt(14)]).toEqual(["obiektów", "obiektów", "obiektów"]);
    expect(obiekt(112)).toBe("obiektów");
  });

  it("pozostałe liczby biorą formę mnogą drugą", () => {
    expect([obiekt(5), obiekt(11), obiekt(25), obiekt(100)]).toEqual([
      "obiektów",
      "obiektów",
      "obiektów",
      "obiektów",
    ]);
  });

  it("sto jeden to nie jeden", () => {
    // Łatwa pomyłka: warunek `ile % 10 === 1` dałby tu „101 obiekt”.
    expect(obiekt(101)).toBe("obiektów");
  });
});

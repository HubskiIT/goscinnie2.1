import { describe, expect, it } from "vitest";
import { odczytajPojemnosc, pojemnoscDoPola, pojemnoscNieczytelna } from "./pojemnosc";

describe("pojemność wpisana w kreatorze", () => {
  it("przedział daje minimum i maksimum, a nie samo minimum", () => {
    expect(odczytajPojemnosc("40-140")).toEqual({ min: 40, max: 140 });
    expect(odczytajPojemnosc("od 40 do 140 osób")).toEqual({ min: 40, max: 140 });
  });

  it("odwrócony przedział nie zamienia minimum z maksimum", () => {
    expect(odczytajPojemnosc("140 - 40")).toEqual({ min: 40, max: 140 });
  });

  it("jedna liczba to maksimum", () => {
    expect(odczytajPojemnosc("do 140 osób")).toEqual({ min: null, max: 140 });
    expect(odczytajPojemnosc("140")).toEqual({ min: null, max: 140 });
  });

  it("puste albo niezrozumiałe pole nie zgaduje liczb", () => {
    expect(odczytajPojemnosc("")).toEqual({ min: null, max: null });
    expect(odczytajPojemnosc("dużo")).toEqual({ min: null, max: null });
    expect(odczytajPojemnosc("10, 20, 30")).toEqual({ min: null, max: null });
  });

  it("zapisana pojemność wraca do pola w tej samej postaci", () => {
    expect(pojemnoscDoPola(40, 140)).toBe("40-140");
    expect(pojemnoscDoPola(null, 140)).toBe("140");
    expect(pojemnoscDoPola(null, null)).toBe("");
    expect(odczytajPojemnosc(pojemnoscDoPola(40, 140))).toEqual({ min: 40, max: 140 });
  });
});

describe("pojemnoscNieczytelna", () => {
  it("puste pole nie jest błędem, bo pojemność jest opcjonalna", () => {
    expect(pojemnoscNieczytelna("")).toBe(false);
    expect(pojemnoscNieczytelna("   ")).toBe(false);
  });

  it("treść bez ani jednej liczby jest błędem, nie pustym polem", () => {
    expect(pojemnoscNieczytelna("do ustalenia")).toBe(true);
  });

  it("trzy liczby to błąd: nie wiadomo, która jest którą", () => {
    expect(pojemnoscNieczytelna("40, 80 i 140 osób")).toBe(true);
  });

  it("to, co da się odczytać, nie jest błędem", () => {
    expect(pojemnoscNieczytelna("140")).toBe(false);
    expect(pojemnoscNieczytelna("do 140 osób")).toBe(false);
    expect(pojemnoscNieczytelna("40-140")).toBe(false);
  });
});

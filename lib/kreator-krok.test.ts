/**
 * Na którym kroku wznawia się kreator.
 *
 * Dwie reguły, obie wyszły przy ręcznym przejściu ścieżki, nie z testów:
 *
 *   1. Odświeżenie strony nie cofa do początku. Stan jest w bazie, więc
 *      kreator ma wrócić tam, gdzie człowiek skończył.
 *   2. `?krok=` z adresu wolno spełnić **tylko w tył**. Wejście na `?krok=6`
 *      pokazywało podsumowanie firmy bez nazwy, kategorii i lokalizacji.
 *
 * Trzecia reguła wyszła dopiero w przeglądarce, już po napisaniu pozostałych:
 * zalogowany człowiek bez firmy lądował na kroku zakładania konta i nie miał
 * jak z niego wyjść, bo jego adres jest już zajęty.
 */
import { describe, expect, it } from "vitest";
import { krokDlaSzkicu, krokPoczatkowy, type SzkicKreatora } from "./kreator-krok";

const PUSTY: SzkicKreatora = {
  nazwa: "",
  opis: "",
  cenaOd: null,
  pojemnoscMin: null,
  pojemnoscMax: null,
  kategoria: null,
  miejscowosc: null,
  cityId: null,
  maNip: false,
  opublikowany: false,
};

const ZKATEGORIA: SzkicKreatora = { ...PUSTY, kategoria: "sala-weselna" };

const ZOPISEM: SzkicKreatora = {
  ...ZKATEGORIA,
  nazwa: "Dwór Pod Lipami",
  opis: "Dwór z 1890 roku, sala na 140 osób.",
  miejscowosc: "Warszawa",
  cityId: "11111111-1111-4111-8111-111111111111",
};

const KOMPLETNY: SzkicKreatora = { ...ZOPISEM, maNip: true };

describe("krok ze stanu szkicu", () => {
  it("niezalogowany zaczyna od zakładania konta", () => {
    expect(krokDlaSzkicu(null, false)).toBe(1);
    // Nawet gdyby skądś był szkic: bez konta nie ma czyj być.
    expect(krokDlaSzkicu(KOMPLETNY, false)).toBe(1);
  });

  it("zalogowany bez szkicu zaczyna od rodzaju ogłoszenia, nie od konta", () => {
    // To jest ta reguła, którą złapało dopiero przejście kreatora w przeglądarce.
    expect(krokDlaSzkicu(null, true)).toBe(2);
  });

  it("szkic bez kategorii wraca na krok kategorii", () => {
    expect(krokDlaSzkicu(PUSTY, true)).toBe(2);
  });

  it("szkic z kategorią, bez opisu, wraca na budowę profilu", () => {
    expect(krokDlaSzkicu(ZKATEGORIA, true)).toBe(3);
  });

  it("szkic bez miejscowości wraca na budowę profilu, nie idzie dalej", () => {
    // Lokalizacja należy do kroku trzeciego, więc jej brak cofa właśnie tam.
    expect(krokDlaSzkicu({ ...ZOPISEM, cityId: null }, true)).toBe(3);
  });

  it("szkic bez NIP-u wraca na dane firmy", () => {
    expect(krokDlaSzkicu(ZOPISEM, true)).toBe(4);
  });

  it("komplet danych daje krok publikacji", () => {
    expect(krokDlaSzkicu(KOMPLETNY, true)).toBe(6);
  });
});

describe("krok z adresu", () => {
  it("bez parametru bierze krok ze stanu", () => {
    expect(krokPoczatkowy(null, ZOPISEM, true)).toBe(4);
  });

  it("wolno wrócić do wcześniejszego kroku", () => {
    expect(krokPoczatkowy("2", KOMPLETNY, true)).toBe(2);
    expect(krokPoczatkowy("3", KOMPLETNY, true)).toBe(3);
  });

  it("nie wolno przeskoczyć do przodu", () => {
    // Szkic stoi na kroku 2, więc żądanie publikacji zostaje zignorowane.
    expect(krokPoczatkowy("6", PUSTY, true)).toBe(2);
    expect(krokPoczatkowy("4", ZKATEGORIA, true)).toBe(3);
  });

  it("zalogowany nie wraca na krok zakładania konta, choćby prosił", () => {
    expect(krokPoczatkowy("1", KOMPLETNY, true)).toBe(6);
    expect(krokPoczatkowy("1", null, true)).toBe(2);
  });

  it("śmieci w adresie nie wywracają kreatora", () => {
    for (const zadany of ["", "0", "-3", "abc", "5", "7", "99", "2.9", "2abc", " "]) {
      // Krok 5 (wybór planu) jest wyłączony razem z PayU, więc też nie przechodzi.
      expect(krokPoczatkowy(zadany, KOMPLETNY, true), `dla ${JSON.stringify(zadany)}`).toBe(6);
    }
  });
});

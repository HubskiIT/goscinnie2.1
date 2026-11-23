/**
 * Testy przycinania zlecenia do zakresu widza.
 *
 * To jest druga bariera obok `lib/permissions.ts`. Pierwsza decyduje, komu
 * co wolno. Ta wykonuje wyrok, zanim dane trafią do komponentu. Bariery są
 * sprawdzane osobno: tu nie testujemy tego, czy reguła jest dobra, tylko
 * tego, czy jest wykonana.
 *
 * Testy nie potrzebują bazy: `zlecenieDoPokazania` jest funkcją czystą.
 */
import { describe, expect, it } from "vitest";
import type { Zlecenie } from "@/content/ogloszenia";
import { type Widz, widocznoscZlecenia, ZAJAWKA_OPISU_ZNAKOW } from "@/lib/permissions";
import { pelnyZakresGieldy, zlecenieDoPokazania } from "@/lib/zlecenia-widok";

/**
 * Opis dłuższy niż zajawka, żeby cięcie w ogóle miało co uciąć. Przy opisie
 * krótszym od limitu zajawka i całość dałyby ten sam tekst, więc test
 * przechodziłby także wtedy, gdyby cięcia nie było wcale.
 */
const OPIS = "a".repeat(ZAJAWKA_OPISU_ZNAKOW + 260);

const ZLECENIE: Zlecenie = {
  id: "11111111-1111-4111-8111-111111111111",
  przykladowe: true,
  okazja: "komunia",
  data: "2027-05-16",
  liczbaGosci: 80,
  powiat: "wrocławski",
  opis: OPIS,
  budzetGrosze: 1_440_000,
};

const ANONIM: Widz = { rodzaj: "anonim" };
const KLIENT: Widz = { rodzaj: "klient", userId: "u-klient" };
const AUTOR: Widz = { rodzaj: "autor", userId: "u-autor" };
const FIRMA_BEZ: Widz = {
  rodzaj: "firma",
  userId: "u-firma",
  companyId: "c-firma",
  abonament: false,
};
const FIRMA_Z: Widz = {
  rodzaj: "firma",
  userId: "u-abonent",
  companyId: "c-abonent",
  abonament: true,
};

function dlaWidza(widz: Widz) {
  return zlecenieDoPokazania(ZLECENIE, widocznoscZlecenia(widz));
}

describe("budżet nie wychodzi poza kolumnę abonenta", () => {
  /*
   * Test negatywny wymaga instancji pozytywnej: gdyby budżet był ukryty
   * dla wszystkich, ten zestaw przechodziłby także po zepsuciu reguły.
   */
  it("abonent i autor dostają kwotę", () => {
    for (const widz of [FIRMA_Z, AUTOR]) {
      const wynik = dlaWidza(widz);
      expect(wynik.budzet).toEqual({ rodzaj: "jawny", grosze: 1_440_000 });
    }
  });

  it.each([
    ["anonim", ANONIM],
    ["klient", KLIENT],
    ["firma bez abonamentu", FIRMA_BEZ],
  ])("%s nie dostaje kwoty w żadnej postaci", (_nazwa, widz) => {
    const wynik = dlaWidza(widz);

    expect(wynik.budzet.rodzaj).toBe("ukryty");
    // Kwoty nie ma w strukturze, a nie: jest i bywa pomijana przy rysowaniu.
    expect(JSON.stringify(wynik)).not.toContain("1440000");
  });
});

describe("opis jest cięty przed oddaniem danych, nie przy rysowaniu", () => {
  it("abonent i autor dostają cały opis", () => {
    for (const widz of [FIRMA_Z, AUTOR]) {
      expect(dlaWidza(widz).opis).toEqual({ rodzaj: "caly", tekst: OPIS });
    }
  });

  it("firma bez abonamentu dostaje dokładnie zajawkę", () => {
    const opis = dlaWidza(FIRMA_BEZ).opis;

    expect(opis.rodzaj).toBe("zajawka");
    if (opis.rodzaj !== "zajawka") throw new Error("nieoczekiwany zakres opisu");

    expect(opis.tekst).toHaveLength(ZAJAWKA_OPISU_ZNAKOW);
    expect(opis.znakowWCalosci).toBe(OPIS.length);
    // Reszta opisu nie dojechała. To jest cała treść tego testu.
    expect(JSON.stringify(dlaWidza(FIRMA_BEZ))).not.toContain(OPIS);
  });

  it.each([
    ["anonim", ANONIM],
    ["klient", KLIENT],
  ])("%s nie dostaje opisu ani jego początku", (_nazwa, widz) => {
    const wynik = dlaWidza(widz);

    expect(wynik.opis).toEqual({ rodzaj: "brak" });
    expect(JSON.stringify(wynik)).not.toContain(OPIS.slice(0, 20));
  });
});

describe("ścieżka składania oferty", () => {
  it("jest dla abonenta i autora, bo tylko oni mają pełny zakres", () => {
    for (const widz of [FIRMA_Z, AUTOR]) {
      expect(pelnyZakresGieldy(widocznoscZlecenia(widz))).toBe(true);
    }
  });

  it.each([
    ["anonim", ANONIM],
    ["klient", KLIENT],
    ["firma bez abonamentu", FIRMA_BEZ],
  ])("nie jest dla widza: %s", (_nazwa, widz) => {
    expect(pelnyZakresGieldy(widocznoscZlecenia(widz))).toBe(false);
  });
});

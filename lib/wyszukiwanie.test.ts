import { describe, expect, it } from "vitest";
import { czySaFiltry, type KryteriaLokali } from "@/lib/wyszukiwanie";

/**
 * `czySaFiltry` rozstrzyga, którą z dwóch wiadomości zobaczy człowiek przy
 * pustej liście: „nic nie pasuje do tych filtrów" albo „nie ma jeszcze ani
 * jednego obiektu". Pomyłka w którąkolwiek stronę jest myląca: pierwsza każe
 * czyścić filtry, których nikt nie ustawił, druga wmawia pusty katalog komuś,
 * kto po prostu zawęził wyszukiwanie za bardzo.
 */

const BEZ_FILTROW: KryteriaLokali = {
  rodzaj: null,
  miejscowosc: null,
  promienKm: 25,
  goscie: null,
  termin: null,
  udogodnienia: [],
};

describe("czySaFiltry", () => {
  it("na czystym wejściu na listę nie widzi żadnego filtru", () => {
    expect(czySaFiltry(BEZ_FILTROW)).toBe(false);
  });

  /*
   * Najważniejszy przypadek w tym pliku.
   *
   * `promienKm` ma wartość domyślną, więc jest ustawiony zawsze, także gdy
   * nikt go nie dotknął. Gdyby wchodził do sumy filtrów, funkcja zwracałaby
   * prawdę przy każdym wejściu na listę i komunikat o pustym katalogu nie
   * pokazałby się nigdy. Błąd tego rodzaju nie wywala niczego i nie widać go
   * w przeglądarce, dopóki ktoś nie zacznie czytać treści komunikatów.
   */
  it("nie liczy promienia, bo ten ma wartość domyślną", () => {
    for (const promienKm of [0, 10, 25, 50]) {
      expect(czySaFiltry({ ...BEZ_FILTROW, promienKm })).toBe(false);
    }
  });

  it("rozpoznaje każdy filtr z osobna", () => {
    const pojedyncze: readonly Partial<KryteriaLokali>[] = [
      { rodzaj: "sala-weselna" },
      { miejscowosc: "wroclaw" },
      { goscie: 40 },
      { termin: "2027-05-16" },
      { udogodnienia: ["parking"] },
    ];

    for (const zmiana of pojedyncze) {
      expect(czySaFiltry({ ...BEZ_FILTROW, ...zmiana })).toBe(true);
    }
  });
});

/**
 * Strażnik konwencji warstwy zapytań o zlecenia.
 *
 * Problem, który ten plik rozwiązuje: dziś oba zapytania w
 * lib/db/queries/requests.ts wołają kontrolę uprawnień, bo tak je napisano.
 * Nic nie zmusza trzeciego, dopisanego za trzy miesiące, żeby robiło tak samo.
 * Pamięć człowieka nie jest mechanizmem kontroli.
 *
 * Rozwiązanie jest nudne i dlatego działa: test wylicza eksporty modułu i każdy
 * z nich wywołuje z widzem o szerszych uprawnieniach niż anonim, oczekując rzutu.
 * Funkcja dopisana w przyszłości jest objęta automatycznie.
 *
 * KONWENCJA, którą ten test egzekwuje: każda funkcja zapytania w tym module
 * przyjmuje widza jako pierwszy argument. Funkcja, która jej nie trzyma,
 * wywali ten test i to jest poprawny wynik, bo znaczy, że ktoś wyszedł
 * poza wzorzec i powinien to omówić, a nie przemycić.
 */
import { describe, expect, it } from "vitest";
import * as zapytaniaOfert from "@/lib/db/queries/bids";
import * as zapytaniaFirm from "@/lib/db/queries/firmy";
import * as zapytaniaZlecen from "@/lib/db/queries/requests";
import { NiezaimplementowanaGalazUprawnien, type Widz } from "@/lib/permissions";

/**
 * Widz, którego gałąź uprawnień nie jest jeszcze zaimplementowana.
 * Każde zapytanie musi się o niego wyłożyć.
 *
 * Do czasu plastra firmowego rolę tę pełniła firma bez abonamentu. Gdy firma
 * doczekała się implementacji, wartownikiem został moderator. Przy dopisywaniu
 * gałęzi moderatora trzeba będzie wybrać kolejnego, a gdy skończą się
 * niezaimplementowane gałęzie, ten test wymaga innego pomysłu: wtedy nie da się
 * już sprawdzić odmowy przez widza, którego nie ma.
 */
const WIDZ_BEZ_GALEZI: Widz = {
  rodzaj: "moderator",
  userId: "11111111-1111-4111-8111-111111111111",
};

/**
 * Argumenty dodatkowe, z zapasem, żeby trafić w sygnatury o różnej liczbie
 * parametrów. Zapytanie ma odmówić na widzu, zanim w ogóle ich dotknie.
 */
const ARGUMENTY_DODATKOWE: readonly unknown[] = [
  "33333333-3333-4333-8333-333333333333",
  {
    limit: 1,
    offset: 0,
    opis: "",
    cenaOd: null,
    pojemnoscMin: null,
    pojemnoscMax: null,
    kategorie: [],
  },
];

type DowolneZapytanie = (...argumenty: unknown[]) => unknown;

/**
 * Moduły objęte konwencją. Nowy moduł zapytań dopisuje się tutaj, inaczej
 * jego funkcje nie są przez nic pilnowane.
 */
const MODULY: Array<[string, Record<string, unknown>]> = [
  ["requests", zapytaniaZlecen],
  ["bids", zapytaniaOfert],
  ["firmy", zapytaniaFirm],
];

function funkcyjneEksporty(): Array<[string, DowolneZapytanie]> {
  return MODULY.flatMap(([modul, zawartosc]) =>
    Object.entries(zawartosc)
      .filter(([, wartosc]) => typeof wartosc === "function")
      .map(
        ([nazwa, wartosc]) =>
          [`${modul}.${nazwa}`, wartosc as DowolneZapytanie] as [string, DowolneZapytanie],
      ),
  );
}

describe("konwencja: każde zapytanie o zlecenia przechodzi przez kontrolę uprawnień", () => {
  const eksporty = funkcyjneEksporty();

  it("moduł w ogóle eksportuje jakieś zapytania", () => {
    // Gdyby refaktor rozniósł moduł na kawałki, test przestałby cokolwiek
    // sprawdzać i przechodziłby po cichu. Ten warunek temu zapobiega.
    expect(eksporty.length).toBeGreaterThan(0);
  });

  for (const [nazwa, zapytanie] of eksporty) {
    it(`${nazwa} odmawia widzowi, którego gałąź uprawnień nie istnieje`, async () => {
      let zlapany: unknown;

      try {
        // Zapytanie może rzucić od razu albo zwrócić odrzuconą obietnicę.
        // Oba przypadki są poprawne, byle nie zwróciło danych.
        await zapytanie(WIDZ_BEZ_GALEZI, ...ARGUMENTY_DODATKOWE);
      } catch (blad) {
        zlapany = blad;
      }

      expect(
        zlapany,
        `${nazwa} nie odmówiło widzowi bez zaimplementowanej gałęzi uprawnień. ` +
          "Albo brakuje w nim kontroli, albo nie przyjmuje widza jako pierwszego argumentu.",
      ).toBeInstanceOf(NiezaimplementowanaGalazUprawnien);
    });
  }
});

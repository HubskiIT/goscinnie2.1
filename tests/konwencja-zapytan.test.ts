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
import * as zapytaniaImprez from "@/lib/db/queries/imprezy";
import * as zapytaniaKatalogu from "@/lib/db/queries/katalog";
import * as zapytaniaKonta from "@/lib/db/queries/konto";
import * as zapytaniaKreatora from "@/lib/db/queries/kreator";
import * as zapytaniaModeracji from "@/lib/db/queries/moderacja";
import * as zapytaniaZlecen from "@/lib/db/queries/requests";
import * as zapytaniaSzczegolow from "@/lib/db/queries/szczegoly";
import * as zapytaniaZapytan from "@/lib/db/queries/zapytania";
import * as zapytaniaZdjec from "@/lib/db/queries/zdjecia";
import { NiezaimplementowanaGalazUprawnien, type Widz } from "@/lib/permissions";

/**
 * Widz, którego gałąź uprawnień nie istnieje. Każde zapytanie musi się
 * o niego wyłożyć.
 *
 * HISTORIA TEGO WARTOWNIKA, bo tłumaczy, czemu wygląda tak dziwnie. Rolę tę
 * pełniła kolejno firma bez abonamentu, a potem moderator — zawsze wariant
 * z typu `Widz`, który czekał na swoją gałąź. Moderator dostał ją razem
 * z kolejką moderacji i wtedy skończyły się niezaimplementowane warianty,
 * czyli dokładnie to, co zapowiadał poprzedni komentarz w tym miejscu.
 *
 * Dlatego wartownikiem jest teraz widz **spoza typu**, zbudowany rzutowaniem
 * przez `unknown`. To nie jest obejście kompilatora dla wygody: tak właśnie
 * wygląda wariant dopisany do typu `Widz` przez kogoś, kto zapomniał
 * o gałęzi w zapytaniu. TypeScript złapie brak gałęzi na przypisaniu do
 * `never`, ale dopiero przy kompilacji; ten test sprawdza, co robi działający
 * program, i odpowiedź ma brzmieć: rzuca, zanim dotknie bazy.
 *
 * Zaleta wobec poprzedniego pomysłu jest taka, że wartownik nie wygasa.
 * Nie trzeba go wymieniać przy każdej dopisanej gałęzi i nie grozi mu to,
 * że pewnego dnia zacznie przechodzić po cichu.
 */
const WIDZ_BEZ_GALEZI = {
  rodzaj: "ksiegowy",
  userId: "11111111-1111-4111-8111-111111111111",
} as unknown as Widz;

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
  ["konto", zapytaniaKonta],
  ["requests", zapytaniaZlecen],
  ["bids", zapytaniaOfert],
  ["firmy", zapytaniaFirm],
  ["kreator", zapytaniaKreatora],
  ["katalog", zapytaniaKatalogu],
  ["zdjecia", zapytaniaZdjec],
  ["moderacja", zapytaniaModeracji],
  ["szczegoly", zapytaniaSzczegolow],
  ["imprezy", zapytaniaImprez],
  ["zapytania", zapytaniaZapytan],
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

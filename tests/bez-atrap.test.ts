import { describe, expect, it } from "vitest";
import {
  pobierzImprezy,
  pobierzLokale,
  pobierzUslugodawcow,
  pobierzZlecenia,
} from "@/content/ogloszenia";

/**
 * Katalog nie pokazuje wymyślonych firm.
 *
 * Do listopada 2026 w `content/ogloszenia.ts` leżało sześć atrap, które miały
 * pokazywać działanie serwisu na pustym katalogu. Z chwilą, gdy weszły
 * prawdziwe wpisy, przestało to być pomocą, a stało się wprowadzaniem w błąd:
 * atrapa stoi na liście obok czyjejś firmy, wygląda jak konkurencja, której
 * nie ma, i nikt z zewnątrz nie ma jak odróżnić oferty od dekoracji. Plakietka
 * „ogłoszenie przykładowe" tego nie naprawia, bo mówi o statusie wpisu komuś,
 * kto przyszedł szukać sali.
 *
 * Mechanizm atrap został w kodzie celowo — pole `przykladowe`, etykieta
 * i `noindex` — więc wpisanie jednej z powrotem to dopisanie obiektu do
 * tablicy. Ten test jest barierą, która sprawia, że taki powrót jest decyzją,
 * a nie przypadkiem przy okazji innej zmiany.
 *
 * Gdyby kiedyś atrapy miały wrócić świadomie, usunięcie tego pliku jest
 * częścią tej decyzji i ma się odbyć w tym samym commicie.
 */
describe("katalog nie zawiera atrap", () => {
  it("nie ma przykładowych lokali", () => {
    expect(pobierzLokale()).toEqual([]);
  });

  it("nie ma przykładowych usługodawców", () => {
    expect(pobierzUslugodawcow()).toEqual([]);
  });

  it("nie ma przykładowych zleceń na giełdzie", () => {
    expect(pobierzZlecenia()).toEqual([]);
  });

  it("nie ma przykładowych imprez", () => {
    expect(pobierzImprezy()).toEqual([]);
  });

  /*
   * Bariera osobna od czterech powyższych i celowo nadmiarowa.
   *
   * Tamte sprawdzają liczność, ta treść. Wpis bez `przykladowe: true`, czyli
   * atrapa podająca się za prawdziwą firmę, przeszedłby przez tamte jako
   * zwykły brak pustki, a to jest gorszy przypadek niż atrapa oznaczona:
   * nie dostałby ani plakietki, ani `noindex`, więc trafiłby do wyszukiwarek
   * jako istniejąca firma.
   */
  it("żaden wpis nie udaje prawdziwej firmy", () => {
    const wszystkie = [
      ...pobierzLokale(),
      ...pobierzUslugodawcow(),
      ...pobierzZlecenia(),
      ...pobierzImprezy(),
    ];

    expect(wszystkie.filter((wpis) => !wpis.przykladowe)).toEqual([]);
  });
});

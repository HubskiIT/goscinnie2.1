/**
 * Odnośniki do profilu firmy po slugu wpisanym na sztywno.
 *
 * Reguła: adres `/f/<slug>` powstaje **ze slugu, który kod ma w ręku**, nigdy
 * z nazwy wklepanej w JSX. Napisany wprost przeżywa usunięcie wpisu, do którego
 * prowadzi, i nikt się o tym nie dowiaduje, bo kod się kompiluje, testy
 * przechodzą, a strona wygląda normalnie aż do kliknięcia.
 *
 * Tak właśnie było: po wyczyszczeniu atrap siedem miejsc dalej prowadziło do
 * `/f/dwor-pod-lipami`, między innymi przycisk „Wyślij zapytanie do listy”
 * w katalogu, który pokazuje się dopiero po odłożeniu lokalu na bok, czyli
 * trafiłby w niego pierwszy realnie zainteresowany klient.
 *
 * Nie wymaga bazy.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PRZESZUKIWANE = ["app", "components"];

/**
 * Ekrany prototypu panelu, świadomie zostawione z atrapami.
 *
 * CLAUDE.md mówi wprost, że ekrany czytają jeszcze z `content/`, a podłączenie
 * ich do bazy to Etap 6. Te trzy pokazują dane zmyślonej firmy komuś, kto jest
 * już zalogowany, więc poprawianie w nich samego odnośnika niczego nie
 * naprawia: nazwa firmy, miejscowość i data abonamentu obok niego i tak są
 * nieprawdziwe. Wchodzą do naprawy razem, przy podłączaniu panelu do danych.
 *
 * Lista jest zamknięta i ma się kurczyć. Nowy plik z takim odnośnikiem wywali
 * ten test i to jest poprawny wynik.
 */
const PROTOTYP_PANELU = [
  join("components", "Header.tsx"),
  join("components", "screens", "PanelFirmyScreen.tsx"),
  join("components", "screens", "ProfilScreen.tsx"),
  join("components", "screens", "ImprezaScreen.tsx"),
];

/**
 * Atrybut `href` z adresem profilu, w którym po `/f/` nie stoi wstawka `${…}`.
 *
 * Wzorzec zaczepiony o `href`, a nie o sam adres, i to celowo: pierwsza wersja
 * szukała samego `/f/<cokolwiek>` i zapalała się na komentarzach, które
 * tłumaczą, jaki adres tu wcześniej stał. Test, który karze za opisanie
 * usuniętego błędu, zachęca do usuwania opisów.
 */
const ODNOSNIK_NA_SZTYWNO = /href=\{?["'`]\/f\/(?!\$\{)[a-z0-9-]+/g;

function pliki(katalog: string): string[] {
  return readdirSync(katalog).flatMap((wpis) => {
    const sciezka = join(katalog, wpis);
    if (statSync(sciezka).isDirectory()) return pliki(sciezka);
    return /\.tsx?$/.test(wpis) ? [sciezka] : [];
  });
}

describe("konwencja: żaden odnośnik do profilu nie ma slugu wpisanego na sztywno", () => {
  const wszystkie = PRZESZUKIWANE.flatMap(pliki);

  it("w ogóle znajduje pliki, bo inaczej ten test przechodziłby pusty", () => {
    // Literówka w nazwie katalogu zamieniłaby cały ten opis w zawsze zielony.
    expect(wszystkie.length).toBeGreaterThan(50);
  });

  it("poza prototypem panelu nie ma takich odnośników", () => {
    const znalezione: string[] = [];

    for (const plik of wszystkie) {
      if (PROTOTYP_PANELU.includes(plik)) continue;
      for (const trafienie of readFileSync(plik, "utf8").matchAll(ODNOSNIK_NA_SZTYWNO)) {
        znalezione.push(`${plik}: ${trafienie[0].slice(1)}`);
      }
    }

    expect(znalezione).toEqual([]);
  });

  it("wyjątki na liście są prawdziwe, a nie przepisane z pamięci", () => {
    /*
     * Instancja pozytywna dla testu wyżej. Gdyby ktoś posprzątał prototyp
     * panelu i nie skreślił pliku z listy, test wyżej przechodziłby dalej,
     * ale już bez powodu, i następny wpisany na sztywno odnośnik w tym pliku
     * przeszedłby razem z nim.
     */
    const bezPowodu = PROTOTYP_PANELU.filter(
      // Świeże wyrażenie na każdy plik: `test` na wzorcu z flagą `g` przesuwa
      // `lastIndex` i następne wywołanie szuka dalej, nie od początku.
      (plik) => !new RegExp(ODNOSNIK_NA_SZTYWNO.source).test(readFileSync(plik, "utf8")),
    );

    expect(bezPowodu).toEqual([]);
  });
});

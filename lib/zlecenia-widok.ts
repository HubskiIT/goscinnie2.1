/**
 * Zamiana zlecenia na to, co wolno pokazać temu widzowi.
 *
 * PO CO OSOBNY MODUŁ. Reguła „co kto widzi” ma być stosowana zanim dane
 * dojdą do komponentu, a nie przez ukrywanie pól w JSX. Ekran giełdy do
 * niedawna dostawał pełne zlecenie i sam decydował, co narysować, a tym,
 * co zobaczy człowiek, sterował przełącznik w pasku na górze strony. Taki
 * przełącznik to nie uprawnienia, tylko prośba, żeby nie patrzeć: pełny
 * opis i budżet jechały do przeglądarki dla każdego.
 *
 * Funkcja jest czysta. Dostaje zlecenie i wynik `widocznoscZlecenia`,
 * oddaje strukturę bez pól, które odpadły. Nie zna sesji ani bazy, więc
 * da się ją sprawdzić bez jednej i drugiej.
 *
 * Czego tu NIE MA: decyzji o tym, kto co widzi. Ta mieszka wyłącznie
 * w `lib/permissions.ts`. Tutaj jest wykonanie wyroku, nie wyrok.
 */
import type { Zlecenie } from "@/content/ogloszenia";
import type { WidocznoscZlecenia } from "@/lib/permissions";

/**
 * Opis zlecenia w zakresie, jaki przysługuje widzowi.
 *
 * Suma rozłączna, a nie tekst z flagą. Przy `{ tekst: string; caly: boolean }`
 * brak opisu i pusty opis byłyby tym samym stanem, a to dwie różne rzeczy:
 * anonim nie dostaje opisu w ogóle, a firma bez abonamentu dostaje początek.
 */
export type OpisDoPokazania =
  | { rodzaj: "brak" }
  | { rodzaj: "zajawka"; tekst: string; znakowWCalosci: number }
  | { rodzaj: "caly"; tekst: string };

/**
 * Budżet w zakresie, jaki przysługuje widzowi.
 *
 * `ukryty` i `jawny` z wartością `null` to dwa różne stany. Pierwszy znaczy
 * „nie masz prawa wiedzieć”, drugi „klient nie podał”. Zwinięte w jedno
 * `number | null` dałyby firmie bez abonamentu komunikat „nie podano”,
 * czyli informację, której nie miała dostać.
 */
export type BudzetDoPokazania = { rodzaj: "ukryty" } | { rodzaj: "jawny"; grosze: number | null };

export interface ZlecenieDoPokazania {
  id: string;
  przykladowe: boolean;
  okazja: string;
  data: string;
  liczbaGosci: number;
  powiat: string;
  opis: OpisDoPokazania;
  budzet: BudzetDoPokazania;
}

/**
 * Przycina zlecenie do zakresu widza.
 *
 * Zajawka jest cięta po znakach, bo tyle obiecuje `ZAJAWKA_OPISU_ZNAKOW`
 * w regule. Liczbę znaków całego opisu zostawiamy, żeby ekran mógł napisać
 * „widzisz 120 ze 380” — sama długość nie zdradza treści, a bez niej ten
 * komunikat musiałby zmyślać drugą liczbę.
 */
export function zlecenieDoPokazania(
  zlecenie: Zlecenie,
  widocznosc: WidocznoscZlecenia,
): ZlecenieDoPokazania {
  return {
    id: zlecenie.id,
    przykladowe: zlecenie.przykladowe,
    okazja: zlecenie.okazja,
    data: zlecenie.data,
    liczbaGosci: zlecenie.liczbaGosci,
    powiat: zlecenie.powiat,
    opis: opisDoPokazania(zlecenie.opis, widocznosc),
    budzet: widocznosc.budzet
      ? { rodzaj: "jawny", grosze: zlecenie.budzetGrosze }
      : { rodzaj: "ukryty" },
  };
}

function opisDoPokazania(opis: string, widocznosc: WidocznoscZlecenia): OpisDoPokazania {
  switch (widocznosc.opis.rodzaj) {
    case "brak":
      return { rodzaj: "brak" };

    case "zajawka":
      return {
        rodzaj: "zajawka",
        tekst: opis.slice(0, widocznosc.opis.znakow),
        znakowWCalosci: opis.length,
      };

    case "caly":
      return { rodzaj: "caly", tekst: opis };

    default: {
      // Nowy wariant zakresu opisu bez gałęzi tutaj zerwie kompilację.
      const nigdy: never = widocznosc.opis;
      throw new Error(`Nieobsłużony zakres opisu: ${String(nigdy)}`);
    }
  }
}

/**
 * Czy ten widz jest po stronie giełdy, która składa oferty.
 *
 * Nie jest to nowa decyzja o uprawnieniach, tylko odczyt tej, która już
 * zapadła: pełny opis razem z budżetem ma wyłącznie kolumna abonenta
 * i autora. Autor własnego zlecenia nie składa na nie oferty, więc
 * rozstrzyga o tym jeszcze `mozeZlozycOferte` po stronie akcji — tutaj
 * decydujemy tylko o tym, czy w ogóle rysować przycisk.
 */
export function pelnyZakresGieldy(widocznosc: WidocznoscZlecenia): boolean {
  return widocznosc.opis.rodzaj === "caly" && widocznosc.budzet;
}

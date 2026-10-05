import {
  type Impreza,
  pobierzImprezy,
  pobierzLokal,
  pobierzZlecenia,
  type Zlecenie,
} from "@/content/ogloszenia";

/**
 * Filtry giełdy zleceń i listy imprez. Tak samo jak przy lokalach: stan żyje
 * w adresie, formularz jest zwykłym GET, a filtrowanie dzieje się na serwerze.
 *
 * Filtrujemy wyłącznie po tym, co naprawdę jest w danych. Pasek z polami,
 * których nie ma czym obsłużyć, wygląda jak działający i nie działa.
 */

export const PARAMETRY_ZLECEN = {
  okazja: "okazja",
  powiat: "powiat",
  od: "od",
  do: "do",
} as const;

export const PARAMETRY_IMPREZ = {
  okazja: "okazja",
  miejscowosc: "m",
  od: "od",
  do: "do",
} as const;

export interface KryteriaZlecen {
  okazja: string | null;
  powiat: string | null;
  od: string | null;
  do: string | null;
}

export interface KryteriaImprez {
  okazja: string | null;
  miejscowosc: string | null;
  od: string | null;
  do: string | null;
}

type Wejscie = Record<string, string | string[] | undefined>;

function jeden(wartosc: string | string[] | undefined): string | null {
  if (wartosc === undefined) return null;
  const tekst = Array.isArray(wartosc) ? wartosc[0] : wartosc;
  if (tekst === undefined) return null;
  const przyciete = tekst.trim();
  return przyciete === "" ? null : przyciete;
}

function bezZnakow(tekst: string): string {
  return tekst.toLowerCase().replaceAll("ł", "l").normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Data wydarzenia mieści się w widełkach od–do, gdy któreś z nich podano. */
function wTerminie(data: string, od: string | null, doKiedy: string | null): boolean {
  if (od !== null && data < od) return false;
  if (doKiedy !== null && data > doKiedy) return false;
  return true;
}

export function odczytajKryteriaZlecen(parametry: Wejscie): KryteriaZlecen {
  return {
    okazja: jeden(parametry[PARAMETRY_ZLECEN.okazja]),
    powiat: jeden(parametry[PARAMETRY_ZLECEN.powiat]),
    od: jeden(parametry[PARAMETRY_ZLECEN.od]),
    do: jeden(parametry[PARAMETRY_ZLECEN.do]),
  };
}

export function wyszukajZlecenia(kryteria: KryteriaZlecen): readonly Zlecenie[] {
  return pobierzZlecenia().filter((zlecenie) => {
    if (kryteria.okazja !== null && zlecenie.okazja !== kryteria.okazja) return false;
    if (
      kryteria.powiat !== null &&
      !bezZnakow(zlecenie.powiat).includes(bezZnakow(kryteria.powiat))
    ) {
      return false;
    }
    return wTerminie(zlecenie.data, kryteria.od, kryteria.do);
  });
}

export function odczytajKryteriaImprez(parametry: Wejscie): KryteriaImprez {
  return {
    okazja: jeden(parametry[PARAMETRY_IMPREZ.okazja]),
    miejscowosc: jeden(parametry[PARAMETRY_IMPREZ.miejscowosc]),
    od: jeden(parametry[PARAMETRY_IMPREZ.od]),
    do: jeden(parametry[PARAMETRY_IMPREZ.do]),
  };
}

export function wyszukajImprezy(kryteria: KryteriaImprez): readonly Impreza[] {
  return pobierzImprezy().filter((impreza) => {
    if (kryteria.okazja !== null && impreza.okazja !== kryteria.okazja) return false;
    if (kryteria.miejscowosc !== null) {
      const lokal = pobierzLokal(impreza.lokalSlug);
      if (lokal === undefined) return false;
      if (!bezZnakow(lokal.miejscowosc.nazwa).includes(bezZnakow(kryteria.miejscowosc))) {
        return false;
      }
    }
    return wTerminie(impreza.data, kryteria.od, kryteria.do);
  });
}

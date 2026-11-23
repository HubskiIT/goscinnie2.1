/**
 * Zamiana zapisanych szczegółów na wartości pól formularza.
 *
 * Formularz operuje napisami, baza liczbami, wartościami logicznymi
 * i wartościami słownikowymi. To tłumaczenie musi istnieć i ma istnieć
 * w jednym miejscu, bo robione przy okazji w komponencie rozjeżdża się
 * z tym, co przyjmuje Zod, a objawia się pustym polem przy zapisanej
 * odpowiedzi.
 *
 * Funkcja jest czysta: dostaje szczegóły, oddaje mapę napisów.
 *
 * TRZY STANY, NIE DWA. `null` w bazie znaczy „bez odpowiedzi” i musi dać
 * pusty napis, czyli pozycję „Bez odpowiedzi” na liście. Wartość logiczna
 * `false` znaczy „nie” i musi dać napis „nie”. Zwinięcie obu do pustego
 * pola kasowałoby odpowiedzi przeczące przy każdym powrocie do kreatora:
 * sala bez klimatyzacji po wejściu w krok piąty i zapisaniu go znów
 * nie wiedziałaby, czy ją ma.
 */
import type { SzczegolyFirmy } from "@/lib/db/queries/szczegoly";

export type WartosciPol = Record<string, string>;

/** Liczba albo pusty napis. Zero jest liczbą i ma zostać zerem. */
function liczba(wartosc: number | null): string {
  return wartosc === null ? "" : String(wartosc);
}

/** Trójstan na napis: brak odpowiedzi daje pustą pozycję listy. */
function takNie(wartosc: boolean | null): string {
  if (wartosc === null) return "";
  return wartosc ? "tak" : "nie";
}

/** Kwota w groszach na złotówki do pola. Bez grosza, bo pola są całkowite. */
function zlotowki(grosze: number | null): string {
  return grosze === null ? "" : String(Math.round(grosze / 100));
}

export function wartosciSzczegolowDoFormularza(szczegoly: SzczegolyFirmy): WartosciPol {
  if (szczegoly.rodzaj === "venue") {
    const l = szczegoly.lokal;
    if (!l) return {};

    return {
      miejscPrzyStolach: liczba(l.miejscPrzyStolach),
      miejscNaStojaco: liczba(l.miejscNaStojaco),
      minimumGosci: liczba(l.minimumGosci),
      minimumKwota: zlotowki(l.minimumKwota),
      wylacznosc: takNie(l.wylacznosc),
      kuchnia: l.kuchnia ?? "",
      alkohol: l.alkohol ?? "",
      korkowe: zlotowki(l.korkowe),
      parking: l.parking ?? "",
      miejscParkingowych: liczba(l.miejscParkingowych),
      nocleg: l.nocleg ?? "",
      pokoi: liczba(l.pokoi),
      /*
       * Postgres oddaje `time` jako „23:00:00”, a pole `type="time"`
       * przyjmuje „23:00”. Bez ucięcia sekund przeglądarka odrzuca
       * wartość po cichu i pole staje puste przy zapisanej godzinie.
       */
      muzykaDo: l.muzykaDo ? l.muzykaDo.slice(0, 5) : "",
      teren: l.teren ?? "",
      dlaDzieci: l.dlaDzieci ?? "",
      wejscieBezSchodow: takNie(l.wejscieBezSchodow),
      toaletaPrzystosowana: takNie(l.toaletaPrzystosowana),
      winda: takNie(l.winda),
      klimatyzacja: takNie(l.klimatyzacja),
    };
  }

  if (szczegoly.rodzaj === "service") {
    const u = szczegoly.uslugodawca;
    if (!u) return {};

    return {
      zasiegKm: liczba(u.zasiegKm),
      dojazd: u.dojazd ?? "",
      stawkaZaKm: zlotowki(u.stawkaZaKm),
      godzinWPakiecie: liczba(u.godzinWPakiecie),
      cenaNadgodziny: zlotowki(u.cenaNadgodziny),
      rodzajZaliczki: u.rodzajZaliczki ?? "",
      /*
       * Wartość zaliczki jest raz procentem, raz groszami, zależnie od
       * `rodzajZaliczki`. Formularz pokazuje procent jako procent,
       * a kwotę w złotówkach, bo w takich jednostkach ją wpisano.
       */
      wartoscZaliczki:
        u.rodzajZaliczki === "kwota" ? zlotowki(u.wartoscZaliczki) : liczba(u.wartoscZaliczki),
      zaliczkaWDni: liczba(u.zaliczkaWDni),
      zwrotZaliczki: u.zwrotZaliczki ?? "",
      rezerwacjeNaMiesiecy: liczba(u.rezerwacjeNaMiesiecy),
      wydarzenDziennie: liczba(u.wydarzenDziennie),
      materialPoTygodniach: liczba(u.materialPoTygodniach),
      zastepstwo: takNie(u.zastepstwo),
      fakturaVat: takNie(u.fakturaVat),
    };
  }

  return {};
}

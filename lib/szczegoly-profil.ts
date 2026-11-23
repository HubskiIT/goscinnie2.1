/**
 * Zamiana szczegółów wpisu na listę „pytanie: odpowiedź” do pokazania
 * na profilu.
 *
 * PO CO OSOBNY MODUŁ. To jest jedyne miejsce, w którym wartości słownikowe
 * z bazy („tak-z-korkowym”, „obcy-catering”) zamieniają się w zdania po
 * polsku. Rozsiane po komponencie dałyby ten sam napis w dwóch wersjach
 * zależnie od ekranu, a funkcja czysta daje się sprawdzić bez bazy
 * i bez rysowania czegokolwiek.
 *
 * PYTANIE BEZ ODPOWIEDZI SIĘ NIE POKAZUJE. Nie jako „brak danych”, nie
 * jako kreska: po prostu go nie ma. Profil ma mówić, co wiadomo, a nie
 * wyliczać, czego firma nie uzupełniła. Lista braków jest narzędziem
 * kreatora i moderacji, nie treścią dla gościa.
 */
import { zlote } from "@/content/format";
import type { SzczegolyFirmy } from "@/lib/db/queries/szczegoly";

export type Odpowiedz = { pytanie: string; odpowiedz: string };
export type GrupaOdpowiedzi = { tytul: string; odpowiedzi: readonly Odpowiedz[] };

function takNie(wartosc: boolean | null): string | null {
  if (wartosc === null) return null;
  return wartosc ? "tak" : "nie";
}

/** Dokłada odpowiedź do grupy, pomijając puste. */
function dodaj(lista: Odpowiedz[], pytanie: string, odpowiedz: string | null): void {
  if (odpowiedz !== null && odpowiedz !== "") lista.push({ pytanie, odpowiedz });
}

/** Grupa trafia na profil tylko wtedy, gdy ma co pokazać. */
function grupa(tytul: string, odpowiedzi: Odpowiedz[]): GrupaOdpowiedzi[] {
  return odpowiedzi.length > 0 ? [{ tytul, odpowiedzi }] : [];
}

const NAZWA_KUCHNI: Record<string, string> = {
  wlasna: "własna kuchnia",
  "obcy-catering": "można wnieść obcy catering",
  "tylko-nasz": "tylko catering lokalu",
};

const NAZWA_PARKINGU: Record<string, string> = {
  brak: "brak",
  bezplatny: "bezpłatny przy obiekcie",
  platny: "płatny",
  uliczny: "tylko uliczny",
};

const NAZWA_NOCLEGU: Record<string, string> = {
  brak: "brak",
  "na-miejscu": "pokoje na miejscu",
  "w-poblizu": "w pobliżu",
};

const NAZWA_TERENU: Record<string, string> = {
  brak: "brak",
  ogrod: "ogród",
  taras: "taras",
  plener: "plener",
};

const NAZWA_DLA_DZIECI: Record<string, string> = {
  brak: "nic z tego",
  kacik: "kącik zabaw w środku",
  "plac-zabaw": "plac zabaw na zewnątrz",
};

const NAZWA_DOJAZDU: Record<string, string> = {
  "w-cenie": "zawsze w cenie",
  "w-cenie-do-limitu": "w cenie w granicach zasięgu",
  platny: "płatny za kilometr",
};

export function szczegolyNaProfil(szczegoly: SzczegolyFirmy): readonly GrupaOdpowiedzi[] {
  if (szczegoly.rodzaj === "venue") return grupyLokalu(szczegoly.lokal);
  if (szczegoly.rodzaj === "service") {
    return grupyUslugodawcy(szczegoly.uslugodawca, szczegoly.wCenie);
  }
  return [];
}

type Lokal = Extract<SzczegolyFirmy, { rodzaj: "venue" }>["lokal"];
type Uslugodawca = Extract<SzczegolyFirmy, { rodzaj: "service" }>["uslugodawca"];

function grupyLokalu(l: Lokal): readonly GrupaOdpowiedzi[] {
  if (!l) return [];

  const pojemnosc: Odpowiedz[] = [];
  dodaj(pojemnosc, "Przy stołach", l.miejscPrzyStolach ? `${l.miejscPrzyStolach} osób` : null);
  dodaj(pojemnosc, "Na stojąco", l.miejscNaStojaco ? `${l.miejscNaStojaco} osób` : null);
  dodaj(pojemnosc, "Minimum gości", l.minimumGosci ? `${l.minimumGosci} osób` : null);
  dodaj(pojemnosc, "Minimalne obciążenie", l.minimumKwota ? zlote(l.minimumKwota) : null);
  dodaj(pojemnosc, "Sala na wyłączność", takNie(l.wylacznosc));

  const jedzenie: Odpowiedz[] = [];
  dodaj(jedzenie, "Kuchnia", l.kuchnia ? (NAZWA_KUCHNI[l.kuchnia] ?? null) : null);
  dodaj(
    jedzenie,
    "Własny alkohol",
    l.alkohol === "nie"
      ? "nie wolno"
      : l.alkohol === "tak-bez-oplaty"
        ? "wolno, bez opłaty"
        : l.alkohol === "tak-z-korkowym"
          ? /*
             * Korkowe doklejamy do tej samej odpowiedzi, zamiast dawać mu
             * osobny wiersz. „Wolno” i „30 zł” w dwóch miejscach czyta się
             * jak dwie niezwiązane informacje, a to jest jedna.
             */
            l.korkowe
            ? `wolno, korkowe ${zlote(l.korkowe)} od butelki`
            : "wolno, za korkowe"
          : null,
  );

  const dojazd: Odpowiedz[] = [];
  dodaj(
    dojazd,
    "Parking",
    l.parking
      ? l.miejscParkingowych
        ? `${NAZWA_PARKINGU[l.parking]}, ${l.miejscParkingowych} miejsc`
        : (NAZWA_PARKINGU[l.parking] ?? null)
      : null,
  );
  dodaj(
    dojazd,
    "Nocleg",
    l.nocleg
      ? l.nocleg === "na-miejscu" && l.pokoi
        ? `pokoje na miejscu, ${l.pokoi}`
        : (NAZWA_NOCLEGU[l.nocleg] ?? null)
      : null,
  );

  const przebieg: Odpowiedz[] = [];
  dodaj(przebieg, "Muzyka do", l.muzykaDo ? l.muzykaDo.slice(0, 5) : null);
  dodaj(przebieg, "Teren zewnętrzny", l.teren ? (NAZWA_TERENU[l.teren] ?? null) : null);
  dodaj(przebieg, "Dla dzieci", l.dlaDzieci ? (NAZWA_DLA_DZIECI[l.dlaDzieci] ?? null) : null);
  dodaj(przebieg, "Klimatyzacja", takNie(l.klimatyzacja));

  const dostepnosc: Odpowiedz[] = [];
  dodaj(dostepnosc, "Wejście bez schodów", takNie(l.wejscieBezSchodow));
  dodaj(dostepnosc, "Toaleta przystosowana", takNie(l.toaletaPrzystosowana));
  dodaj(dostepnosc, "Winda", takNie(l.winda));

  return [
    ...grupa("Pojemność i zasady", pojemnosc),
    ...grupa("Jedzenie i alkohol", jedzenie),
    ...grupa("Dojazd i nocleg", dojazd),
    ...grupa("Przebieg imprezy", przebieg),
    ...grupa("Dostępność", dostepnosc),
  ];
}

function grupyUslugodawcy(u: Uslugodawca, wCenie: readonly string[]): readonly GrupaOdpowiedzi[] {
  const zasieg: Odpowiedz[] = [];
  const czas: Odpowiedz[] = [];
  const warunki: Odpowiedz[] = [];

  if (u) {
    dodaj(zasieg, "Zasięg dojazdu", u.zasiegKm ? `do ${u.zasiegKm} km` : null);
    dodaj(
      zasieg,
      "Dojazd",
      u.dojazd
        ? u.dojazd === "platny" && u.stawkaZaKm
          ? `płatny, ${zlote(u.stawkaZaKm)} za kilometr`
          : (NAZWA_DOJAZDU[u.dojazd] ?? null)
        : null,
    );

    dodaj(czas, "W cenie podstawowej", u.godzinWPakiecie ? `${u.godzinWPakiecie} godz.` : null);
    dodaj(czas, "Godzina ponad pakiet", u.cenaNadgodziny ? zlote(u.cenaNadgodziny) : null);
    dodaj(
      czas,
      "Gotowy materiał po",
      u.materialPoTygodniach ? `${u.materialPoTygodniach} tygodniach` : null,
    );
    dodaj(
      czas,
      "Rezerwacje na",
      u.rezerwacjeNaMiesiecy ? `${u.rezerwacjeNaMiesiecy} miesięcy w przód` : null,
    );
    dodaj(czas, "Wydarzeń dziennie", u.wydarzenDziennie ? String(u.wydarzenDziennie) : null);

    dodaj(
      warunki,
      "Zaliczka",
      u.wartoscZaliczki === null
        ? null
        : u.rodzajZaliczki === "procent"
          ? `${u.wartoscZaliczki}% ceny`
          : zlote(u.wartoscZaliczki),
    );
    dodaj(warunki, "Termin wpłaty", u.zaliczkaWDni ? `${u.zaliczkaWDni} dni od rezerwacji` : null);
    dodaj(warunki, "Zwrot zaliczki", u.zwrotZaliczki);
    dodaj(warunki, "Zastępstwo w razie choroby", takNie(u.zastepstwo));
    dodaj(warunki, "Faktura VAT", takNie(u.fakturaVat));
  }

  const wCenieOdpowiedzi: Odpowiedz[] =
    wCenie.length > 0 ? [{ pytanie: "W cenie", odpowiedz: wCenie.join(", ") }] : [];

  return [
    ...grupa("Dojazd", zasieg),
    ...grupa("Co jest w cenie", wCenieOdpowiedzi),
    ...grupa("Czas i terminy", czas),
    ...grupa("Warunki", warunki),
  ];
}

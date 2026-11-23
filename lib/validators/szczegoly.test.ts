/**
 * Testy walidacji szczegółów wpisu.
 *
 * Dwie różne reguły biznesowe, celowo rozdzielone na dwa bloki, bo mylenie
 * ich jest tu najłatwiejszym błędem:
 *
 *   1. Spójność odpowiedzi. Korkowe tylko przy alkoholu za opłatą, pokoje
 *      tylko przy noclegu na miejscu, stawka za kilometr tylko przy
 *      dojeździe płatnym. Te same trzy warunki stoją jako CHECK w migracji
 *      0016 i to jest nadmiarowość policzona: baza broni się przed każdym
 *      zapisem, Zod mówi człowiekowi, co poprawić.
 *
 *   2. Gotowość do publikacji. Osobna funkcja, nie schemat, bo kreator ma
 *      pozwalać zapisać połowę i wrócić później.
 *
 * Bez bazy: wszystko tu jest czyste.
 */
import { describe, expect, it } from "vitest";
import {
  brakiLokalu,
  brakiUslugodawcy,
  type SzczegolyLokalu,
  type SzczegolyUslugodawcy,
  szczegolyLokalu,
  szczegolyUslugodawcy,
} from "@/lib/validators/szczegoly";

function bledyPola(wynik: { success: boolean; error?: unknown }, pole: string): number {
  if (wynik.success) return 0;
  const blad = wynik.error as { issues: Array<{ path: Array<string | number> }> };
  return blad.issues.filter((i) => i.path[0] === pole).length;
}

describe("lokal: spójność odpowiedzi", () => {
  it("pusty formularz przechodzi, bo kreator pozwala dokończyć później", () => {
    const wynik = szczegolyLokalu.safeParse({});
    expect(wynik.success).toBe(true);
    if (wynik.success) {
      // Puste znaczy „jeszcze nie odpowiedziano”, a nie „nie ma”.
      expect(wynik.data.parking).toBeNull();
      expect(wynik.data.klimatyzacja).toBeNull();
    }
  });

  it("korkowe przechodzi przy alkoholu za opłatą", () => {
    /*
     * Instancja pozytywna przed negatywną. Bez niej reguła odrzucająca
     * korkowe zawsze przeszłaby wszystkie przypadki negatywne niżej.
     */
    const wynik = szczegolyLokalu.safeParse({ alkohol: "tak-z-korkowym", korkowe: "30" });
    expect(wynik.success).toBe(true);
  });

  it.each([["nie"], ["tak-bez-oplaty"], [""]])("korkowe odpada przy alkoholu „%s”", (alkohol) => {
    const wynik = szczegolyLokalu.safeParse({ alkohol, korkowe: "30" });
    expect(wynik.success).toBe(false);
    expect(bledyPola(wynik, "korkowe")).toBe(1);
  });

  it("pokoje przechodzą przy noclegu na miejscu i odpadają przy jego braku", () => {
    expect(szczegolyLokalu.safeParse({ nocleg: "na-miejscu", pokoi: "12" }).success).toBe(true);
    expect(szczegolyLokalu.safeParse({ nocleg: "brak", pokoi: "12" }).success).toBe(false);
  });

  it("miejsca parkingowe odpadają, gdy parkingu nie ma", () => {
    expect(
      szczegolyLokalu.safeParse({ parking: "bezplatny", miejscParkingowych: "40" }).success,
    ).toBe(true);
    expect(szczegolyLokalu.safeParse({ parking: "brak", miejscParkingowych: "40" }).success).toBe(
      false,
    );
  });

  it("minimum gości nie może przekroczyć liczby miejsc", () => {
    expect(
      szczegolyLokalu.safeParse({ miejscPrzyStolach: "100", minimumGosci: "80" }).success,
    ).toBe(true);
    expect(
      szczegolyLokalu.safeParse({ miejscPrzyStolach: "80", minimumGosci: "100" }).success,
    ).toBe(false);
  });

  it("godzina ciszy musi wyglądać jak godzina", () => {
    expect(szczegolyLokalu.safeParse({ muzykaDo: "23:00" }).success).toBe(true);
    expect(szczegolyLokalu.safeParse({ muzykaDo: "25:00" }).success).toBe(false);
    expect(szczegolyLokalu.safeParse({ muzykaDo: "do północy" }).success).toBe(false);
  });

  it("trójstan rozróżnia „nie” od braku odpowiedzi", () => {
    /*
     * Najważniejszy przypadek w tym bloku. Przy polu wyboru zamiast listy
     * nieodhaczone byłoby nieodróżnialne od niezadanego pytania i profil
     * każdej firmy, która tu nie doszła, twierdziłby, że sala nie ma
     * klimatyzacji i nie jest dostępna dla wózków.
     */
    const brak = szczegolyLokalu.safeParse({});
    const nie = szczegolyLokalu.safeParse({ klimatyzacja: "nie" });
    const tak = szczegolyLokalu.safeParse({ klimatyzacja: "tak" });

    expect(brak.success && brak.data.klimatyzacja).toBeNull();
    expect(nie.success && nie.data.klimatyzacja).toBe(false);
    expect(tak.success && tak.data.klimatyzacja).toBe(true);
  });
});

describe("usługodawca: spójność odpowiedzi", () => {
  it("stawka za kilometr przechodzi przy dojeździe płatnym", () => {
    expect(szczegolyUslugodawcy.safeParse({ dojazd: "platny", stawkaZaKm: "2" }).success).toBe(
      true,
    );
  });

  it.each([["w-cenie"], ["w-cenie-do-limitu"], [""]])(
    "stawka za kilometr odpada przy dojeździe „%s”",
    (dojazd) => {
      expect(szczegolyUslugodawcy.safeParse({ dojazd, stawkaZaKm: "2" }).success).toBe(false);
    },
  );

  it("zaliczka w procentach mieści się między 1 a 100", () => {
    expect(
      szczegolyUslugodawcy.safeParse({ rodzajZaliczki: "procent", wartoscZaliczki: "30" }).success,
    ).toBe(true);
    expect(
      szczegolyUslugodawcy.safeParse({ rodzajZaliczki: "procent", wartoscZaliczki: "300" }).success,
    ).toBe(false);
  });

  it("kwotowa zaliczka może być większa niż sto", () => {
    // Inaczej granica procentu zjadłaby zaliczkę w złotówkach, a 500 zł
    // zaliczki to normalna kwota.
    expect(
      szczegolyUslugodawcy.safeParse({ rodzajZaliczki: "kwota", wartoscZaliczki: "50000" }).success,
    ).toBe(true);
  });

  it("wartość zaliczki bez wybranego rodzaju odpada", () => {
    // Samo „50” nie znaczy nic: raz pięćdziesiąt procent, raz pięćdziesiąt
    // groszy, a obie liczby idą do tej samej kolumny.
    expect(szczegolyUslugodawcy.safeParse({ wartoscZaliczki: "50" }).success).toBe(false);
  });
});

describe("gotowość lokalu do publikacji", () => {
  const KOMPLETNY: Partial<SzczegolyLokalu> = {
    miejscPrzyStolach: 120,
    wylacznosc: true,
    kuchnia: "wlasna",
    alkohol: "tak-z-korkowym",
    parking: "bezplatny",
    nocleg: "brak",
    muzykaDo: "23:00",
  };

  it("komplet nie zgłasza braków", () => {
    expect(brakiLokalu(KOMPLETNY)).toEqual([]);
  });

  it("pusty wpis zgłasza wszystkie braki naraz", () => {
    // Lista, nie wartość logiczna: człowiek ma zobaczyć, czego brakuje,
    // a nie „uzupełnij wpis”.
    expect(brakiLokalu({}).length).toBe(7);
  });

  it("same miejsca na stojąco wystarczą", () => {
    /*
     * Plener nie ma stołów, a sala konferencyjna nie przyjmuje gości
     * na stojąco. Wymaganie obu liczb wykluczyłoby jedno i drugie.
     */
    const bezStolow = { ...KOMPLETNY, miejscPrzyStolach: null, miejscNaStojaco: 200 };
    expect(brakiLokalu(bezStolow)).toEqual([]);
  });

  it("brak obu liczb miejsc jest brakiem", () => {
    const bezMiejsc = { ...KOMPLETNY, miejscPrzyStolach: null, miejscNaStojaco: null };
    expect(brakiLokalu(bezMiejsc)).toHaveLength(1);
  });

  it("odpowiedź „nie” na wyłączność nie jest brakiem", () => {
    /*
     * Pułapka na `if (!dane.wylacznosc)`: fałsz jest odpowiedzią, a nie
     * jej brakiem. Przy naiwnym sprawdzeniu sala bez wyłączności nigdy
     * nie dałaby się opublikować i nikt by nie zrozumiał dlaczego.
     */
    expect(brakiLokalu({ ...KOMPLETNY, wylacznosc: false })).toEqual([]);
  });
});

describe("gotowość usługodawcy do publikacji", () => {
  const KOMPLETNY: Partial<SzczegolyUslugodawcy> = {
    zasiegKm: 80,
    dojazd: "w-cenie-do-limitu",
    rodzajZaliczki: "procent",
    wartoscZaliczki: 30,
    fakturaVat: true,
  };

  it("komplet z jedną pozycją w cenie nie zgłasza braków", () => {
    expect(brakiUslugodawcy(KOMPLETNY, 1)).toEqual([]);
  });

  it("pusta lista „co w cenie” jest brakiem", () => {
    expect(brakiUslugodawcy(KOMPLETNY, 0)).toHaveLength(1);
  });

  it("odpowiedź „nie” na fakturę VAT nie jest brakiem", () => {
    expect(brakiUslugodawcy({ ...KOMPLETNY, fakturaVat: false }, 1)).toEqual([]);
  });

  it("godziny w pakiecie nie są wymagane", () => {
    /*
     * Florysta i firma od zaproszeń nie rozliczają się czasem. Wymóg
     * kazałby im zmyślać liczbę, żeby przejść dalej, a zmyślona liczba
     * trafiłaby na profil jako obietnica.
     */
    expect(brakiUslugodawcy({ ...KOMPLETNY, godzinWPakiecie: null }, 1)).toEqual([]);
  });

  it("pusty wpis zgłasza wszystkie braki naraz", () => {
    expect(brakiUslugodawcy({}, 0).length).toBe(5);
  });
});

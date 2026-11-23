/**
 * Testy walidacji imprezy na granicy formularza.
 *
 * Pierwsza z dwóch barier pod regułą „własna nazwa okazji dokładnie przy
 * »inna«”; druga stoi w `utworzImpreze` i ma przypadki w tests/imprezy.test.ts.
 * Osobno też reguła godzin, bo kolumna `time` nie zna doby i impreza po
 * północy musi zostawić koniec pusty.
 *
 * Bez bazy: Zod jest czysty.
 */
import { describe, expect, it } from "vitest";
import { OKAZJA_INNA } from "@/content/okazje";
import { daneNowejImprezy, MAKS_DNI_W_PRZOD } from "@/lib/validators/imprezy";

function zaDni(ile: number): string {
  const data = new Date();
  data.setDate(data.getDate() + ile);
  return data.toISOString().slice(0, 10);
}

const POPRAWNA = {
  nazwa: "Wieczór z muzyką na żywo",
  okazja: "urodziny",
  data: zaDni(30),
  godzinaOd: "20:00",
  godzinaDo: "23:00",
  cenaBiletu: "80",
  opis: "Koncert zespołu i kolacja w cenie biletu, sala na sto osób.",
};

function sprawdz(nadpisania: Record<string, string>) {
  return daneNowejImprezy.safeParse({ ...POPRAWNA, ...nadpisania });
}

function bledyPola(wynik: ReturnType<typeof sprawdz>, pole: string): number {
  if (wynik.success) return 0;
  return wynik.error.issues.filter((i) => i.path[0] === pole).length;
}

describe("data imprezy", () => {
  it("przyszła przechodzi", () => {
    expect(sprawdz({}).success).toBe(true);
  });

  it("dzisiejsza przechodzi, bo impreza bywa dziś wieczorem", () => {
    expect(sprawdz({ data: zaDni(0) }).success).toBe(true);
  });

  it("wczorajsza odpada, bo zapowiedź dotyczy przyszłości", () => {
    expect(sprawdz({ data: zaDni(-1) }).success).toBe(false);
  });

  it("zbyt odległa odpada", () => {
    expect(sprawdz({ data: zaDni(MAKS_DNI_W_PRZOD + 2) }).success).toBe(false);
  });
});

describe("godziny", () => {
  it("koniec po początku przechodzi", () => {
    expect(sprawdz({ godzinaOd: "20:00", godzinaDo: "23:00" }).success).toBe(true);
  });

  it("pusty koniec przechodzi i dojeżdża jako brak", () => {
    /*
     * „Gramy do ostatniego gościa” jest częstsze niż podana godzina,
     * a wpisana na siłę byłaby obietnicą, której nikt nie składał.
     */
    const wynik = sprawdz({ godzinaDo: "" });
    expect(wynik.success).toBe(true);
    if (wynik.success) expect(wynik.data.godzinaDo).toBeNull();
  });

  it("koniec przed początkiem odpada", () => {
    // Impreza po północy ma zostawić koniec pusty: kolumna `time` nie zna
    // doby, a druga data byłaby polem do pomylenia przy każdej imprezie
    // kończącej się przed północą, czyli przy większości.
    const wynik = sprawdz({ godzinaOd: "21:00", godzinaDo: "03:00" });
    expect(wynik.success).toBe(false);
    expect(bledyPola(wynik, "godzinaDo")).toBe(1);
  });

  it("koniec równy początkowi odpada", () => {
    expect(sprawdz({ godzinaOd: "20:00", godzinaDo: "20:00" }).success).toBe(false);
  });

  it("godzina spoza zegara odpada", () => {
    expect(sprawdz({ godzinaOd: "25:00" }).success).toBe(false);
  });
});

describe("cena biletu", () => {
  it("pusta przechodzi i znaczy wstęp wolny", () => {
    const wynik = sprawdz({ cenaBiletu: "" });
    expect(wynik.success).toBe(true);
    if (wynik.success) expect(wynik.data.cenaBiletu).toBeNull();
  });

  it("podana jedzie w groszach", () => {
    const wynik = sprawdz({ cenaBiletu: "80" });
    expect(wynik.success && wynik.data.cenaBiletu).toBe(8000);
  });
});

describe("okazja wpisana własnymi słowami", () => {
  it("przechodzi z nazwą", () => {
    const wynik = sprawdz({ okazja: OKAZJA_INNA.slug, innaOkazja: "turniej skata" });
    expect(wynik.success).toBe(true);
    if (wynik.success) expect(wynik.data.innaOkazja).toBe("turniej skata");
  });

  it("odpada bez nazwy", () => {
    expect(sprawdz({ okazja: OKAZJA_INNA.slug }).success).toBe(false);
  });

  it("odpada przy nazwie dołożonej do okazji ze słownika", () => {
    // Inaczej impreza miałaby dwie nazwy okazji naraz i każdy ekran
    // musiałby rozstrzygać, która wygrywa.
    const wynik = sprawdz({ okazja: "urodziny", innaOkazja: "turniej skata" });
    expect(wynik.success).toBe(false);
    expect(bledyPola(wynik, "innaOkazja")).toBe(1);
  });
});

describe("pole wyboru dla dorosłych", () => {
  it("nieobecne znaczy nie", () => {
    const wynik = sprawdz({});
    expect(wynik.success && wynik.data.dlaDoroslych).toBe(false);
  });

  it("odhaczone znaczy tak", () => {
    const wynik = sprawdz({ dlaDoroslych: "on" });
    expect(wynik.success && wynik.data.dlaDoroslych).toBe(true);
  });
});

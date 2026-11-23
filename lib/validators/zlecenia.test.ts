/**
 * Testy walidacji zlecenia na granicy formularza.
 *
 * To jest pierwsza z dwóch barier pod regułą „własna nazwa okazji istnieje
 * dokładnie wtedy, gdy wybrano »Inna okazja«”. Druga stoi w `utworzZlecenie`
 * i ma własny test w tests/zlecenia-dodawanie.test.ts. Każda jest sprawdzana
 * osobno, bo test padający dopiero po zdjęciu obu dowodziłby wyłącznie tego,
 * że działa co najmniej jedna.
 *
 * Plik nie dotyka bazy: Zod jest czysty.
 */
import { describe, expect, it } from "vitest";
import { MAKS_ZNAKOW_INNEJ_OKAZJI, MIN_ZNAKOW_INNEJ_OKAZJI, OKAZJA_INNA } from "@/content/okazje";
import { daneNowegoZlecenia } from "@/lib/validators/zlecenia";

/** Data w przyszłości, bo walidator odrzuca przeszłe. */
function zaRok(): string {
  const data = new Date();
  data.setFullYear(data.getFullYear() + 1);
  return data.toISOString().slice(0, 10);
}

const POPRAWNE = {
  okazja: "komunia",
  dataWydarzenia: zaRok(),
  liczbaOsob: "80",
  cityId: "11111111-1111-4111-8111-111111111111",
  opis: "Szukamy sali na komunię córki, osiemdziesięciu gości, przydałby się ogród.",
  budzetMin: "",
  budzetMax: "",
};

function sprawdz(nadpisania: Record<string, string>) {
  return daneNowegoZlecenia.safeParse({ ...POPRAWNE, ...nadpisania });
}

/** Komunikaty błędów przypisane do pola, żeby test nie łapał cudzej odmowy. */
function bledyPola(wynik: ReturnType<typeof sprawdz>, pole: string): string[] {
  if (wynik.success) return [];
  return wynik.error.issues.filter((i) => i.path[0] === pole).map((i) => i.message);
}

describe("okazja ze słownika", () => {
  it("przechodzi bez własnej nazwy", () => {
    const wynik = sprawdz({});
    expect(wynik.success).toBe(true);
    if (wynik.success) expect(wynik.data.innaOkazja).toBeNull();
  });

  it("przechodzi, gdy pole własnej nazwy przyszło puste", () => {
    // Formularz wysyła pole, nawet gdy jest schowane i nieuzupełnione.
    // Pusty napis ma znaczyć „nie podano”, a nie „podano pustą nazwę”.
    const wynik = sprawdz({ innaOkazja: "   " });
    expect(wynik.success).toBe(true);
    if (wynik.success) expect(wynik.data.innaOkazja).toBeNull();
  });

  it("odpada, gdy ktoś dołoży własną nazwę do okazji z listy", () => {
    // Inaczej zlecenie miałoby dwie nazwy okazji naraz, a każdy ekran
    // musiałby rozstrzygać, która wygrywa.
    const wynik = sprawdz({ innaOkazja: "zjazd rocznika" });
    expect(wynik.success).toBe(false);
    expect(bledyPola(wynik, "innaOkazja")).toHaveLength(1);
  });
});

describe("inna okazja", () => {
  it("przechodzi z nazwą i nazwa dojeżdża przycięta", () => {
    const wynik = sprawdz({ okazja: OKAZJA_INNA.slug, innaOkazja: "  zjazd rocznika  " });
    expect(wynik.success).toBe(true);
    if (wynik.success) expect(wynik.data.innaOkazja).toBe("zjazd rocznika");
  });

  it("odpada bez nazwy", () => {
    const wynik = sprawdz({ okazja: OKAZJA_INNA.slug });
    expect(wynik.success).toBe(false);
    expect(bledyPola(wynik, "innaOkazja")).toContain("Napisz, co to za okazja.");
  });

  it("odpada przy nazwie z samych spacji", () => {
    // Napis spacji przechodzi `required` w przeglądarce, więc serwer musi
    // go odrzucić sam. Bez przycięcia wpadłby do bazy jako nazwa okazji.
    const wynik = sprawdz({ okazja: OKAZJA_INNA.slug, innaOkazja: "     " });
    expect(wynik.success).toBe(false);
    expect(bledyPola(wynik, "innaOkazja")).toContain("Napisz, co to za okazja.");
  });

  it("odpada przy nazwie krótszej niż granica", () => {
    const wynik = sprawdz({
      okazja: OKAZJA_INNA.slug,
      innaOkazja: "x".repeat(MIN_ZNAKOW_INNEJ_OKAZJI - 1),
    });
    expect(wynik.success).toBe(false);
    expect(bledyPola(wynik, "innaOkazja")).toHaveLength(1);
  });

  it("przechodzi przy nazwie dokładnie na granicy", () => {
    // Granica po właściwej stronie: `>=`, nie `>`. Bez tego przypadku
    // przesunięcie o jeden przeszłoby niezauważone.
    for (const dlugosc of [MIN_ZNAKOW_INNEJ_OKAZJI, MAKS_ZNAKOW_INNEJ_OKAZJI]) {
      const wynik = sprawdz({ okazja: OKAZJA_INNA.slug, innaOkazja: "x".repeat(dlugosc) });
      expect(wynik.success).toBe(true);
    }
  });

  it("odpada przy nazwie dłuższej niż granica", () => {
    const wynik = sprawdz({
      okazja: OKAZJA_INNA.slug,
      innaOkazja: "x".repeat(MAKS_ZNAKOW_INNEJ_OKAZJI + 1),
    });
    expect(wynik.success).toBe(false);
    expect(bledyPola(wynik, "innaOkazja")).toHaveLength(1);
  });
});

/**
 * Testy walidacji decyzji moderacyjnej.
 *
 * Reguła biznesowa: odmowa zawsze niesie komentarz dla właściciela, a zgoda
 * nigdy go nie niesie. Pierwsza połowa chroni człowieka po drugiej stronie
 * przed odesłaniem wpisu bez wyjaśnienia; druga chroni bazę, w której CHECK
 * `moderation_submissions_powod_tylko_przy_odmowie` pozwala wypełnić powód
 * wyłącznie przy odmowie.
 *
 * Bez bazy: Zod jest czysty.
 */
import { describe, expect, it } from "vitest";
import {
  daneDecyzjiModeracji,
  MAKS_ZNAKOW_POWODU,
  MIN_ZNAKOW_POWODU,
} from "@/lib/validators/moderacja";

const ZGLOSZENIE = "11111111-1111-4111-8111-111111111111";

function sprawdz(wejscie: Record<string, string>) {
  return daneDecyzjiModeracji.safeParse({ zgloszenieId: ZGLOSZENIE, ...wejscie });
}

function bledyPola(wynik: ReturnType<typeof sprawdz>, pole: string): string[] {
  if (wynik.success) return [];
  return wynik.error.issues.filter((i) => i.path[0] === pole).map((i) => i.message);
}

describe("zgoda", () => {
  it("przechodzi bez komentarza", () => {
    const wynik = sprawdz({ decyzja: "zgoda" });
    expect(wynik.success).toBe(true);
  });

  it("przechodzi, gdy pole komentarza przyszło puste", () => {
    // Formularz wysyła pole, nawet gdy jest schowane i nieuzupełnione.
    expect(sprawdz({ decyzja: "zgoda", powod: "   " }).success).toBe(true);
  });

  it("odpada z komentarzem, bo zgody się nie uzasadnia", () => {
    const wynik = sprawdz({ decyzja: "zgoda", powod: "wszystko w porządku, przyjmuję" });
    expect(wynik.success).toBe(false);
    expect(bledyPola(wynik, "powod")).toHaveLength(1);
  });
});

describe("odmowa", () => {
  it("przechodzi z komentarzem i komentarz dojeżdża przycięty", () => {
    const wynik = sprawdz({
      decyzja: "odmowa",
      powod: "  Brakuje zdjęć sali i ceny za osobę.  ",
    });
    expect(wynik.success).toBe(true);
    if (wynik.success) expect(wynik.data.powod).toBe("Brakuje zdjęć sali i ceny za osobę.");
  });

  it("odpada bez komentarza", () => {
    const wynik = sprawdz({ decyzja: "odmowa" });
    expect(wynik.success).toBe(false);
    expect(bledyPola(wynik, "powod")).toHaveLength(1);
  });

  it("odpada przy komentarzu z samych spacji", () => {
    // Spacje przechodzą `required` w przeglądarce, więc odsiewa je serwer.
    const wynik = sprawdz({ decyzja: "odmowa", powod: "              " });
    expect(wynik.success).toBe(false);
    expect(bledyPola(wynik, "powod")).toHaveLength(1);
  });

  it("odpada przy komentarzu krótszym niż granica", () => {
    const wynik = sprawdz({ decyzja: "odmowa", powod: "x".repeat(MIN_ZNAKOW_POWODU - 1) });
    expect(wynik.success).toBe(false);
  });

  it("przechodzi przy komentarzu dokładnie na obu granicach", () => {
    // Granice po właściwej stronie: `>=` i `<=`, nie `>` i `<`.
    for (const dlugosc of [MIN_ZNAKOW_POWODU, MAKS_ZNAKOW_POWODU]) {
      expect(sprawdz({ decyzja: "odmowa", powod: "x".repeat(dlugosc) }).success).toBe(true);
    }
  });

  it("odpada przy komentarzu dłuższym niż granica", () => {
    expect(sprawdz({ decyzja: "odmowa", powod: "x".repeat(MAKS_ZNAKOW_POWODU + 1) }).success).toBe(
      false,
    );
  });
});

describe("wejście spoza formularza", () => {
  it("odrzuca decyzję, której nie ma", () => {
    expect(sprawdz({ decyzja: "zawies" }).success).toBe(false);
  });

  it("odrzuca identyfikator, który nie jest UUID-em", () => {
    const wynik = daneDecyzjiModeracji.safeParse({
      zgloszenieId: "pierwsze-z-brzegu",
      decyzja: "zgoda",
    });
    expect(wynik.success).toBe(false);
  });
});

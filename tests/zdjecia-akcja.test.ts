/**
 * Granica wejścia akcji zdjęć, czyli to, co sprawdza Zod przed dotknięciem
 * czegokolwiek (zasada 4).
 *
 * REGUŁA: akcja odmawia **komunikatem**, a nie wyjątkiem, gdy przyjdzie do
 * niej wejście bez poprawnego klucza wysyłki albo bez poprawnego
 * identyfikatora zdjęcia. Oba pola idą z formularza, czyli da się je
 * podmienić, a `zdjecieId` trafia wprost do `where` na kolumnie uuid, gdzie
 * dowolny napis kończy się błędem Postgresa 22P02 i ogólnikiem na ekranie.
 *
 * DLACZEGO TEN PLIK JEST OSOBNY. Podstawia `next/headers`, a `zdjecia.test.ts`
 * tego nie robi i nie powinien: tam sprawdzamy warstwę zapytań, która
 * nagłówków nie zna.
 *
 * DLACZEGO TEN TEST SIĘGA DO AKCJI BEZ SESJI. Sprawdzenia Zoda stoją w akcji
 * **przed** odczytem widza, więc odmowa wejścia zapada, zanim zrobi się
 * cokolwiek z sesją. To jest zamierzone i właśnie dlatego sprawdzalne:
 * niepoprawne wejście nie ma prawa dojść dalej niż do pierwszego `if`.
 */
import { describe, expect, it, vi } from "vitest";
import type { StanFormularza } from "@/lib/formularze";

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

const { dodajZdjecieFirmy, usunZdjecieFirmy } = await import("@/lib/akcje/zdjecia");

const STAN: StanFormularza = { status: "poczatkowy" };

/** Minimalny plik, żeby akcja doszła do sprawdzania klucza. */
function plik(): File {
  return new File([new Uint8Array([1, 2, 3])], "zdjecie.webp", { type: "image/webp" });
}

/** Błędy przypisane do pola `zdjecie`, czyli te, które pokazuje galeria. */
function bledy(stan: StanFormularza): string[] {
  return stan.status === "bledy" ? (stan.bledy.zdjecie ?? []) : [];
}

describe("dodawanie zdjęcia odmawia niepoprawnemu wejściu", () => {
  it("bez klucza wysyłki odmawia komunikatem, nie wyjątkiem", async () => {
    const dane = new FormData();
    dane.set("zdjecie", plik());
    // Klucza nie ma wcale: tak wygląda żądanie ze starego kodu w przeglądarce
    // po wdrożeniu nowej wersji serwera.

    const wynik = await dodajZdjecieFirmy(STAN, dane);

    expect(wynik.status).toBe("bledy");
    expect(bledy(wynik).join(" ")).toMatch(/odśwież/i);
  });

  it("klucz, który nie jest uuid-em, też nie przechodzi", async () => {
    const dane = new FormData();
    dane.set("zdjecie", plik());
    dane.set("kluczWysylki", "byle-co");

    const wynik = await dodajZdjecieFirmy(STAN, dane);

    expect(wynik.status).toBe("bledy");
    expect(bledy(wynik).join(" ")).toMatch(/odśwież/i);
  });

  it("brak pliku odmawia osobnym komunikatem, więc odmowy się nie zlewają", async () => {
    /*
     * Instancja rozróżniająca. Bez niej test wyżej przechodziłby także wtedy,
     * gdyby akcja odpowiadała tym samym zdaniem na każde wejście, a wtedy
     * człowiek bez wybranego pliku czytałby „odśwież stronę”.
     */
    const dane = new FormData();
    dane.set("kluczWysylki", crypto.randomUUID());

    const wynik = await dodajZdjecieFirmy(STAN, dane);

    expect(wynik.status).toBe("bledy");
    expect(bledy(wynik).join(" ")).toMatch(/wybierz plik/i);
  });
});

describe("usuwanie zdjęcia odmawia niepoprawnemu identyfikatorowi", () => {
  it("napis, który nie jest uuid-em, nie dochodzi do bazy", async () => {
    const dane = new FormData();
    dane.set("zdjecieId", "nie-uuid");

    const wynik = await usunZdjecieFirmy(STAN, dane);

    // Sedno: komunikat, a nie rzut z Postgresa. Dawniej `where id = $1`
    // dostawało ten napis i odpowiadało błędem 22P02.
    expect(wynik.status).toBe("bledy");
    expect(bledy(wynik).join(" ")).toMatch(/które zdjęcie/i);
  });
});

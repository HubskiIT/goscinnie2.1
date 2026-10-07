/**
 * Reguła Z00, druga połowa: zasiew pokazowy nie rusza na produkcji.
 *
 * Zasiew tworzy trzysta firm, dwadzieścia kont i pięćdziesiąt zleceń, których
 * nikt nie zakładał. Na produkcji byłyby nie do odróżnienia od prawdziwych,
 * a usunąć ich nie wolno, bo zakaz twardego kasowania obejmuje dane firm
 * i zleceń. Jedyny moment, w którym da się to zatrzymać, jest przed startem.
 */
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/** Kopia zmiennych bez pustych wartości: execFileSync nie przyjmuje undefined. */
function srodowisko(nodeEnv: string): NodeJS.ProcessEnv {
  const kopia: Record<string, string> = {};
  for (const [klucz, wartosc] of Object.entries(process.env)) {
    if (typeof wartosc === "string") kopia[klucz] = wartosc;
  }
  kopia.NODE_ENV = nodeEnv;
  return kopia as NodeJS.ProcessEnv;
}

function uruchomZasiew(nodeEnv: string): { kod: number; wyjscie: string } {
  try {
    const wynik = execFileSync("pnpm", ["exec", "tsx", "lib/db/seed.ts"], {
      env: srodowisko(nodeEnv),
      encoding: "utf8",
    });
    return { kod: 0, wyjscie: wynik };
  } catch (blad) {
    const e = blad as { status?: number; stdout?: string; stderr?: string };
    return { kod: e.status ?? 1, wyjscie: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

describe("zasiew pokazowy", () => {
  it("odmawia działania, gdy NODE_ENV to production", () => {
    const wynik = uruchomZasiew("production");

    expect(wynik.kod).not.toBe(0);
    expect(wynik.wyjscie).toContain("nie działa na produkcji");
  }, 60_000);
});

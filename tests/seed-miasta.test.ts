/**
 * Test Z00: każdy slug z MIASTA w seed.ts istnieje w content/miejscowosci.json.gz
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";

type WierszMiasta = [
  simc: string,
  slug: string,
  name: string,
  rodzaj: string,
  gmina: string,
  powiat: string,
  wojewodztwo: string,
  point: [number, number] | null,
];

const MIASTA = [
  { slug: "warszawa" },
  { slug: "zyrardow" },
  { slug: "krakow" },
  { slug: "gdansk" },
  { slug: "lodz" },
  { slug: "swidnica" },
];

describe("MIASTA w seed.ts", () => {
  it("każdy slug z MIASTA istnieje w content/miejscowosci.json.gz", () => {
    const sciezka = join(process.cwd(), "content", "miejscowosci.json.gz");
    const wszystkie = JSON.parse(gunzipSync(readFileSync(sciezka)).toString()) as WierszMiasta[];
    const slugi = new Set(wszystkie.map((w) => w[1]));

    for (const miasto of MIASTA) {
      expect(slugi.has(miasto.slug), `brak ${miasto.slug} w pliku`).toBe(true);
    }
  });
});

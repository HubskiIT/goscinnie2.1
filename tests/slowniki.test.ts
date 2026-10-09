/**
 * Reguła biznesowa Z00: skrypt słowników uruchomiony dwa razy nie tworzy
 * duplikatów i nie wstawia żadnej firmy, użytkownika ani zlecenia.
 *
 * Dlaczego to ma własny test: `vercel-build` wywołuje ten skrypt przy każdym
 * wypuszczeniu nowej wersji. Skrypt, który przy drugim uruchomieniu podwaja
 * kategorie, zepsuje katalog po pierwszym poprawkowym wdrożeniu, a objaw
 * pojawi się dopiero wtedy, gdy ktoś spojrzy na listę kategorii.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { KATEGORIE_USLUGODAWCOW } from "@/content/kategorie";
import { OKAZJE } from "@/content/okazje";
import { db, schema } from "@/lib/db";
import { wypelnijSlowniki } from "@/scripts/slowniki";
import { krokowo } from "@/scripts/vercel-build";

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

async function ile(zapytanie: Promise<{ ile: number }[]>): Promise<number> {
  const [wiersz] = await zapytanie;
  return wiersz?.ile ?? 0;
}

const liczbaKategorii = () =>
  ile(db.select({ ile: sql<number>`count(*)::int` }).from(schema.categories));
const liczbaOkazji = () =>
  ile(db.select({ ile: sql<number>`count(*)::int` }).from(schema.eventTypes));
const liczbaMiast = () => ile(db.select({ ile: sql<number>`count(*)::int` }).from(schema.cities));
const liczbaFirm = () => ile(db.select({ ile: sql<number>`count(*)::int` }).from(schema.companies));
const liczbaUzytkownikow = () =>
  ile(db.select({ ile: sql<number>`count(*)::int` }).from(schema.users));
const liczbaZlecen = () =>
  ile(db.select({ ile: sql<number>`count(*)::int` }).from(schema.requests));

describe("słowniki", () => {
  let poPierwszym: {
    kategorie: number;
    okazje: number;
    miasta: number;
    firmy: number;
    uzytkownicy: number;
    zlecenia: number;
  };

  beforeAll(async () => {
    await wypelnijSlowniki(db);
    poPierwszym = {
      kategorie: await liczbaKategorii(),
      okazje: await liczbaOkazji(),
      miasta: await liczbaMiast(),
      firmy: await liczbaFirm(),
      uzytkownicy: await liczbaUzytkownikow(),
      zlecenia: await liczbaZlecen(),
    };
  }, 120_000);

  it("wstawia wszystkie kategorie i okazje z content/", async () => {
    const slugi = await db.select({ slug: schema.categories.slug }).from(schema.categories);
    const wBazie = new Set(slugi.map((k) => k.slug));
    for (const kategoria of KATEGORIE_USLUGODAWCOW) {
      expect(wBazie.has(kategoria.slug), `brak kategorii ${kategoria.slug}`).toBe(true);
    }

    const okazje = await db.select({ slug: schema.eventTypes.slug }).from(schema.eventTypes);
    const okazjeWBazie = new Set(okazje.map((o) => o.slug));
    for (const okazja of OKAZJE) {
      expect(okazjeWBazie.has(okazja.slug), `brak okazji ${okazja.slug}`).toBe(true);
    }
  });

  it("wstawia wszystkie miejscowości z pliku", async () => {
    const sciezka = join(process.cwd(), "content", "miejscowosci.json.gz");
    const wiersze = JSON.parse(gunzipSync(readFileSync(sciezka)).toString()) as WierszMiasta[];
    
    expect(await liczbaMiast()).toBe(wiersze.length);
  });

  it("miejscowości bez współrzędnych mają point równy null", async () => {
    const sciezka = join(process.cwd(), "content", "miejscowosci.json.gz");
    const wiersze = JSON.parse(gunzipSync(readFileSync(sciezka)).toString()) as WierszMiasta[];
    const bezWspolrzednych = wiersze.filter(w => w[7] === null).map(w => w[0]); // SIMC
    
    expect(bezWspolrzednych.length).toBeGreaterThan(0);
    
    const wBazie = await db
      .select({ simc: schema.cities.simc })
      .from(schema.cities)
      .where(sql`${schema.cities.point} is null`);
    
    expect(wBazie.map(w => w.simc).sort()).toEqual(bezWspolrzednych.sort());
  });

  it("drugie uruchomienie nie tworzy duplikatów", async () => {
    await wypelnijSlowniki(db);

    expect(await liczbaKategorii()).toBe(poPierwszym.kategorie);
    expect(await liczbaOkazji()).toBe(poPierwszym.okazje);
    expect(await liczbaMiast()).toBe(poPierwszym.miasta);
  }, 120_000);

  it("nie wstawia żadnej firmy, użytkownika ani zlecenia", async () => {
    // Zasiew pokazowy wstawia je przed testami, więc porównujemy ze stanem
    // sprzed uruchomienia słowników, a nie z zerem.
    expect(await liczbaFirm()).toBe(poPierwszym.firmy);
    expect(await liczbaUzytkownikow()).toBe(poPierwszym.uzytkownicy);
    expect(await liczbaZlecen()).toBe(poPierwszym.zlecenia);
  });
});

describe("zasiew pokazowy", () => {
  it("odmawia działania na produkcji", async () => {
    const { zasiej } = await import("@/lib/db/seed");
    const przed = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      await expect(zasiej()).rejects.toThrow(/nie działa na produkcji/);
    } finally {
      process.env.NODE_ENV = przed;
    }
  });
});

describe("vercel-build", () => {
  it("przy VERCEL_ENV=preview zwraca tylko budowanie", () => {
    const kroki = krokowo({ VERCEL_ENV: "preview" });
    expect(kroki).toEqual(["budowanie"]);
  });

  it("przy VERCEL_ENV=production zwraca migrację, słowniki i budowanie", () => {
    const kroki = krokowo({ VERCEL_ENV: "production" });
    expect(kroki).toEqual(["migracja", "slowniki", "budowanie"]);
  });

  it("bez VERCEL_ENV zwraca tylko budowanie", () => {
    const kroki = krokowo({});
    expect(kroki).toEqual(["budowanie"]);
  });
});

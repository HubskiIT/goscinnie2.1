/**
 * Reguła biznesowa Z00: skrypt słowników uruchomiony dwa razy nie tworzy
 * duplikatów i nie wstawia żadnej firmy, użytkownika ani zlecenia.
 *
 * Dlaczego to ma własny test: `vercel-build` wywołuje ten skrypt przy każdym
 * wypuszczeniu nowej wersji. Skrypt, który przy drugim uruchomieniu podwaja
 * kategorie, zepsuje katalog po pierwszym poprawkowym wdrożeniu, a objaw
 * pojawi się dopiero wtedy, gdy ktoś spojrzy na listę kategorii.
 */
import { sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { KATEGORIE_USLUGODAWCOW } from "@/content/kategorie";
import { OKAZJE } from "@/content/okazje";
import { db, schema } from "@/lib/db";
import { wypelnijSlowniki } from "@/scripts/slowniki";

async function ile(zapytanie: Promise<{ ile: number }[]>): Promise<number> {
  const [wiersz] = await zapytanie;
  return wiersz?.ile ?? 0;
}

const liczbaKategorii = () =>
  ile(db.select({ ile: sql<number>`count(*)::int` }).from(schema.categories));
const liczbaOkazji = () =>
  ile(db.select({ ile: sql<number>`count(*)::int` }).from(schema.eventTypes));
const liczbaPlanow = () => ile(db.select({ ile: sql<number>`count(*)::int` }).from(schema.plans));
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
    plany: number;
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
      plany: await liczbaPlanow(),
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

  it("drugie uruchomienie nie tworzy duplikatów", async () => {
    await wypelnijSlowniki(db);

    expect(await liczbaKategorii()).toBe(poPierwszym.kategorie);
    expect(await liczbaOkazji()).toBe(poPierwszym.okazje);
    expect(await liczbaPlanow()).toBe(poPierwszym.plany);
    expect(await liczbaMiast()).toBe(poPierwszym.miasta);
  }, 120_000);

  it("nie wstawia żadnej firmy, użytkownika ani zlecenia", async () => {
    // Zasiew pokazowy wstawia je przed testami, więc porównujemy ze stanem
    // sprzed uruchomienia słowników, a nie z zerem.
    expect(await liczbaFirm()).toBe(poPierwszym.firmy);
    expect(await liczbaUzytkownikow()).toBe(poPierwszym.uzytkownicy);
    expect(await liczbaZlecen()).toBe(poPierwszym.zlecenia);
  });

  it("każda kategoria z content/ ma plan Start i plan Pełny", async () => {
    const plany = await db
      .select({ kategoria: schema.categories.slug, kod: schema.plans.code })
      .from(schema.plans)
      .innerJoin(schema.categories, sql`${schema.categories.id} = ${schema.plans.categoryId}`);

    for (const kategoria of KATEGORIE_USLUGODAWCOW) {
      const dlaKategorii = plany.filter((p) => p.kategoria === kategoria.slug);
      expect(dlaKategorii.map((p) => p.kod).sort(), `plany dla ${kategoria.slug}`).toEqual([
        "pro",
        "start",
      ]);
    }
  });
});

/**
 * Słowniki: dane, bez których serwis nie działa, i które muszą być w każdej
 * bazie, także produkcyjnej.
 *
 * Czym się różni od zasiewu: `lib/db/seed.ts` tworzy świat pokazowy, czyli
 * firmy, użytkowników i zlecenia. Tego na produkcji być nie może. Słowniki to
 * kategorie, okazje i miejscowości — rzeczy, które nie są niczyimi danymi,
 * tylko podstawą działania katalogu.
 *
 * Skrypt jest idempotentny. Uruchomiony dwa razy nie tworzy duplikatów, bo
 * wdrożenie na Vercel wywołuje go przy każdym wypuszczeniu nowej wersji.
 *
 * Użycie: tsx scripts/slowniki.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { eq, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { KATEGORIE_USLUGODAWCOW } from "@/content/kategorie";
import { OKAZJE } from "@/content/okazje";
import * as schema from "@/lib/db/schema";

type Baza = ReturnType<typeof drizzle<typeof schema>>;

/** Ile wierszy miast idzie w jednym zapytaniu. */
const PARTIA_MIAST = 1000;

/**
 * Wiersz z content/miejscowosci.json.gz.
 * Kolejność pól jest zapisana w scripts/miejscowosci.mjs.
 */
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

export async function wypelnijKategorie(db: Baza): Promise<void> {
  await db
    .insert(schema.categories)
    .values(KATEGORIE_USLUGODAWCOW.map((k) => ({ slug: k.slug, name: k.nazwa })))
    .onConflictDoNothing({ target: schema.categories.slug });
}

export async function wypelnijOkazje(db: Baza): Promise<void> {
  await db
    .insert(schema.eventTypes)
    .values(OKAZJE.map((o) => ({ slug: o.slug, name: o.nazwa })))
    .onConflictDoNothing({ target: schema.eventTypes.slug });
}

/**
 * Miejscowości z TERYT i PRNG, 101 865 wierszy.
 *
 * Szybkie wyjście: gdy liczba wierszy z wypełnionym simc już się zgadza
 * z plikiem, nie wysyłamy nic. Partie: sto tysięcy wierszy w jednym zapytaniu
 * przekracza limit parametrów sterownika.
 *
 * Wstawiane są wszystkie miejscowości, włącznie z 533 bez współrzędnych.
 * Miejscowości z zasiewu (simc is null) uzupełniamy po dopasowaniu sluga.
 */
export async function wypelnijMiasta(db: Baza): Promise<void> {
  const sciezka = join(process.cwd(), "content", "miejscowosci.json.gz");
  const wiersze = JSON.parse(gunzipSync(readFileSync(sciezka)).toString()) as WierszMiasta[];

  const [policzone] = await db
    .select({ ile: sql<number>`count(*)::int` })
    .from(schema.cities)
    .where(sql`${schema.cities.simc} is not null`);

  if ((policzone?.ile ?? 0) >= wiersze.length) return;

  // Uzupełnij istniejące wiersze bez simc
  const bezSimc = await db
    .select({ id: schema.cities.id, slug: schema.cities.slug })
    .from(schema.cities)
    .where(isNull(schema.cities.simc));

  for (const wiersz of bezSimc) {
    const dane = wiersze.find((w) => w[1] === wiersz.slug);
    if (dane) {
      await db
        .update(schema.cities)
        .set({
          simc: dane[0],
          gmina: dane[4],
          rodzaj: dane[3],
        })
        .where(eq(schema.cities.id, wiersz.id));
    }
  }

  // Wstaw nowe miejscowości
  for (let i = 0; i < wiersze.length; i += PARTIA_MIAST) {
    const partia = wiersze.slice(i, i + PARTIA_MIAST).map((w) => ({
      simc: w[0],
      name: w[2],
      slug: w[1],
      rodzaj: w[3],
      gmina: w[4],
      powiat: w[5],
      wojewodztwo: w[6],
      point: w[7] !== null ? { lat: w[7][0], lon: w[7][1] } : null,
    }));
    await db.insert(schema.cities).values(partia).onConflictDoNothing({
      target: schema.cities.simc,
    });
  }
}

export async function wypelnijSlowniki(db: Baza): Promise<void> {
  await wypelnijKategorie(db);
  await wypelnijOkazje(db);
  await wypelnijMiasta(db);
}

/**
 * Połączenie bezpośrednie, nie przez pulę.
 *
 * Z tego samego powodu co migracje (decyzja 007): sto tysięcy wstawień przez
 * pulę w trybie transakcyjnym to dokładnie ten rodzaj ruchu, przy którym
 * wychodzą jej ograniczenia.
 */
export function polacz(): { db: Baza; zamknij: () => Promise<void> } {
  const url = process.env.DATABASE_URL_MIGRACJE ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Brak DATABASE_URL. Lokalnie: pnpm db:up. Na Vercelu: zmienne projektu. Patrz docs/decyzje/007.",
    );
  }
  const klient = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  return { db: drizzle(klient, { schema, casing: "snake_case" }), zamknij: () => klient.end() };
}

async function main(): Promise<void> {
  const { db, zamknij } = polacz();
  const zaczeto = Date.now();
  try {
    await wypelnijSlowniki(db);
    const [kategorie] = await db
      .select({ ile: sql<number>`count(*)::int` })
      .from(schema.categories);
    const [okazje] = await db.select({ ile: sql<number>`count(*)::int` }).from(schema.eventTypes);
    const [miasta] = await db.select({ ile: sql<number>`count(*)::int` }).from(schema.cities);
    console.info(
      [
        `kategorie: ${kategorie?.ile ?? 0}`,
        `okazje: ${okazje?.ile ?? 0}`,
        `miejscowości: ${miasta?.ile ?? 0}`,
        `czas: ${Math.round((Date.now() - zaczeto) / 1000)} s`,
      ].join(", "),
    );
  } finally {
    await zamknij();
  }
}

// Uruchomienie z wiersza poleceń, ale nie przy imporcie w teście.
if (process.argv[1]?.endsWith("slowniki.ts")) {
  await main();
}

/**
 * Słowniki: dane, bez których serwis nie działa, i które muszą być w każdej
 * bazie, także produkcyjnej.
 *
 * Czym się różni od zasiewu: `lib/db/seed.ts` tworzy świat pokazowy, czyli
 * firmy, użytkowników i zlecenia. Tego na produkcji być nie może. Słowniki to
 * kategorie, okazje, plany i miejscowości — rzeczy, które nie są niczyimi
 * danymi, tylko podstawą działania katalogu.
 *
 * Skrypt jest idempotentny. Uruchomiony dwa razy nie tworzy duplikatów, bo
 * wdrożenie na Vercel wywołuje go przy każdym wypuszczeniu nowej wersji.
 *
 * Użycie: tsx scripts/slowniki.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { cena } from "@/content/cennik";
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
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  [number, number] | null,
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
 * Plany w zakresie, który uniesie dzisiejszy schemat.
 *
 * `plan_code` zna `start` i `pro`, a kolumna ceny jest jedna: roczna.
 * Cennik z 3 października ma trzy plany i trzy okresy rozliczenia, więc tutaj
 * wchodzi tylko ta część, którą da się wyrazić: `pro` to plan Pełny w ujęciu
 * rocznym, a plan Wyróżniony i okresy krótsze niż rok dochodzą w Z03 razem
 * z migracją rozszerzającą enum.
 *
 * Limit ofert dla planu Start bierzemy z liczby, którą właściciel sam podał
 * w Z03 jako punkt wyjścia: piętnaście ofert na rok. Plan Pełny nie ma limitu,
 * zgodnie z komentarzem przy kolumnie.
 */
const LIMIT_OFERT_START_ROCZNIE = 15;

export async function wypelnijPlany(db: Baza): Promise<void> {
  const kategorieWBazie = await db
    .select({ id: schema.categories.id, slug: schema.categories.slug })
    .from(schema.categories);

  const wiersze = kategorieWBazie.flatMap((wBazie) => {
    const zTresci = KATEGORIE_USLUGODAWCOW.find((k) => k.slug === wBazie.slug);
    // Kategoria spoza content/ (na przykład z zasiewu pokazowego) nie dostaje
    // planu: nie wiemy, w której klasie cenowej miałaby być.
    if (zTresci === undefined) return [];

    const naGrosze = (zlote: number) => zlote * 100;
    return [
      {
        categoryId: wBazie.id,
        code: "start" as const,
        priceAnnual: naGrosze(cena(zTresci.klasa, "rok", "start")),
        bidsLimit: LIMIT_OFERT_START_ROCZNIE,
      },
      {
        categoryId: wBazie.id,
        code: "pro" as const,
        priceAnnual: naGrosze(cena(zTresci.klasa, "rok", "pelny")),
        bidsLimit: null,
      },
    ];
  });

  if (wiersze.length === 0) return;

  // `plans` nie ma ograniczenia unikalności na parze kategoria i kod, więc
  // idempotencji pilnujemy tutaj: wstawiamy tylko to, czego jeszcze nie ma.
  const istniejace = await db
    .select({ categoryId: schema.plans.categoryId, code: schema.plans.code })
    .from(schema.plans);
  const klucz = (categoryId: string, code: string) => `${categoryId}:${code}`;
  const juzSa = new Set(istniejace.map((p) => klucz(p.categoryId, p.code)));

  const doWstawienia = wiersze.filter((w) => !juzSa.has(klucz(w.categoryId, w.code)));
  if (doWstawienia.length > 0) await db.insert(schema.plans).values(doWstawienia);
}

/**
 * Miejscowości z TERYT i PRNG, 101 865 wierszy.
 *
 * Dwie rzeczy chronią czas budowania. Po pierwsze szybkie wyjście: gdy liczba
 * wierszy w bazie już się zgadza, nie wysyłamy nic. Po drugie partie: sto
 * tysięcy wierszy w jednym zapytaniu przekracza limit parametrów sterownika.
 *
 * Miejscowości bez współrzędnych pomijamy. Kolumna `point` jest wymagana,
 * a 533 wpisy z PRNG jej nie mają. Decyzja właściciela z 7 października:
 * schemat zostaje bez zmian.
 */
export async function wypelnijMiasta(db: Baza): Promise<void> {
  const sciezka = join(process.cwd(), "content", "miejscowosci.json.gz");
  const wiersze = JSON.parse(gunzipSync(readFileSync(sciezka)).toString()) as WierszMiasta[];

  const zeWspolrzednymi = wiersze.filter((w) => w[7] !== null);

  const [policzone] = await db.select({ ile: sql<number>`count(*)::int` }).from(schema.cities);
  if ((policzone?.ile ?? 0) >= zeWspolrzednymi.length) return;

  for (let i = 0; i < zeWspolrzednymi.length; i += PARTIA_MIAST) {
    const partia = zeWspolrzednymi.slice(i, i + PARTIA_MIAST).map((w) => {
      const punkt = w[7];
      if (punkt === null) throw new Error("Miasto bez współrzędnych po filtrowaniu.");
      return {
        name: w[2],
        slug: w[1],
        powiat: w[5],
        wojewodztwo: w[6],
        point: { lat: punkt[0], lon: punkt[1] },
      };
    });
    await db.insert(schema.cities).values(partia).onConflictDoNothing({
      target: schema.cities.slug,
    });
  }
}

export async function wypelnijSlowniki(db: Baza): Promise<void> {
  await wypelnijKategorie(db);
  await wypelnijOkazje(db);
  await wypelnijPlany(db);
  await wypelnijMiasta(db);
}

/**
 * Połączenie bezpośrednie, nie przez pulę.
 *
 * Z tego samego powodu co migracje (decyzja 007): sto tysięcy wstawień przez
 * pulę w trybie transakcyjnym to dokładnie ten rodzaj ruchu, przy którym
 * wychodzą jej ograniczenia.
 */
function polacz(): { db: Baza; zamknij: () => Promise<void> } {
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
    const [plany] = await db.select({ ile: sql<number>`count(*)::int` }).from(schema.plans);
    const [miasta] = await db.select({ ile: sql<number>`count(*)::int` }).from(schema.cities);
    console.info(
      [
        `kategorie: ${kategorie?.ile ?? 0}`,
        `okazje: ${okazje?.ile ?? 0}`,
        `plany: ${plany?.ile ?? 0}`,
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

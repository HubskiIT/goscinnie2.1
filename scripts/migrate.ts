/**
 * Runner migracji na parach plików.
 *
 * Dlaczego własny, a nie `drizzle-kit migrate`: drizzle-kit nie generuje ani nie
 * uruchamia cofnięć, a w tym projekcie migracja bez działającego cofnięcia
 * nie przechodzi CI. Runner jest celowo krótki i nudny — ma być czytelny
 * dla człowieka, który przejmie projekt.
 *
 *   drizzle/NNNN_nazwa.sql            migracja w przód (generowana lub ręczna)
 *   drizzle/down/NNNN_nazwa.down.sql  cofnięcie (zawsze ręczne)
 *
 * Użycie: tsx scripts/migrate.ts up | down [ile]
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const KATALOG = join(process.cwd(), "drizzle");
const KATALOG_DOWN = join(KATALOG, "down");

/*
 * Migracje idą połączeniem BEZPOŚREDNIM, nie przez pulę.
 *
 * Pula w trybie transakcyjnym (u Supabase port 6543) nie gwarantuje, że
 * wszystkie instrukcje migracji trafią na to samo połączenie, a migracja
 * rozbita na dwa połączenia potrafi zostawić schemat w połowie.
 *
 * Aplikacja potrzebuje puli, bo każda funkcja bezserwerowa otwiera własne
 * połączenie. Migracje potrzebują czegoś odwrotnego. Stąd osobna zmienna:
 * gdy jest, używamy jej, a gdy jej nie ma, zostaje DATABASE_URL, co wystarcza
 * lokalnie, gdzie żadnej puli nie ma.
 *
 * Patrz docs/decyzje/007.
 */
const url = process.env.DATABASE_URL_MIGRACJE ?? process.env.DATABASE_URL;
if (!url) {
  console.error(
    [
      "Brak DATABASE_URL.",
      "",
      "Lokalnie:  cp .env.example .env, potem pnpm db:up",
      "Na Vercelu: ustaw DATABASE_URL w zmiennych środowiskowych projektu.",
      "            Aplikacja przez pulę (port 6543), migracje bezpośrednio (5432)",
      "            w osobnej zmiennej DATABASE_URL_MIGRACJE. Patrz docs/decyzje/007.",
    ].join("\n"),
  );
  process.exit(1);
}

// Postgres wypisuje NOTICE przy `if not exists`. Wyciszamy, bo w logach CI
// wyglądają jak błędy i mylą przy czytaniu nieudanego przebiegu.
const sql = postgres(url, { max: 1, onnotice: () => {} });

async function zapewnijTabeleMigracji(): Promise<void> {
  await sql`
    create table if not exists _migracje (
      nazwa text primary key,
      zastosowana_o timestamptz not null default now()
    )
  `;
}

function wszystkieMigracje(): string[] {
  return readdirSync(KATALOG)
    .filter((plik) => plik.endsWith(".sql"))
    .sort();
}

async function zastosowane(): Promise<Set<string>> {
  const wiersze = await sql<{ nazwa: string }[]>`select nazwa from _migracje order by nazwa`;
  return new Set(wiersze.map((w) => w.nazwa));
}

/**
 * Drizzle rozdziela instrukcje znacznikiem `--> statement-breakpoint`.
 * Wykonujemy je pojedynczo, ale w jednej transakcji.
 */
function instrukcje(tresc: string): string[] {
  return tresc
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function wPrzod(): Promise<void> {
  await zapewnijTabeleMigracji();
  const juz = await zastosowane();
  const doZrobienia = wszystkieMigracje().filter((nazwa) => !juz.has(nazwa));

  if (doZrobienia.length === 0) {
    console.log("Baza aktualna, nic do zastosowania.");
    return;
  }

  for (const nazwa of doZrobienia) {
    const tresc = readFileSync(join(KATALOG, nazwa), "utf8");
    await sql.begin(async (tx) => {
      for (const instrukcja of instrukcje(tresc)) {
        await tx.unsafe(instrukcja);
      }
      await tx`insert into _migracje (nazwa) values (${nazwa})`;
    });
    console.log(`w przód  ${nazwa}`);
  }
}

async function wTyl(ile: number): Promise<void> {
  await zapewnijTabeleMigracji();
  const wiersze = await sql<{ nazwa: string }[]>`
    select nazwa from _migracje order by nazwa desc limit ${ile}
  `;

  if (wiersze.length === 0) {
    console.log("Nie ma czego cofać.");
    return;
  }

  for (const { nazwa } of wiersze) {
    const plikDown = join(KATALOG_DOWN, nazwa.replace(/\.sql$/, ".down.sql"));
    let tresc: string;
    try {
      tresc = readFileSync(plikDown, "utf8");
    } catch {
      console.error(
        `Brak cofnięcia dla ${nazwa}. Oczekiwano ${plikDown}.\n` +
          "Migracja bez działającego cofnięcia nie przechodzi w tym projekcie.",
      );
      process.exit(1);
    }
    await sql.begin(async (tx) => {
      for (const instrukcja of instrukcje(tresc)) {
        await tx.unsafe(instrukcja);
      }
      // Jedyne `delete` w projekcie. `_migracje` to tabela techniczna runnera,
      // nie dane biznesowe — zakaz twardego usuwania dotyczy danych, nie dziennika.
      await tx`delete from _migracje where nazwa = ${nazwa}`;
    });
    console.log(`w tył    ${nazwa}`);
  }
}

const polecenie = process.argv[2] ?? "up";
const ile = Number(process.argv[3] ?? "1");

try {
  if (polecenie === "up") {
    await wPrzod();
  } else if (polecenie === "down") {
    await wTyl(Number.isFinite(ile) && ile > 0 ? ile : 1);
  } else {
    console.error(`Nieznane polecenie: ${polecenie}. Użyj: up | down [ile]`);
    process.exit(1);
  }
} finally {
  await sql.end();
}

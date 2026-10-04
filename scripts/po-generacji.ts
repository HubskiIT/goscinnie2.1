/**
 * Krok po `drizzle-kit generate`.
 *
 * drizzle-kit opakowuje typy własne w cudzysłów, więc `geography(Point,4326)`
 * ląduje w SQL jako `"geography(Point,4326)"`. PostGIS takiego typu nie zna
 * i migracja wykłada się na pierwszej tabeli z kolumną `point`.
 *
 * Zamiast poprawiać to ręcznie po każdym generowaniu, zdejmujemy cudzysłów tutaj.
 *
 * Skrypt jest celowo nieufny wobec samego siebie. Jeśli schemat deklaruje
 * kolumny geography, a w wygenerowanym SQL nie ma ani jednego wystąpienia
 * do podmiany, to znaczy, że drizzle-kit zmienił format wyjścia. Wtedy
 * kończymy błędem, bo cicha zgoda oznaczałaby, że skrypt przez dwa tygodnie
 * nic nie robi, a nikt tego nie zauważy.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const KATALOG_MIGRACJI = join(process.cwd(), "drizzle");
const KATALOG_SCHEMATU = join(process.cwd(), "lib", "db", "schema");

const TYP_CYTOWANY = /"(geography\([^"]*\))"/g;
/** Wystąpienie już poprawione, czyli bez cudzysłowu. */
const TYP_GOLY = /(?<!")geography\(/;

/** Czy schemat Drizzle w ogóle deklaruje kolumny geography. */
function schematUzywaGeography(): boolean {
  return readdirSync(KATALOG_SCHEMATU)
    .filter((plik) => plik.endsWith(".ts"))
    .some((plik) => readFileSync(join(KATALOG_SCHEMATU, plik), "utf8").includes("geography("));
}

const plikiSql = readdirSync(KATALOG_MIGRACJI).filter((plik) => plik.endsWith(".sql"));

let poprawionych = 0;
let jużPoprawnych = 0;

for (const plik of plikiSql) {
  const sciezka = join(KATALOG_MIGRACJI, plik);
  const tresc = readFileSync(sciezka, "utf8");
  const poprawiona = tresc.replace(TYP_CYTOWANY, "$1");

  if (poprawiona !== tresc) {
    writeFileSync(sciezka, poprawiona);
    console.log(`zdjęto cudzysłów z typu geography: ${plik}`);
    poprawionych += 1;
  } else if (TYP_GOLY.test(tresc)) {
    jużPoprawnych += 1;
  }
}

if (schematUzywaGeography() && poprawionych === 0 && jużPoprawnych === 0) {
  console.error(
    [
      "",
      "BŁĄD: schemat Drizzle deklaruje kolumny geography, ale w żadnym pliku",
      "SQL w drizzle/ nie ma typu geography, ani cytowanego, ani gołego.",
      "",
      "Najbardziej prawdopodobna przyczyna: aktualizacja drizzle-kit zmieniła",
      "format wyjścia i ten skrypt przestał trafiać w to, co miał poprawiać.",
      "",
      "Co zrobić: zajrzyj do najnowszego pliku w drizzle/ i sprawdź, jak teraz",
      "zapisywany jest typ kolumny point. Jeśli drizzle-kit generuje go już",
      "poprawnie, usuń ten skrypt i krok db:generate w package.json zamiast",
      "zostawiać martwe ogniwo.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

if (poprawionych === 0) {
  console.log("Nic do poprawienia, typ geography jest już w porządku.");
}

console.log(
  "\nPamiętaj o cofnięciu: każda nowa migracja potrzebuje pliku\n" +
    "drizzle/down/<nazwa>.down.sql. Bez niego CI nie przejdzie.",
);

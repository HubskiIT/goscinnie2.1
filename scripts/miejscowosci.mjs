/**
 * Łączy trzy publiczne zbiory w jeden plik z miejscowościami Polski:
 *
 *   TERYT SIMC (GUS)  — nazwy, rodzaj, przypisanie do gminy
 *   TERYT TERC (GUS)  — nazwy gmin, powiatów i województw
 *   PRNG (GUGiK)      — współrzędne, powiązane identyfikatorem SIMC
 *
 * Uruchomienie: node scripts/miejscowosci.mjs
 * Wynik: content/miejscowosci.json.gz, czytany na serwerze przy pierwszym
 * zapytaniu o podpowiedzi. Plik nie trafia do paczki przeglądarki.
 *
 * Skrypt kończy się błędem, gdy slug się powtórzy. Cicha kolizja oznaczałaby
 * dwa różne miejsca pod jednym adresem.
 */
import { execFileSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { createGzip } from "node:zlib";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const KATALOG_DANYCH = join(KORZEN, "scripts", "dane");
const WYNIK = join(KORZEN, "content", "miejscowosci.json.gz");

/** Symbole rodzaju miejscowości z TERYT (słownik WMRODZ). */
const RODZAJE = {
  "00": "część miejscowości",
  "01": "wieś",
  "02": "kolonia",
  "03": "przysiółek",
  "04": "osada",
  "05": "osada leśna",
  "06": "osiedle",
  "07": "schronisko turystyczne",
  95: "dzielnica Warszawy",
  96: "miasto",
  98: "delegatura",
  99: "część miasta",
};

function wczytajCsv(sciezka) {
  const tresc = readFileSync(sciezka, "utf8").replace(/^﻿/, "");
  const linie = tresc.split(/\r?\n/).filter((l) => l !== "");
  const naglowek = linie[0].split(";");
  return linie.slice(1).map((linia) => {
    const pola = linia.split(";");
    return Object.fromEntries(naglowek.map((k, i) => [k, pola[i] ?? ""]));
  });
}

/**
 * Czyta jeden plik z archiwum zip na standardowe wyjście programu unzip.
 * Świadomie bez biblioteki: projekt nie dodaje zależności bez zgody,
 * a unzip jest i na macOS, i na obrazie CI.
 */
function zZipa(archiwum, plik) {
  return execFileSync("unzip", ["-p", archiwum, plik], {
    maxBuffer: 512 * 1024 * 1024,
    encoding: "utf8",
  });
}

/** Współrzędne PRNG: 50°43'05" 16°39'17" → [50.7181, 16.6547]. */
function stopnieNaDziesietne(zapis) {
  const dopasowania = [...zapis.matchAll(/(\d+)°(\d+)'([\d.]+)"/g)];
  if (dopasowania.length !== 2) return null;
  const [szerokosc, dlugosc] = dopasowania.map(
    (m) => Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600,
  );
  return [Number(szerokosc.toFixed(5)), Number(dlugosc.toFixed(5))];
}

export function slugZNazwy(nazwa) {
  return nazwa
    .toLowerCase()
    .replaceAll("ł", "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Z pliku PRNG w formacie xlsx wyciągamy tylko identyfikator SIMC i współrzędne. */
function wspolrzedneZPrng(archiwum) {
  const nazwaWewnetrzna = "PRNG_MIEJSCOWOSCI_XLSX.xlsx";
  const tymczasowy = join(KATALOG_DANYCH, nazwaWewnetrzna);
  if (!existsSync(tymczasowy)) {
    execFileSync("unzip", ["-o", "-q", archiwum, nazwaWewnetrzna, "-d", KATALOG_DANYCH]);
  }

  // Arkusz odwołuje się do tekstów przez indeks we wspólnej tablicy.
  const teksty = [];
  for (const m of zZipa(tymczasowy, "xl/sharedStrings.xml").matchAll(/<si>(.*?)<\/si>/gs)) {
    teksty.push(
      [...m[1].matchAll(/<t[^>]*>(.*?)<\/t>/gs)]
        .map((t) => t[1])
        .join("")
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&quot;", '"')
        .replaceAll("&apos;", "'"),
    );
  }

  const KOLUMNA_ID_ZEWNETRZNEGO = 14;
  const KOLUMNA_WSPOLRZEDNYCH = 19;
  const wspolrzedne = new Map();
  const arkusz = zZipa(tymczasowy, "xl/worksheets/sheet1.xml");

  for (const wiersz of arkusz.matchAll(/<row[^>]*>(.*?)<\/row>/gs)) {
    const komorki = [];
    // Arkusz pomija puste komórki, więc numer kolumny bierzemy z adresu
    // komórki (r="O2"), a nie z kolejności wystąpienia.
    for (const k of wiersz[1].matchAll(/<c\s([^>]*?)\/?>(?:<v>(.*?)<\/v>)?(?:<\/c>)?/gs)) {
      const atrybuty = k[1];
      const adres = /r="([A-Z]+)\d+"/.exec(atrybuty);
      if (adres === null) continue;
      let kolumna = 0;
      for (const litera of adres[1]) kolumna = kolumna * 26 + (litera.charCodeAt(0) - 64);
      const typ = /t="(\w+)"/.exec(atrybuty);
      komorki[kolumna - 1] = typ?.[1] === "s" ? (teksty[Number(k[2])] ?? "") : (k[2] ?? "");
    }
    const simc = komorki[KOLUMNA_ID_ZEWNETRZNEGO];
    const zapis = komorki[KOLUMNA_WSPOLRZEDNYCH];
    if (!simc || !zapis) continue;
    const punkt = stopnieNaDziesietne(zapis);
    if (punkt !== null && !wspolrzedne.has(simc)) wspolrzedne.set(simc, punkt);
  }
  return wspolrzedne;
}

function znajdz(wzor) {
  const pliki = execFileSync("ls", [KATALOG_DANYCH], { encoding: "utf8" }).split("\n");
  const trafienie = pliki.find((p) => wzor.test(p));
  if (trafienie === undefined) {
    throw new Error(
      `Brak pliku pasującego do ${wzor} w ${KATALOG_DANYCH}. ` +
        "Uruchom najpierw: node scripts/pobierz-dane.mjs",
    );
  }
  return join(KATALOG_DANYCH, trafienie);
}

async function main() {
  mkdirSync(KATALOG_DANYCH, { recursive: true });

  const terc = wczytajCsv(znajdz(/^TERC_.*\.csv$/));
  const simc = wczytajCsv(znajdz(/^SIMC_.*\.csv$/));
  const wspolrzedne = wspolrzedneZPrng(znajdz(/^prng-miejscowosci\.zip$/));

  const wojewodztwa = new Map();
  const powiaty = new Map();
  const gminy = new Map();
  for (const w of terc) {
    if (w.POW === "" && w.GMI === "") wojewodztwa.set(w.WOJ, w.NAZWA.toLowerCase());
    else if (w.GMI === "") powiaty.set(`${w.WOJ}${w.POW}`, w.NAZWA);
    else gminy.set(`${w.WOJ}${w.POW}${w.GMI}`, w.NAZWA);
  }

  const wpisy = simc.map((m) => ({
    id: m.SYM,
    nazwa: m.NAZWA,
    rodzaj: RODZAJE[m.RM] ?? "miejscowość",
    gmina: gminy.get(`${m.WOJ}${m.POW}${m.GMI}`) ?? "",
    powiat: powiaty.get(`${m.WOJ}${m.POW}`) ?? "",
    wojewodztwo: wojewodztwa.get(m.WOJ) ?? "",
    punkt: wspolrzedne.get(m.SYM) ?? null,
  }));

  // Slug: sama nazwa, gdy jest jedyna. Inaczej dokładamy gminę, potem powiat,
  // na końcu identyfikator SIMC, bo "Nowa Wieś" występuje setki razy.
  const ileNazw = new Map();
  for (const w of wpisy) {
    const podstawa = slugZNazwy(w.nazwa);
    ileNazw.set(podstawa, (ileNazw.get(podstawa) ?? 0) + 1);
  }
  // Gdy nazwę nosi dokładnie jedno miasto, to ono bierze krótki slug: /lokale/.../lodz
  // prowadzi do Łodzi, a nie do wsi Łódź pod Poznaniem.
  const ileMiast = new Map();
  for (const w of wpisy) {
    if (w.rodzaj !== "miasto") continue;
    const podstawa = slugZNazwy(w.nazwa);
    ileMiast.set(podstawa, (ileMiast.get(podstawa) ?? 0) + 1);
  }

  const zajete = new Set();
  for (const w of wpisy) {
    const podstawa = slugZNazwy(w.nazwa);
    const samodzielny =
      ileNazw.get(podstawa) === 1 || (w.rodzaj === "miasto" && ileMiast.get(podstawa) === 1);
    const kandydaci = samodzielny
      ? [podstawa]
      : [
          `${podstawa}-${slugZNazwy(w.gmina)}`,
          `${podstawa}-${slugZNazwy(w.powiat)}`,
          `${podstawa}-${w.id}`,
        ];
    w.slug = kandydaci.find((k) => !zajete.has(k)) ?? `${podstawa}-${w.id}`;
    if (zajete.has(w.slug)) {
      throw new Error(`Kolizja sluga: ${w.slug} (${w.nazwa}, ${w.gmina})`);
    }
    zajete.add(w.slug);
  }

  const bezWspolrzednych = wpisy.filter((w) => w.punkt === null).length;
  const tresc = JSON.stringify(
    wpisy.map((w) => [w.id, w.slug, w.nazwa, w.rodzaj, w.gmina, w.powiat, w.wojewodztwo, w.punkt]),
  );
  await pipeline(Readable.from([tresc]), createGzip({ level: 9 }), createWriteStream(WYNIK));

  console.log(`miejscowości: ${wpisy.length}`);
  console.log(`bez współrzędnych: ${bezWspolrzednych}`);
  console.log(`slugów: ${zajete.size}`);
  console.log(`zapisano: ${WYNIK}`);
}

await main();

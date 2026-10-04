/**
 * Pobiera publiczne zbiory potrzebne skryptowi miejscowosci.mjs.
 * Dane są darmowe i otwarte, ale duże, więc leżą poza repozytorium.
 */
import { execFileSync } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const KATALOG = join(dirname(fileURLToPath(import.meta.url)), "dane");

const PRNG =
  "https://api.dane.gov.pl/resources/30102,panstwowy-rejestr-nazw-geograficznych-miejscowosci-format-xlsx/file";
const TERYT =
  "https://eteryt.stat.gov.pl/eTeryt/rejestr_teryt/udostepnianie_danych/baza_teryt/" +
  "uzytkownicy_indywidualni/pobieranie/pliki_pelne.aspx?contrast=default";

async function pobierz(adres, docelowy) {
  const odpowiedz = await fetch(adres);
  if (!odpowiedz.ok) throw new Error(`${adres} zwróciło ${odpowiedz.status}`);
  await pipeline(Readable.fromWeb(odpowiedz.body), createWriteStream(docelowy));
  console.log(`pobrano ${docelowy}`);
}

/** Strona GUS wymaga odesłania ukrytych pól formularza ASP.NET. */
async function pobierzZTeryt(przycisk, docelowy) {
  const strona = await (await fetch(TERYT)).text();
  const pola = new URLSearchParams();
  for (const m of strona.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
    const nazwa = /name="([^"]+)"/.exec(m[0]);
    const wartosc = /value="([^"]*)"/.exec(m[0]);
    if (nazwa) {
      pola.set(
        nazwa[1],
        (wartosc?.[1] ?? "")
          .replaceAll("&amp;", "&")
          .replaceAll("&lt;", "<")
          .replaceAll("&gt;", ">")
          .replaceAll("&quot;", '"'),
      );
    }
  }
  pola.set("__EVENTTARGET", przycisk);
  pola.set("__EVENTARGUMENT", "");

  const odpowiedz = await fetch(TERYT, { method: "POST", body: pola });
  if (!odpowiedz.ok) throw new Error(`TERYT zwróciło ${odpowiedz.status}`);
  await pipeline(Readable.fromWeb(odpowiedz.body), createWriteStream(docelowy));
  console.log(`pobrano ${docelowy}`);
}

mkdirSync(KATALOG, { recursive: true });
await pobierz(PRNG, join(KATALOG, "prng-miejscowosci.zip"));
await pobierzZTeryt("ctl00$body$BSIMCUrzedowyPobierz", join(KATALOG, "simc.zip"));
await pobierzZTeryt("ctl00$body$BTERCUrzedowyPobierz", join(KATALOG, "terc.zip"));
for (const archiwum of ["simc.zip", "terc.zip"]) {
  execFileSync("unzip", ["-o", "-q", join(KATALOG, archiwum), "-d", KATALOG]);
}
console.log("gotowe");

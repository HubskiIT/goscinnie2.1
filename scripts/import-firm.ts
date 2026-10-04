/**
 * Import firm z pliku CSV.
 *
 * To jest zalążek właściwego importu, a nie skrypt na jeden raz, więc jest
 * napisany tak, żeby dało się nim wgrać sześćset wierszy i wiedzieć, co się
 * stało z każdym.
 *
 * Trzy zasady, które z tego wynikają:
 *
 * 1. **Sprawdzamy cały plik, zanim zapiszemy cokolwiek.** Import, który wysypuje
 *    się na czterystym wierszu, zostawia bazę w stanie nie do opisania.
 * 2. **Powtórne uruchomienie tego samego pliku niczego nie psuje.** Firmy
 *    rozpoznajemy po slugu: istniejące pomijamy, nie nadpisujemy. Slug jest
 *    niezmienny (decyzja 005), więc jest stabilnym identyfikatorem.
 * 3. **Nic nie znika.** Skrypt tylko dodaje. Usuwaniem firm z importu zajmuje
 *    się moderacja, nie plik CSV.
 *
 * Wszystkie firmy wchodzą ze statusem `draft`: profil istnieje i jest publicznie
 * widoczny, ale prosi właściciela o przejęcie.
 *
 * Format pliku, pierwszy wiersz to nagłówki:
 *
 *   nazwa,miasto,lon,lat,kategoria,opis,cena_od_zl,pojemnosc_min,pojemnosc_max
 *
 * Kolumny `opis`, `cena_od_zl`, `pojemnosc_min` i `pojemnosc_max` mogą być puste.
 * Puste `cena_od_zl` znaczy „do uzupełnienia”, nie „za darmo”.
 *
 * Użycie:
 *   tsx scripts/import-firm.ts <plik.csv> [--na-sucho]
 */
import { readFileSync } from "node:fs";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { cities } from "@/lib/db/schema/geografia";
import { categories, companies, companyCategories } from "@/lib/db/schema/katalog";
import { users } from "@/lib/db/schema/tozsamosc";

const NAGLOWKI = [
  "nazwa",
  "miasto",
  "lon",
  "lat",
  "kategoria",
  "opis",
  "cena_od_zl",
  "pojemnosc_min",
  "pojemnosc_max",
] as const;

type Wiersz = Record<(typeof NAGLOWKI)[number], string>;

type Firma = {
  nazwa: string;
  slug: string;
  miasto: string;
  lon: number;
  lat: number;
  kategoria: string;
  opis: string;
  cenaOd: number | null;
  pojemnoscMin: number | null;
  pojemnoscMax: number | null;
};

function zakoncz(komunikat: string): never {
  console.error(komunikat);
  process.exit(1);
}

/**
 * Parser CSV obsługujący cudzysłowy i przecinki w treści.
 *
 * Napisany ręcznie, bo to kilkanaście linii, a biblioteka byłaby kolejną
 * zależnością do zatwierdzenia. Obsługuje to, co naprawdę występuje w plikach
 * z wykazów: pola w cudzysłowach, przecinki i podwojone cudzysłowy w środku.
 */
function podzielWiersz(linia: string): string[] {
  const pola: string[] = [];
  let biezace = "";
  let wCudzyslowie = false;

  for (let i = 0; i < linia.length; i += 1) {
    const znak = linia[i];

    if (znak === '"') {
      if (wCudzyslowie && linia[i + 1] === '"') {
        biezace += '"';
        i += 1;
      } else {
        wCudzyslowie = !wCudzyslowie;
      }
      continue;
    }

    if (znak === "," && !wCudzyslowie) {
      pola.push(biezace);
      biezace = "";
      continue;
    }

    biezace += znak;
  }

  pola.push(biezace);
  return pola.map((p) => p.trim());
}

/**
 * Slug z nazwy. Polskie znaki zamieniamy na łacińskie, resztę na myślniki.
 *
 * Slug powstaje raz i nie zmienia się nigdy, także przy zmianie nazwy
 * (decyzja 005), więc ta funkcja jest wywoływana wyłącznie przy tworzeniu.
 */
function zrobSlug(nazwa: string): string {
  const bezOgonkow = nazwa
    .toLowerCase()
    .replaceAll("ą", "a")
    .replaceAll("ć", "c")
    .replaceAll("ę", "e")
    .replaceAll("ł", "l")
    .replaceAll("ń", "n")
    .replaceAll("ó", "o")
    .replaceAll("ś", "s")
    .replaceAll("ź", "z")
    .replaceAll("ż", "z");

  return bezOgonkow
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function liczbaAlboNull(tekst: string, pole: string, wiersz: number): number | null {
  if (tekst === "") return null;
  const wartosc = Number(tekst.replace(",", "."));
  if (!Number.isFinite(wartosc)) {
    zakoncz(`Wiersz ${wiersz}: pole ${pole} nie jest liczbą: „${tekst}”.`);
  }
  return wartosc;
}

function wczytaj(sciezka: string): Firma[] {
  let tresc: string;
  try {
    tresc = readFileSync(sciezka, "utf8");
  } catch {
    zakoncz(`Nie mogę otworzyć pliku ${sciezka}.`);
  }

  const linie = tresc
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (linie.length < 2) zakoncz("Plik nie ma ani jednego wiersza z danymi.");

  const naglowki = podzielWiersz(linie[0] ?? "");
  for (const wymagany of NAGLOWKI) {
    if (!naglowki.includes(wymagany)) {
      zakoncz(`Brak kolumny „${wymagany}”. Oczekiwane: ${NAGLOWKI.join(", ")}.`);
    }
  }

  const firmy: Firma[] = [];

  for (let i = 1; i < linie.length; i += 1) {
    const pola = podzielWiersz(linie[i] ?? "");
    const wiersz = Object.fromEntries(naglowki.map((n, j) => [n, pola[j] ?? ""])) as Wiersz;
    const nrWiersza = i + 1;

    if (!wiersz.nazwa) zakoncz(`Wiersz ${nrWiersza}: pusta nazwa.`);
    if (!wiersz.miasto) zakoncz(`Wiersz ${nrWiersza}: puste miasto.`);
    if (!wiersz.kategoria) zakoncz(`Wiersz ${nrWiersza}: pusta kategoria.`);

    const lon = liczbaAlboNull(wiersz.lon, "lon", nrWiersza);
    const lat = liczbaAlboNull(wiersz.lat, "lat", nrWiersza);
    if (lon === null || lat === null) {
      zakoncz(`Wiersz ${nrWiersza}: współrzędne są obowiązkowe.`);
    }
    // Polska mieści się w tych granicach. Zamienione miejscami lon i lat to
    // najczęstszy błąd w plikach z wykazów i wychodzi dopiero na mapie.
    if (lon < 14 || lon > 25 || lat < 49 || lat > 55) {
      zakoncz(
        `Wiersz ${nrWiersza}: współrzędne ${lat}, ${lon} leżą poza Polską. ` +
          "Sprawdź, czy kolumny lon i lat nie są zamienione miejscami.",
      );
    }

    const cenaZl = liczbaAlboNull(wiersz.cena_od_zl, "cena_od_zl", nrWiersza);

    firmy.push({
      nazwa: wiersz.nazwa,
      slug: zrobSlug(wiersz.nazwa),
      miasto: wiersz.miasto,
      lon,
      lat,
      kategoria: wiersz.kategoria,
      opis: wiersz.opis,
      cenaOd: cenaZl === null ? null : Math.round(cenaZl * 100),
      pojemnoscMin: liczbaAlboNull(wiersz.pojemnosc_min, "pojemnosc_min", nrWiersza),
      pojemnoscMax: liczbaAlboNull(wiersz.pojemnosc_max, "pojemnosc_max", nrWiersza),
    });
  }

  const slugi = new Set<string>();
  for (const firma of firmy) {
    if (slugi.has(firma.slug)) {
      zakoncz(
        `Dwie firmy dają ten sam adres profilu: „${firma.slug}” (${firma.nazwa}). ` +
          "Rozróżnij nazwy, na przykład dopisując miejscowość.",
      );
    }
    slugi.add(firma.slug);
  }

  return firmy;
}

async function importuj(sciezka: string, naSucho: boolean): Promise<void> {
  const firmy = wczytaj(sciezka);
  console.log(`Wczytano ${firmy.length} firm z ${sciezka}.`);

  // Właściciel techniczny profilu z importu. Kolumna jest wymagana, a profil
  // nieodebrany nie ma jeszcze prawdziwego właściciela: ten pojawia się dopiero
  // w company_members, po zatwierdzeniu wniosku o przejęcie.
  const [wlascicielTechniczny] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "moderator"))
    .limit(1);

  if (!wlascicielTechniczny) {
    zakoncz("Brak konta moderatora w bazie. Import potrzebuje właściciela technicznego.");
  }

  const miastaWBazie = await db.select({ id: cities.id, name: cities.name }).from(cities);
  const kategorieWBazie = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories);

  const wgMiasta = new Map(miastaWBazie.map((m) => [m.name.toLowerCase(), m.id]));
  const wgKategorii = new Map(kategorieWBazie.map((k) => [k.slug.toLowerCase(), k.id]));

  // Sprawdzamy WSZYSTKIE odwołania przed pierwszym zapisem. Import, który
  // wywraca się w połowie, zostawia bazę w stanie nie do opisania w raporcie.
  for (const firma of firmy) {
    if (!wgMiasta.has(firma.miasto.toLowerCase())) {
      zakoncz(`Nie ma miasta „${firma.miasto}” w słowniku. Dodaj je do bazy albo popraw plik.`);
    }
    if (!wgKategorii.has(firma.kategoria.toLowerCase())) {
      zakoncz(
        `Nie ma kategorii „${firma.kategoria}”. Dostępne: ${[...wgKategorii.keys()].join(", ")}.`,
      );
    }
  }

  const istniejace = await db
    .select({ slug: companies.slug })
    .from(companies)
    .where(
      inArray(
        companies.slug,
        firmy.map((f) => f.slug),
      ),
    );
  const juzSa = new Set(istniejace.map((f) => f.slug));

  const doWgrania = firmy.filter((f) => !juzSa.has(f.slug));

  console.log(
    `Do wgrania: ${doWgrania.length}. Pominiętych, bo już są: ${firmy.length - doWgrania.length}.`,
  );

  if (naSucho) {
    console.log("\nTryb na sucho, nic nie zapisano. Wgrane zostałyby:");
    for (const firma of doWgrania) console.log(`  /f/${firma.slug}  ${firma.nazwa}`);
    return;
  }

  if (doWgrania.length === 0) {
    console.log("Nie ma czego wgrywać.");
    return;
  }

  await db.transaction(async (tx) => {
    const wstawione = await tx
      .insert(companies)
      .values(
        doWgrania.map((firma) => ({
          ownerUserId: wlascicielTechniczny.id,
          name: firma.nazwa,
          slug: firma.slug,
          cityId: wgMiasta.get(firma.miasto.toLowerCase()) ?? "",
          point: { lon: firma.lon, lat: firma.lat },
          description: firma.opis,
          priceFrom: firma.cenaOd,
          capacityMin: firma.pojemnoscMin,
          capacityMax: firma.pojemnoscMax,
          // Profil istnieje i jest widoczny, ale czeka na właściciela.
          status: "draft" as const,
        })),
      )
      .returning({ id: companies.id, slug: companies.slug });

    const wgSluga = new Map(wstawione.map((f) => [f.slug, f.id]));

    await tx.insert(companyCategories).values(
      doWgrania.map((firma) => ({
        companyId: wgSluga.get(firma.slug) ?? "",
        categoryId: wgKategorii.get(firma.kategoria.toLowerCase()) ?? "",
      })),
    );
  });

  console.log(`\nWgrano ${doWgrania.length} firm. Adresy profili:`);
  for (const firma of doWgrania) console.log(`  /f/${firma.slug}`);
}

const [sciezka, ...reszta] = process.argv.slice(2);
if (!sciezka) {
  zakoncz("Użycie: tsx scripts/import-firm.ts <plik.csv> [--na-sucho]");
}

await importuj(sciezka, reszta.includes("--na-sucho"));
process.exit(0);

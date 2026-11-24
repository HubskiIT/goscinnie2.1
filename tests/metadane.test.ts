/**
 * Metadane stron: adres kanoniczny i karta podglądu linku.
 *
 * Reguła, której pilnuje ten plik: **każda strona publiczna, którą wolno
 * zaindeksować, podaje swój własny adres kanoniczny**, a każda, której
 * zaindeksować nie wolno, mówi to wprost w metadanych.
 *
 * Dlaczego to nie jest kosmetyka. Metadane w App Routerze dziedziczą się
 * całymi obiektami, więc strona bez własnego adresu kanonicznego bierze
 * adres z `app/layout.tsx`. Gdyby ten adres tam stał, cały katalog
 * zgłosiłby się do indeksu jako jedna strona, czyli zniknąłby z wyników
 * skuteczniej niż po `noindex`. Dlatego w layoucie go nie ma, a skoro go
 * tam nie ma, musi go podać każda strona osobno i nie ma kto tego dopilnować
 * poza tym testem.
 *
 * Nie wymaga bazy.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { metadaneBezIndeksu, metadaneStrony } from "@/lib/metadane";
import { TRASY } from "@/lib/trasy";

const KATALOG_PUBLICZNY = "app/(publiczne)";

function stronyPubliczne(katalog: string = KATALOG_PUBLICZNY): string[] {
  return readdirSync(katalog).flatMap((wpis) => {
    const sciezka = join(katalog, wpis);
    if (statSync(sciezka).isDirectory()) return stronyPubliczne(sciezka);
    return wpis === "page.tsx" ? [sciezka] : [];
  });
}

/** Trasa pod adresem pliku strony: `app/(publiczne)/lokale/page.tsx` → `/lokale`. */
function trasaPliku(sciezka: string): string {
  const bez = sciezka.slice(KATALOG_PUBLICZNY.length).replace(/\/page\.tsx$/, "");
  return bez === "" ? "/" : bez;
}

/**
 * Ścieżki, których zabrania robots.txt, czytane z `app/robots.ts`.
 *
 * Czytane, nie przepisane. Strona, do której robot nie ma wstępu, **nigdy nie
 * przeczyta znacznika `noindex`** w jej treści, bo po to jest zakaz w
 * robots.txt, żeby jej nie pobierał. Wymaganie obu rzeczy naraz byłoby
 * wymaganiem czegoś bez skutku, a lista przepisana ręcznie rozjechałaby się
 * z robots.txt przy pierwszej zmianie.
 */
async function zakazaneWRobots(): Promise<string[]> {
  const poprzednia = process.env.INDEKSOWANIE;
  process.env.INDEKSOWANIE = "wlaczone";
  const { default: robots } = await import("@/app/robots");
  const regula = robots().rules;
  const pierwsza = Array.isArray(regula) ? regula[0] : regula;
  if (poprzednia === undefined) delete process.env.INDEKSOWANIE;
  else process.env.INDEKSOWANIE = poprzednia;

  const zakazy = pierwsza?.disallow ?? [];
  return Array.isArray(zakazy) ? zakazy : [zakazy];
}

describe("metadaneStrony", () => {
  const dane = metadaneStrony({
    tytul: "Sale i lokale",
    opis: "Opis listy lokali.",
    sciezka: TRASY.lokale,
  });

  it("adres kanoniczny i og:url wskazują tę samą ścieżkę", () => {
    // Rozjazd między nimi mówi wyszukiwarce i komunikatorowi dwie różne
    // rzeczy o tym, która strona jest tą właściwą.
    expect(dane.alternates?.canonical).toBe(TRASY.lokale);
    expect(dane.openGraph?.url).toBe(TRASY.lokale);
  });

  it("karta podglądu ma komplet, nie tylko adres", () => {
    /*
     * Tu siedzi pułapka, pod którą powstał ten pomocnik: strona dopisująca
     * do siebie samo `openGraph: { url }` zastępuje cały obiekt z layoutu
     * i gubi nazwę serwisu oraz język. Karta podglądu przestaje wtedy
     * powstawać, choć adres jest poprawny.
     */
    expect(dane.openGraph).toMatchObject({
      siteName: "Gościnnie",
      locale: "pl_PL",
      type: "website",
      title: "Sale i lokale",
    });
    expect(dane.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("tytuł idzie bez marki, bo markę dokłada szablon z layoutu", () => {
    // „Sale i lokale | Gościnnie | Gościnnie” to objaw tytułu z marką
    // wpisaną ręcznie obok szablonu.
    expect(dane.title).toBe("Sale i lokale");
    expect(String(dane.title)).not.toContain("Gościnnie");
  });
});

describe("metadaneBezIndeksu", () => {
  const dane = metadaneBezIndeksu("Logowanie", "Zaloguj się do Gościnnie.");

  it("zamyka indeksowanie, ale zostawia linki otwarte", () => {
    /*
     * `follow: true` jest celowe i dlatego ma własne sprawdzenie. `nofollow`
     * na logowaniu zamykałby drogę do stron z całej stopki, czyli do katalogu,
     * który indeksujemy. Zamykamy stronę, nie wyjścia z niej.
     */
    expect(dane.robots).toEqual({ index: false, follow: true });
  });
});

describe("konwencja: każda strona publiczna rozstrzyga swój adres kanoniczny", () => {
  it("znajduje strony, bo inaczej ten plik przechodziłby na pustej liście", () => {
    // Test, który nic nie obejrzał, przechodzi tak samo jak test, który
    // obejrzał wszystko. Bez tego sprawdzenia literówka w ścieżce katalogu
    // zamieniłaby cały ten opis w zawsze zielony.
    expect(stronyPubliczne().length).toBeGreaterThan(15);
  });

  it("każda strona poza zakazanymi w robots.txt podaje adres albo odmowę indeksu", async () => {
    const zakazane = await zakazaneWRobots();
    const braki: string[] = [];

    for (const plik of stronyPubliczne()) {
      const trasa = trasaPliku(plik);
      if (zakazane.some((zakaz) => trasa.startsWith(zakaz.replace(/\/$/, "")))) continue;

      const tresc = readFileSync(plik, "utf8");
      const maAdres = tresc.includes("metadaneStrony") || tresc.includes("alternates");
      const maOdmowe = tresc.includes("metadaneBezIndeksu");
      if (!maAdres && !maOdmowe) braki.push(plik);
    }

    expect(braki).toEqual([]);
  });
});

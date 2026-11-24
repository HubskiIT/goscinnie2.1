/**
 * Mapa witryny.
 *
 * Reguła biznesowa: w `sitemap.xml` stoją wyłącznie profile widoczne
 * w katalogu, czyli firmy w stanie `active` z trwającym abonamentem.
 *
 * Dlaczego to nie jest kosmetyka. Slug szkicu w mapie witryny wskazuje
 * wyszukiwarkom profil, którego właściciel jeszcze nikomu nie pokazał,
 * a strona pod tym adresem i tak oddaje 404. Wyciek jest tu podwójny:
 * nazwa firmy, która nie chciała być widoczna, i mapa obiecująca strony,
 * których nie ma.
 *
 * Wymaga działającej bazy z zasiewem.
 */
import { and, eq, exists, gt, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { db } from "@/lib/db";
import { pobierzFirmeKatalogu, pobierzSlugiFirmDoSitemapy } from "@/lib/db/queries/katalog";
import { subscriptions } from "@/lib/db/schema/abonament";
import { companies } from "@/lib/db/schema/katalog";
import { NiezaimplementowanaGalazUprawnien, type Widz } from "@/lib/permissions";
import { TRASY } from "@/lib/trasy";

const ANONIM: Widz = { rodzaj: "anonim" };
/**
 * Widz spoza typu `Widz`, czyli taki, którego gałęzi uprawnień nie ma.
 *
 * Rolę tę pełnił moderator, dopóki jego gałąź nie istniała. Powstała razem
 * z kolejką moderacji, więc wartownik musiał się zmienić. Widz zbudowany
 * rzutowaniem nie wygasa: tak właśnie wygląda wariant dopisany do typu
 * przez kogoś, kto zapomniał o gałęzi w zapytaniu.
 */
const WIDZ_BEZ_GALEZI = {
  rodzaj: "ksiegowy",
  userId: "99999999-9999-4999-8999-999999999999",
} as unknown as Widz;

const MODERATOR: Widz = { rodzaj: "moderator", userId: "11111111-1111-4111-8111-111111111111" };

/** Firma widoczna w katalogu: instancja pozytywna dla testów negatywnych. */
async function firmaWKatalogu(): Promise<string> {
  const [wiersz] = await db
    .select({ slug: companies.slug })
    .from(companies)
    .where(
      and(
        eq(companies.status, "active"),
        exists(
          db
            .select({ jeden: sql`1` })
            .from(subscriptions)
            .where(
              and(
                eq(subscriptions.companyId, companies.id),
                eq(subscriptions.status, "active"),
                gt(subscriptions.expiresAt, sql`now()`),
              ),
            ),
        ),
      ),
    )
    .limit(1);

  if (!wiersz) throw new Error("Zasiew nie ma firmy w katalogu, a na niej stoi ten plik.");
  return wiersz.slug;
}

/** Firma w podanym stanie, czyli taka, której w mapie witryny być nie może. */
async function firmaWStanie(stan: "draft" | "suspended" | "visitcard"): Promise<string> {
  const [wiersz] = await db
    .select({ slug: companies.slug })
    .from(companies)
    .where(eq(companies.status, stan))
    .limit(1);

  if (!wiersz) throw new Error(`Zasiew nie ma firmy w stanie ${stan}.`);
  return wiersz.slug;
}

describe("w mapie witryny stoją tylko profile widoczne w katalogu", () => {
  it("firma z katalogu jest, szkic, zawieszona i wizytówka nie", async () => {
    const slugi = (await pobierzSlugiFirmDoSitemapy(ANONIM)).map((w) => w.slug);

    expect(slugi).toContain(await firmaWKatalogu());
    expect(slugi).not.toContain(await firmaWStanie("draft"));
    expect(slugi).not.toContain(await firmaWStanie("suspended"));
    expect(slugi).not.toContain(await firmaWStanie("visitcard"));
  });

  it("firma w stanie active bez trwającego abonamentu też nie wchodzi", async () => {
    /*
     * Osobny przypadek, bo warunek widoczności ma dwa człony i sam status
     * nie wystarcza. Zasiew ma firmy `active`, którym abonament wygasł.
     */
    const [bezAbonamentu] = await db
      .select({ slug: companies.slug })
      .from(companies)
      .where(
        and(
          eq(companies.status, "active"),
          sql`not exists (
            select 1 from ${subscriptions}
            where ${subscriptions.companyId} = ${companies.id}
              and ${subscriptions.status} = 'active'
              and ${subscriptions.expiresAt} > now())`,
        ),
      )
      .limit(1);

    expect(bezAbonamentu).toBeDefined();
    if (!bezAbonamentu) return;

    const slugi = (await pobierzSlugiFirmDoSitemapy(ANONIM)).map((w) => w.slug);
    expect(slugi).not.toContain(bezAbonamentu.slug);
  });

  it("zapytanie odmawia widzowi, którego gałąź uprawnień nie istnieje", async () => {
    await expect(pobierzSlugiFirmDoSitemapy(WIDZ_BEZ_GALEZI)).rejects.toBeInstanceOf(
      NiezaimplementowanaGalazUprawnien,
    );
  });

  it("moderator dostaje mapę witryny jak każdy inny widz", () => {
    // Mapa witryny jest publiczna: rola nie zmienia tego, co w niej stoi.
    return expect(pobierzSlugiFirmDoSitemapy(MODERATOR)).resolves.toBeInstanceOf(Array);
  });

  it("każdy profil pojawia się raz, nawet przy kilku kategoriach", async () => {
    const slugi = (await pobierzSlugiFirmDoSitemapy(ANONIM)).map((w) => w.slug);

    expect(slugi).toHaveLength(new Set(slugi).size);
  });
});

describe("treść mapy witryny", () => {
  it("zawiera rozdroże rejestracji i obie drogi", async () => {
    const adresy = (await sitemap()).map((w) => w.url);
    const sciezki = adresy.map((a) => new URL(a).pathname);

    expect(sciezki).toContain(TRASY.rejestracja);
    expect(sciezki).toContain(TRASY.rejestracjaKlienta);
    expect(sciezki).toContain(TRASY.rejestracjaFirmy);
  });

  it("nie zawiera stron wymagających sesji ani tokenu z maila", async () => {
    const sciezki = (await sitemap()).map((w) => new URL(w.url).pathname);

    // Te same ścieżki, których zabrania app/robots.ts. Dwa miejsca, jedna
    // decyzja: mapa witryny nie ma zapraszać tam, gdzie robots.txt zabrania.
    for (const zakazana of ["/moje", "/panel", "/wiadomosci", "/weryfikacja", "/nowe-haslo"]) {
      expect(sciezki.filter((s) => s.startsWith(zakazana))).toEqual([]);
    }
  });

  it("nie zawiera cennika, dopóki płatności są wyłączone", async () => {
    // Cennik oddaje 404 w trybie darmowym. Adres w mapie witryny prowadziłby
    // wyszukiwarki prosto na nieistniejącą stronę.
    const sciezki = (await sitemap()).map((w) => new URL(w.url).pathname);

    expect(sciezki).not.toContain(TRASY.cennik);
  });

  it("profile firm w mapie to te same, które zwraca zapytanie", async () => {
    const zZapytania = (await pobierzSlugiFirmDoSitemapy(ANONIM)).map((w) => `/f/${w.slug}`);
    const zMapy = (await sitemap())
      .map((w) => new URL(w.url).pathname)
      .filter((s) => s.startsWith("/f/"));

    expect(zMapy.sort()).toEqual(zZapytania.sort());
  });

  it("nie zawiera logowania", async () => {
    /*
     * Logowanie ma w metadanych `index: false` (lib/metadane.ts), bo ekran
     * bez treści dla niezalogowanego nie wnosi do indeksu nic. Adres w mapie
     * witryny przy znaczniku `noindex` na stronie to sprzeczność: Search
     * Console zgłasza ją jako błąd pokrycia, a nie jako podpowiedź.
     */
    const sciezki = (await sitemap()).map((w) => new URL(w.url).pathname);

    expect(sciezki).not.toContain(TRASY.logowanie);
  });

  it("każdy profil z mapy otwiera się, a nie oddaje 404", async () => {
    /*
     * TO JEST TEST NA BŁĄD, KTÓRY STAŁ NA PRODUKCJI.
     *
     * Oba profile zgłoszone w `sitemap.xml` zwracały 404. Warunek widoczności
     * w katalogu ma bowiem dwa źródła, nie jedno: jawne `where` z
     * `jestWKatalogu()` oraz **ciche złączenia wewnętrzne** w
     * `pobierzFirmeKatalogu`, które wymagają żywej kategorii. Mapa witryny
     * czytała tylko to pierwsze, więc obiecywała strony, których strona
     * profilu nie była gotowa pokazać.
     *
     * Dlatego ten test nie powtarza warunku zapisanego w zapytaniu, bo wtedy
     * powtórzyłby też pomyłkę. Pyta wprost: skoro adres jest w mapie witryny,
     * czy pod nim coś jest. Każdy kolejny cichy warunek dorzucony do strony
     * profilu wywali ten test i to jest poprawny wynik.
     */
    const slugi = (await pobierzSlugiFirmDoSitemapy(ANONIM)).map((w) => w.slug);
    expect(slugi.length).toBeGreaterThan(0);

    const puste: string[] = [];
    for (const slug of slugi) {
      if ((await pobierzFirmeKatalogu(ANONIM, slug)) === null) puste.push(slug);
    }

    expect(puste).toEqual([]);
  });

  it("każdy adres jest poprawnym adresem bezwzględnym", async () => {
    for (const wpis of await sitemap()) {
      expect(() => new URL(wpis.url)).not.toThrow();
      expect(wpis.url.startsWith("http")).toBe(true);
    }
  });
});

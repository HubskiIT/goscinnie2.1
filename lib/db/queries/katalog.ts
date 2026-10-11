/**
 * Katalog: firmy opublikowane przez kreator, czytane z bazy.
 *
 * Przykładowe ogłoszenia z `content/ogloszenia.ts` zostają obok, oznaczone
 * etykietą. Ten moduł dokłada do nich prawdziwe firmy.
 *
 * Kto jest w katalogu: firma w stanie `active` z abonamentem, który jeszcze
 * trwa. To ten sam warunek co w `maAktywnyAbonament` z lib/auth/firma.ts,
 * tylko zapisany jako warunek zapytania, żeby nie odpytywać bazy osobno
 * dla każdej firmy. W trybie darmowym (lib/serwis.ts) abonament nadaje
 * publikacja, więc warunek nie zmienia się po włączeniu płatności.
 *
 * Szkic nie trafia tu nigdy, także pod bezpośrednim adresem profilu.
 * `pobierzProfilFirmy` z firmy.ts pokazuje szkic każdemu, bo powstało pod
 * importowane wpisy z przyciskiem „Przejmij profil”. Szkic z kreatora to
 * co innego: niedokończona firma, której właściciel jeszcze nie pokazał.
 */
import { and, asc, eq, exists, gt, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema/abonament";
import { cities } from "@/lib/db/schema/geografia";
import { categories, companies, companyCategories, companyMembers } from "@/lib/db/schema/katalog";
import { upewnijSieZeGalazUprawnienIstnieje, type Widz } from "@/lib/permissions";

export type FirmaWKatalogu = {
  slug: string;
  nazwa: string;
  opis: string;
  /** W groszach. */
  cenaOd: number | null;
  pojemnoscMin: number | null;
  pojemnoscMax: number | null;
  /** Slug kategorii albo rodzaju lokalu. */
  kategoria: string;
  miejscowosc: {
    slug: string;
    nazwa: string;
    gmina: string | null;
    powiat: string;
    wojewodztwo: string;
  };
  szerokosc: number | null;
  dlugosc: number | null;
};

/** Warunek „firma jest w katalogu”, wspólny dla listy i pojedynczego profilu. */
function jestWKatalogu() {
  return and(
    eq(companies.status, "active"),
    exists(
      db
        .select({ jeden: sql`1` })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.companyId, companies.id),
            eq(subscriptions.status, "active"),
            // Czas liczy baza, nie Node. Tak samo jak w maAktywnyAbonament.
            gt(subscriptions.expiresAt, sql`now()`),
          ),
        ),
    ),
  );
}

const KOLUMNY = {
  slug: companies.slug,
  nazwa: companies.name,
  opis: companies.description,
  cenaOd: companies.priceFrom,
  pojemnoscMin: companies.capacityMin,
  pojemnoscMax: companies.capacityMax,
  kategoria: categories.slug,
  miastoSlug: cities.slug,
  miastoNazwa: cities.name,
  gmina: cities.gmina,
  powiat: cities.powiat,
  wojewodztwo: cities.wojewodztwo,
  szerokosc: sql<number | null>`ST_Y(${companies.point}::geometry)`,
  dlugosc: sql<number | null>`ST_X(${companies.point}::geometry)`,
};

type Wiersz = {
  slug: string;
  nazwa: string;
  opis: string;
  cenaOd: number | null;
  pojemnoscMin: number | null;
  pojemnoscMax: number | null;
  kategoria: string;
  miastoSlug: string;
  miastoNazwa: string;
  gmina: string | null;
  powiat: string;
  wojewodztwo: string;
  szerokosc: number | null;
  dlugosc: number | null;
};

function doFirmy(w: Wiersz): FirmaWKatalogu {
  return {
    slug: w.slug,
    nazwa: w.nazwa,
    opis: w.opis,
    cenaOd: w.cenaOd,
    pojemnoscMin: w.pojemnoscMin,
    pojemnoscMax: w.pojemnoscMax,
    kategoria: w.kategoria,
    miejscowosc: {
      slug: w.miastoSlug,
      nazwa: w.miastoNazwa,
      gmina: w.gmina,
      powiat: w.powiat,
      wojewodztwo: w.wojewodztwo,
    },
    // Sterownik oddaje liczby z funkcji PostGIS jako tekst.
    szerokosc: w.szerokosc === null ? null : Number(w.szerokosc),
    dlugosc: w.dlugosc === null ? null : Number(w.dlugosc),
  };
}

/**
 * Firmy z katalogu, których kategoria główna należy do podanej listy.
 *
 * Lista rozstrzyga, czy pytamy o lokale, czy o usługodawców: obie grupy
 * leżą w jednej tabeli `categories`.
 */
export async function pobierzFirmyKatalogu(
  widz: Widz,
  slugiKategorii: readonly string[],
): Promise<FirmaWKatalogu[]> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "pobierzFirmyKatalogu");

  if (slugiKategorii.length === 0) return [];

  const wiersze = await db
    .select(KOLUMNY)
    .from(companies)
    .innerJoin(cities, eq(cities.id, companies.cityId))
    .innerJoin(
      companyCategories,
      and(eq(companyCategories.companyId, companies.id), isNull(companyCategories.archivedAt)),
    )
    .innerJoin(categories, eq(categories.id, companyCategories.categoryId))
    .where(and(jestWKatalogu(), inArray(categories.slug, [...slugiKategorii])))
    .orderBy(asc(companies.name));

  // Firma z dwiema kategoriami z tej samej listy wychodzi z zapytania dwa razy.
  const widziane = new Set<string>();
  return wiersze.filter((w) => !widziane.has(w.slug) && widziane.add(w.slug)).map(doFirmy);
}

/** Jedna firma z katalogu po slugu. `null`, gdy jej tam nie ma. */
export async function pobierzFirmeKatalogu(
  widz: Widz,
  slug: string,
): Promise<FirmaWKatalogu | null> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "pobierzFirmeKatalogu");

  const [wiersz] = await db
    .select(KOLUMNY)
    .from(companies)
    .innerJoin(cities, eq(cities.id, companies.cityId))
    .innerJoin(
      companyCategories,
      and(eq(companyCategories.companyId, companies.id), isNull(companyCategories.archivedAt)),
    )
    .innerJoin(categories, eq(categories.id, companyCategories.categoryId))
    .where(and(jestWKatalogu(), eq(companies.slug, slug)))
    .limit(1);

  return wiersz ? doFirmy(wiersz) : null;
}

export type MojaFirma = {
  slug: string;
  nazwa: string;
  status: "draft" | "active" | "visitcard" | "suspended";
  /** Czy firma jest teraz widoczna w katalogu. */
  wKatalogu: boolean;
};

/**
 * Firmy, do których należy zalogowany człowiek. Dla panelu firmy.
 *
 * Anonim nie ma firm. Członkostwo sprawdzamy po `company_members`, tak samo
 * jak kreator, a nie po `owner_user_id`: współpracownik dodany do firmy też
 * ma ją widzieć w swoim panelu.
 */
export async function pobierzMojeFirmy(widz: Widz): Promise<MojaFirma[]> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "pobierzMojeFirmy");

  if (widz.rodzaj === "anonim") return [];

  const wiersze = await db
    .select({
      slug: companies.slug,
      nazwa: companies.name,
      status: companies.status,
      wKatalogu: sql<boolean>`${jestWKatalogu()}`,
    })
    .from(companies)
    .innerJoin(companyMembers, eq(companyMembers.companyId, companies.id))
    .where(eq(companyMembers.userId, widz.userId))
    .orderBy(asc(companies.createdAt));

  return wiersze;
}

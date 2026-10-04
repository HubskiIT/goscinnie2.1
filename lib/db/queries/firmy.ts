/**
 * Zapytania o profile firm. Cały SQL dotyczący `companies` mieszka tutaj.
 *
 * KONWENCJA MODUŁU: każda eksportowana funkcja przyjmuje widza jako pierwszy
 * argument i odmawia, zanim dotknie pozostałych. Pilnuje tego
 * tests/konwencja-zapytan.test.ts.
 *
 * Profil jest publiczny, więc nie ma tu ściany abonamentowej. Jest za to
 * rozróżnienie statusów, które decyduje o tym, czy strona w ogóle istnieje.
 */
import { and, asc, eq, gte, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { cities } from "@/lib/db/schema/geografia";
import {
  availability,
  categories,
  companies,
  companyCategories,
  companyClaims,
  companyMembers,
} from "@/lib/db/schema/katalog";
import {
  mozeEdytowacProfil,
  mozeZglosicPrzejecie,
  type PowodOdmowy,
  type StatusProfilu,
  upewnijSieZeGalazUprawnienIstnieje,
  type WidocznoscProfilu,
  type Widz,
  widocznoscProfilu,
} from "@/lib/permissions";

/** Ile najbliższych wolnych terminów pokazujemy w kalendarzu. */
export const WOLNYCH_TERMINOW = 12;

export type ProfilFirmy = {
  id: string;
  nazwa: string;
  slug: string;
  opis: string;
  /** W groszach. `null` znaczy „cena do uzupełnienia”, nie „za darmo”. */
  cenaOd: number | null;
  pojemnoscMin: number | null;
  pojemnoscMax: number | null;
  miasto: string;
  powiat: string;
  wojewodztwo: string;
  status: StatusProfilu;
  kategorie: string[];
  /** Puste, gdy widoczność nie obejmuje kalendarza. */
  wolneTerminy: string[];
  widocznosc: WidocznoscProfilu;
};

/**
 * Publiczny profil firmy spod `/f/<slug>`.
 *
 * `null` znaczy „nie ma takiej strony” i ma skończyć się prawdziwym 404.
 * Dotyczy to zarówno firmy nieistniejącej, jak i zawieszonej: jedno i drugie
 * jest dla świata tym samym. Strona zwracająca 200 z pustą treścią zostałaby
 * zaindeksowana i siedziała w wynikach wyszukiwania długo po zawieszeniu.
 */
export async function pobierzProfilFirmy(widz: Widz, slug: string): Promise<ProfilFirmy | null> {
  // Domyślna odmowa przed dotknięciem bazy.
  upewnijSieZeGalazUprawnienIstnieje(widz, "pobierzProfilFirmy");

  const [firma] = await db
    .select({
      id: companies.id,
      nazwa: companies.name,
      slug: companies.slug,
      opis: companies.description,
      cenaOd: companies.priceFrom,
      pojemnoscMin: companies.capacityMin,
      pojemnoscMax: companies.capacityMax,
      status: companies.status,
      miasto: cities.name,
      powiat: cities.powiat,
      wojewodztwo: cities.wojewodztwo,
    })
    .from(companies)
    .innerJoin(cities, eq(cities.id, companies.cityId))
    .where(eq(companies.slug, slug))
    .limit(1);

  if (!firma) return null;

  const czlonekTejFirmy =
    widz.rodzaj === "firma"
      ? widz.companyId === firma.id
      : widz.rodzaj === "klient"
        ? await czyNalezy(widz.userId, firma.id)
        : false;

  const widocznosc = widocznoscProfilu(widz, {
    status: firma.status,
    czlonekTejFirmy,
  });

  // Zawieszony profil kończy się tutaj i nie pobieramy dla niego niczego więcej.
  if (!widocznosc.widoczny) return null;

  const kategorieFirmy = await db
    .select({ nazwa: categories.name })
    .from(companyCategories)
    .innerJoin(categories, eq(categories.id, companyCategories.categoryId))
    // Kategorie zdjęte przez firmę zostają w bazie, ale nie na profilu.
    .where(and(eq(companyCategories.companyId, firma.id), isNull(companyCategories.archivedAt)))
    .orderBy(asc(categories.name));

  // Kalendarza nie pobieramy wcale, gdy widoczność go nie obejmuje. Pobranie
  // i ukrycie w komponencie byłoby tym, czego zabrania reguła „co kto widzi”.
  const wolneTerminy = widocznosc.kalendarz ? await wolneTerminyFirmy(firma.id) : [];

  return {
    ...firma,
    kategorie: kategorieFirmy.map((k) => k.nazwa),
    wolneTerminy,
    widocznosc,
  };
}

export type Odmowa = { ok: false; powod: PowodOdmowy };
export type Wynik<T> = { ok: true; dane: T } | Odmowa;

/**
 * Zgłoszenie, że profil należy do wnioskodawcy.
 *
 * Tworzy wyłącznie wniosek. Nie zakłada członkostwa, nie zmienia statusu firmy
 * i nie daje dostępu do niczego. Dostęp pojawia się dopiero po ręcznym
 * zatwierdzeniu przez `scripts/przejecia.ts`.
 *
 * Drugi wniosek od innej osoby do tej samej firmy **zapisuje się**: dwa
 * zgłoszenia to sygnał do sprawdzenia, nie błąd. Drugi wniosek od tej samej
 * osoby, gdy pierwszy jeszcze czeka, dostaje 409, bo nie wnosi nic nowego.
 */
export async function zglosPrzejecie(
  widz: Widz,
  slug: string,
  uzasadnienie: string,
): Promise<Wynik<{ id: string }>> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "zglosPrzejecie");

  const [firma] = await db
    .select({ id: companies.id, status: companies.status })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);

  // Firma nieistniejąca i zawieszona: ta sama odmowa, ten sam powód.
  if (!firma || firma.status === "suspended") return { ok: false, powod: "brak-dostepu" };

  const userId = widz.rodzaj === "anonim" ? null : widz.userId;
  const czlonek = userId ? await czyNalezy(userId, firma.id) : false;

  const rozstrzygniecie = mozeZglosicPrzejecie(widz, czlonek);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };
  if (!userId) throw new Error("zglosPrzejecie: zgoda dla widza bez identyfikatora.");

  const [oczekujacy] = await db
    .select({ id: companyClaims.id })
    .from(companyClaims)
    .where(
      and(
        eq(companyClaims.companyId, firma.id),
        eq(companyClaims.userId, userId),
        eq(companyClaims.status, "pending"),
      ),
    )
    .limit(1);

  if (oczekujacy) return { ok: false, powod: "oferta-juz-zlozona" };

  const [wniosek] = await db
    .insert(companyClaims)
    .values({ companyId: firma.id, userId, uzasadnienie })
    .returning({ id: companyClaims.id });

  if (!wniosek) throw new Error("zglosPrzejecie: zapis wniosku nie zwrócił wiersza.");
  return { ok: true, dane: wniosek };
}

export type DaneDoZapisu = {
  opis: string;
  cenaOd: number | null;
  pojemnoscMin: number | null;
  pojemnoscMax: number | null;
  /** Slugi kategorii. Zastępują dotychczasowy zestaw w całości. */
  kategorie: string[];
};

/**
 * Edycja profilu przez członka firmy.
 *
 * Kategorie to relacja wiele do wielu, więc podmiana zestawu dzieje się
 * **w jednej transakcji**: najpierw stare powiązania, potem nowe. Poza
 * transakcją firma na moment zniknęłaby z katalogu albo została w dwóch
 * kategoriach naraz, a jedno i drugie widać od razu w wyszukiwarce.
 */
export async function zaktualizujProfil(
  widz: Widz,
  slug: string,
  dane: DaneDoZapisu,
): Promise<Wynik<null>> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "zaktualizujProfil");

  const [firma] = await db
    .select({ id: companies.id, status: companies.status })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);

  if (!firma || firma.status === "suspended") return { ok: false, powod: "brak-dostepu" };

  const userId = widz.rodzaj === "anonim" ? null : widz.userId;
  const czlonek = userId ? await czyNalezy(userId, firma.id) : false;

  // Wniosek o przejęcie, nawet oczekujący, nie liczy się tutaj wcale.
  const rozstrzygniecie = mozeEdytowacProfil(widz, czlonek);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };

  await db.transaction(async (tx) => {
    await tx
      .update(companies)
      .set({
        description: dane.opis,
        priceFrom: dane.cenaOd,
        capacityMin: dane.pojemnoscMin,
        capacityMax: dane.pojemnoscMax,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, firma.id));

    const wybrane = dane.kategorie.length
      ? await tx
          .select({ id: categories.id })
          .from(categories)
          .where(inArray(categories.slug, dane.kategorie))
      : [];

    /*
     * Podmiana zestawu kategorii, bez usuwania wierszy.
     *
     * Zasada 5 zabrania twardego usuwania danych biznesowych, a przypisanie
     * do kategorii nią jest: decyduje o tym, gdzie firma pojawia się
     * w katalogu. Zdjęcie kategorii to ustawienie `archived_at`.
     *
     * Wszystko w jednej transakcji, bo inaczej firma na moment zniknęłaby
     * z katalogu albo została w dwóch kategoriach naraz, a jedno i drugie
     * widać od razu w wyszukiwarce.
     */
    const teraz = new Date();

    // 1. Archiwizujemy wszystko, co firma ma dzisiaj.
    await tx
      .update(companyCategories)
      .set({ archivedAt: teraz })
      .where(and(eq(companyCategories.companyId, firma.id), isNull(companyCategories.archivedAt)));

    // 2. Przywracamy albo dodajemy wybrane. `onConflictDoUpdate` obsługuje
    //    przypadek „ta kategoria już kiedyś była”: wtedy wiersz istnieje
    //    i wystarczy wyzerować datę archiwizacji.
    if (wybrane.length > 0) {
      await tx
        .insert(companyCategories)
        .values(wybrane.map((k) => ({ companyId: firma.id, categoryId: k.id })))
        .onConflictDoUpdate({
          target: [companyCategories.companyId, companyCategories.categoryId],
          set: { archivedAt: null },
        });
    }
  });

  return { ok: true, dane: null };
}

export type KategoriaDoWyboru = { slug: string; nazwa: string; wybrana: boolean };

/**
 * Dane do formularza edycji: profil plus pełna lista kategorii z zaznaczeniem,
 * które firma ma dzisiaj.
 *
 * Zwraca `null`, gdy widz nie ma prawa edytować. Endpoint i tak sprawdza to
 * ponownie przy zapisie: ukrycie formularza nie jest zabezpieczeniem, tylko
 * uprzejmością wobec kogoś, kto i tak nic nie zapisze.
 */
export async function pobierzProfilDoEdycji(
  widz: Widz,
  slug: string,
): Promise<Wynik<{ profil: ProfilFirmy; kategorie: KategoriaDoWyboru[] }>> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "pobierzProfilDoEdycji");

  const profil = await pobierzProfilFirmy(widz, slug);
  if (!profil) return { ok: false, powod: "brak-dostepu" };

  const userId = widz.rodzaj === "anonim" ? null : widz.userId;
  const czlonek = userId ? await czyNalezy(userId, profil.id) : false;

  const rozstrzygniecie = mozeEdytowacProfil(widz, czlonek);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };

  const wszystkie = await db
    .select({ slug: categories.slug, nazwa: categories.name })
    .from(categories)
    .orderBy(asc(categories.name));

  return {
    ok: true,
    dane: {
      profil,
      kategorie: wszystkie.map((k) => ({ ...k, wybrana: profil.kategorie.includes(k.nazwa) })),
    },
  };
}

/** Czy ten człowiek należy do tej firmy. Rozstrzyga o wezwaniu do przejęcia. */
async function czyNalezy(userId: string, companyId: string): Promise<boolean> {
  const [wiersz] = await db
    .select({ id: companyMembers.id })
    .from(companyMembers)
    .where(and(eq(companyMembers.userId, userId), eq(companyMembers.companyId, companyId)))
    .limit(1);

  return Boolean(wiersz);
}

/**
 * Najbliższe wolne terminy. Wyłącznie przyszłe: kalendarz pokazujący wolny
 * termin sprzed miesiąca wygląda na zepsuty, a nie na pusty.
 */
async function wolneTerminyFirmy(companyId: string): Promise<string[]> {
  const dzisiaj = new Date().toISOString().slice(0, 10);

  const wiersze = await db
    .select({ dzien: availability.date })
    .from(availability)
    .where(
      and(
        eq(availability.companyId, companyId),
        eq(availability.status, "free"),
        gte(availability.date, dzisiaj),
      ),
    )
    .orderBy(asc(availability.date))
    .limit(WOLNYCH_TERMINOW);

  return wiersze.map((w) => w.dzien);
}

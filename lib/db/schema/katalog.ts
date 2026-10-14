import { sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { cities } from "./geografia";
import { users } from "./tozsamosc";
import { geographyPoint, znacznikiCzasu } from "./typy";

export const companyStatus = pgEnum("company_status", [
  "draft",
  "active",
  // Po wygaśnięciu abonamentu profil schodzi do wizytówki. Nie znika.
  "visitcard",
  "suspended",
]);

/** Rodzaj usługodawcy. Osobna tabela, bo cena planu zależy od kategorii. */
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  ...znacznikiCzasu,
});

/**
 * Rodzaj okazji. Tabela, nie enum: decyzja 001 czyni z tego pierwszorzędny
 * wymiar produktu, a lista będzie rosła bez migracji schematu.
 */
export const eventTypes = pgTable("event_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  ...znacznikiCzasu,
});

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    cityId: uuid("city_id")
      .notNull()
      .references(() => cities.id),
    point: geographyPoint("point").notNull(),
    description: text("description").notNull().default(""),
    // W groszach. Karta bez ceny nie przechodzi moderacji — docs/tokeny.md, zasada 2.
    priceFrom: integer("price_from"),
    capacityMin: integer("capacity_min"),
    capacityMax: integer("capacity_max"),
    status: companyStatus("status").notNull().default("draft"),
    ...znacznikiCzasu,
  },
  (t) => [
    // Bez tego indeksu wyszukiwanie po promieniu zabije bazę.
    index("companies_point_idx").using("gist", t.point),
    index("companies_city_status_idx").on(t.cityId, t.status),
    index("companies_name_trgm_idx").using("gin", sql`${t.name} gin_trgm_ops`),
  ],
);

/**
 * Zdjęcia firmy: jedno główne i do dziewięciu w galerii.
 *
 * `path` to ścieżka w Supabase Storage, bez domeny. Domena bywa inna lokalnie
 * niż na produkcji, a wpisana do bazy zamarza na wartości z dnia wysyłki
 * i przy przeprowadzce rozsypuje wszystkie adresy naraz.
 *
 * `position` zero znaczy zdjęcie główne, czyli to z karty w katalogu.
 * Numeracja, nie flaga: flaga „główne” pozwala zaznaczyć dwa naraz albo żadne,
 * a wtedy karta nie wie, co pokazać.
 *
 * Zdjęcie usuwa się przez `archived_at`, nie przez skasowanie wiersza —
 * zasada 5. Plik zostaje wtedy w Storage i daje się przywrócić.
 */
export const companyPhotos = pgTable(
  "company_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    path: text("path").notNull(),
    position: integer("position").notNull(),
    // Wymiary po obróbce. Bez nich przeglądarka nie zna proporcji przed
    // pobraniem pliku i układ skacze w trakcie ładowania.
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...znacznikiCzasu,
  },
  (t) => [
    index("company_photos_company_position_idx").on(t.companyId, t.position),
    /*
     * Jedno zdjęcie na pozycji, licząc tylko nieusunięte.
     *
     * Warunek `archived_at is null` jest tu konieczny: bez niego usunięte
     * zdjęcie blokowałoby swoją pozycję na zawsze i firma nie mogłaby wstawić
     * nowego zdjęcia głównego po skasowaniu poprzedniego.
     */
    uniqueIndex("company_photos_company_position_uniq")
      .on(t.companyId, t.position)
      .where(sql`${t.archivedAt} is null`),
  ],
);

export const companyCategories = pgTable(
  "company_categories",
  {
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    /**
     * Zdjęcie kategorii z firmy to ustawienie tej daty, nie usunięcie wiersza.
     *
     * Zasada 5 zabrania twardego usuwania danych biznesowych, a przypisanie
     * do kategorii nią jest: decyduje o tym, gdzie firma pojawia się w katalogu.
     * Ponowne dodanie tej samej kategorii zeruje tę kolumnę zamiast wstawiać
     * drugi wiersz, bo klucz główny jest złożony z pary identyfikatorów.
     */
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.companyId, t.categoryId] }),
    // Kolejność kolumn ma znaczenie: ten indeks obsługuje listing kategorii.
    index("company_categories_category_company_idx").on(t.categoryId, t.companyId),
  ],
);

export const companyMemberRole = pgEnum("company_member_role", ["owner", "member"]);

/**
 * Kto pracuje w której firmie.
 *
 * Osobna tabela, a nie kolumna w `users`, bo jeden człowiek bywa w dwóch firmach:
 * prowadzi salę i dorabia jako fotograf. Przy kolumnie w `users` taki przypadek
 * wymagałby drugiego konta, czyli drugiego hasła i drugiej skrzynki na ten sam
 * adres. `companies.owner_user_id` zostaje jako właściciel rozliczeniowy,
 * ale o dostępie rozstrzyga ta tabela.
 */
export const companyMembers = pgTable(
  "company_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: companyMemberRole("role").notNull().default("member"),
    ...znacznikiCzasu,
  },
  (t) => [
    // Jeden człowiek, jedno członkostwo w danej firmie.
    uniqueIndex("company_members_company_user_idx").on(t.companyId, t.userId),
    // Pod pytanie „do jakich firm należy ten użytkownik”, zadawane przy
    // każdym żądaniu z sesją firmową.
    index("company_members_user_idx").on(t.userId),
  ],
);

/**
 * NIP i telefon firmy, czyli dane do weryfikacji i do faktury.
 *
 * Dlaczego osobna tabela, a nie kolumny w `companies`: profil jest publiczny
 * i czytany w całości przy każdym wejściu na `/f/<slug>`, a te dwa pola nie
 * mają prawa tam trafić. Osobna tabela sprawia, że zapytanie o profil fizycznie
 * ich nie widzi, zamiast polegać na tym, że ktoś pamiętał wyciąć je z selecta.
 *
 * Jedna firma, jeden wiersz: powtórne zgłoszenie NIP-u nadpisuje poprzedni
 * przez `onConflictDoUpdate`, a nie dokłada drugiego wiersza.
 */
export const companyVerification = pgTable(
  "company_verification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .unique()
      .references(() => companies.id),
    /** Dziesięć cyfr, bez kresek i spacji. Normalizuje to walidator Zod. */
    nip: text("nip").notNull(),
    /** Dziewięć cyfr, bez prefiksu +48. Normalizuje to walidator Zod. */
    telefon: text("telefon").notNull(),
    /**
     * Wypełniane ręcznie przez moderację po sprawdzeniu w rejestrze.
     * `null` znaczy „zgłoszone, jeszcze niesprawdzone”, nie „odrzucone”.
     */
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    ...znacznikiCzasu,
  },
  (t) => [
    /*
     * Pod pytanie „czy ten NIP zgłosił już ktoś inny”, zadawane przy moderacji.
     *
     * Celowo nie jest unikalny: ten sam przedsiębiorca prowadzi salę i catering
     * na jednym NIP-ie i oba wpisy mają prawo istnieć. Powtórzony NIP to sygnał
     * do sprawdzenia przez człowieka, nie błąd zapisu.
     */
    index("company_verification_nip_idx").on(t.nip),
  ],
);

export const claimStatus = pgEnum("claim_status", ["pending", "approved", "rejected"]);

/**
 * Wnioski o przejęcie profilu firmy.
 *
 * Każdy może kliknąć „to moja firma”, łącznie z konkurencją zza rogu, więc
 * zgłoszenie **nie daje żadnego dostępu**. Tworzy wyłącznie wniosek, a dostęp
 * pojawia się dopiero po ręcznym zatwierdzeniu, które zakłada członkostwo.
 * Tak ma zostać do czasu weryfikacji po numerze NIP.
 *
 * Brak indeksu unikalnego na (company_id, user_id) jest zamierzony. Dwa
 * zgłoszenia do tej samej firmy od różnych osób mają się zapisać, bo to sygnał
 * do sprawdzenia, a nie błąd. Odrzucony wnioskodawca też ma móc spróbować
 * ponownie, gdy dośle dowody.
 */
export const companyClaims = pgTable(
  "company_claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    status: claimStatus("status").notNull().default("pending"),
    /** Czym wnioskodawca uzasadnia, że to jego firma. Czyta to człowiek. */
    uzasadnienie: text("uzasadnienie").notNull().default(""),
    rozpatrzonoO: timestamp("rozpatrzono_o", { withTimezone: true }),
    ...znacznikiCzasu,
  },
  (t) => [
    // Pod listę wniosków do rozpatrzenia i pod pytanie „czy ten człowiek
    // ma już wniosek do tej firmy”.
    index("company_claims_company_status_idx").on(t.companyId, t.status),
    index("company_claims_user_idx").on(t.userId),
  ],
);

export const availabilityStatus = pgEnum("availability_status", ["free", "held", "booked"]);

export const availability = pgTable(
  "availability",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    // `date`, nie `timestamptz`: dostępność to dzień kalendarzowy.
    date: date("date").notNull(),
    status: availabilityStatus("status").notNull().default("free"),
    ...znacznikiCzasu,
  },
  (t) => [
    // Unikalny: jedna firma, jeden wpis na dany dzień.
    uniqueIndex("availability_company_date_idx").on(t.companyId, t.date),
  ],
);

export type Company = typeof companies.$inferSelect;
export type CompanyMember = typeof companyMembers.$inferSelect;
export type CompanyClaim = typeof companyClaims.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type EventType = typeof eventTypes.$inferSelect;
export type CompanyVerification = typeof companyVerification.$inferSelect;

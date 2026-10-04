import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { cities } from "./geografia";
import { companies, eventTypes } from "./katalog";
import { users } from "./tozsamosc";
import { geographyPoint, znacznikiCzasu } from "./typy";

export const requestStatus = pgEnum("request_status", ["open", "closed", "expired", "archived"]);
/**
 * Statusy oferty.
 *
 *   sent         złożona, czeka na decyzję klienta
 *   shortlisted  dodana przez klienta do krótkiej listy, odsłania mu kontakt
 *   withdrawn    wycofana przez firmę; wiersz zostaje, a firma może złożyć nową
 *   rejected     odrzucona przez klienta
 *
 * `rejected` nie jest dziś przez nic ustawiane. Aktywuje je akceptacja oferty
 * przez klienta: przyjęcie jednej odrzuca pozostałe. Wchodzi razem z opiniami,
 * bo akceptacja uruchamia licznik do prośby o opinię. Do tego czasu wartość
 * istnieje w typie i jest uwzględniana w liczeniu limitu planu, ale nic jej
 * nie nadaje. Nie usuwamy jej: usunięcie wartości z typu wyliczeniowego
 * w Postgresie kosztuje nieproporcjonalnie dużo wobec zysku.
 */
export const bidStatus = pgEnum("bid_status", ["sent", "shortlisted", "rejected", "withdrawn"]);

/**
 * Zlecenie klienta. Każda kolumna tutaj ma wiersz w tabeli widoczności
 * w docs/uprawnienia.md. Nie dodawaj tu kolumny z liczbą ofert — wyciekłaby
 * pierwszym `select *`, a firma nie ma prawa jej widzieć.
 */
export const requests = pgTable(
  "requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id),
    eventTypeId: uuid("event_type_id")
      .notNull()
      .references(() => eventTypes.id),
    // Data kalendarzowa bez godziny.
    eventDate: date("event_date").notNull(),
    guests: integer("guests").notNull(),
    cityId: uuid("city_id")
      .notNull()
      .references(() => cities.id),
    point: geographyPoint("point").notNull(),
    description: text("description").notNull(),
    // W groszach. Widoczne wyłącznie dla abonenta i autora.
    budgetMin: integer("budget_min"),
    budgetMax: integer("budget_max"),
    status: requestStatus("status").notNull().default("open"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...znacznikiCzasu,
  },
  (t) => [
    index("requests_point_idx").using("gist", t.point),
    index("requests_status_event_date_idx").on(t.status, t.eventDate),
  ],
);

export const bids = pgTable(
  "bids",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => requests.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    price: integer("price").notNull(),
    message: text("message").notNull(),
    status: bidStatus("status").notNull().default("sent"),
    ...znacznikiCzasu,
  },
  (t) => [
    // Jedna firma, jedna oferta. To ograniczenie w bazie jest źródłem kodu 409:
    // sprawdzenie w samym kodzie aplikacji przepuści dwa równoległe żądania.
    unique("bids_request_company_uniq").on(t.requestId, t.companyId),
    // Pod liczenie ofert firmy w bieżącym okresie abonamentowym. Licznik
    // wyliczamy z wierszy przy każdym żądaniu, więc to zapytanie musi być tanie.
    index("bids_company_created_idx").on(t.companyId, t.createdAt),
  ],
);

/**
 * Krótka lista klienta. Dopiero istnienie tego wiersza odsłania firmie dane
 * kontaktowe klienta. Osobna tabela, a nie flaga na `bids`, bo flagę łatwo
 * ustawić niechcący w akcji po stronie firmy — a to ma być działanie klienta.
 */
export const shortlist = pgTable(
  "shortlist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => requests.id),
    bidId: uuid("bid_id")
      .notNull()
      .references(() => bids.id),
    ...znacznikiCzasu,
  },
  (t) => [unique("shortlist_request_bid_uniq").on(t.requestId, t.bidId)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => requests.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    fromCompany: boolean("from_company").notNull(),
    body: text("body").notNull(),
    // Treść z zamaskowanymi telefonami, e-mailami i linkami. Przed shortlist
    // firma dostaje tę wersję. Maskujemy, nie blokujemy: wiadomość dochodzi.
    bodyMasked: text("body_masked").notNull(),
    ...znacznikiCzasu,
  },
  (t) => [index("messages_request_company_idx").on(t.requestId, t.companyId)],
);

export type Request = typeof requests.$inferSelect;
export type Bid = typeof bids.$inferSelect;

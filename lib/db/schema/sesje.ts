/**
 * Tabele better-auth. Nazwy i kolumny narzuca biblioteka, my dajemy im tylko
 * mnogą formę zgodną z resztą schematu.
 *
 * Tożsamość człowieka żyje dalej w `users`. Nie zakładamy drugiej tabeli
 * użytkowników obok istniejącej, bo dwie tożsamości tego samego człowieka
 * rozjeżdżają się prędzej czy później. better-auth dostaje `users` przez
 * mapowanie w lib/auth/index.ts, a tu dokładamy tylko kolumny, których wymaga.
 */
import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./tozsamosc";
import { znacznikiCzasu } from "./typy";

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...znacznikiCzasu,
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

/**
 * Poświadczenia logowania. Dla logowania mailem i hasłem `password` trzyma
 * skrót argon2id, nigdy hasło. Kolumna nazywa się tak, bo tak ją nazywa
 * better-auth, i tego nie zmieniamy.
 */
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    password: text("password"),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    ...znacznikiCzasu,
  },
  (t) => [index("accounts_user_id_idx").on(t.userId)],
);

/** Tokeny jednorazowe: potwierdzenie maila, reset hasła. */
export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...znacznikiCzasu,
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

/**
 * Licznik prób w oknie czasowym. Obsługuje oba limity: po adresie IP
 * i po koncie. Klucz mówi, czego dotyczy wpis, na przykład
 * `logowanie:ip:203.0.113.7` albo `logowanie:konto:ktos@przyklad.pl`.
 *
 * Wierszy nie kasujemy. Wygasłe okno poznajemy po `window_start`, a nie po tym,
 * że wiersz zniknął. Zgodnie z zasadą 5 nic tu nie znika.
 */
export const rateLimits = pgTable(
  "rate_limits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull().unique(),
    count: integer("count").notNull().default(0),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
    ...znacznikiCzasu,
  },
  (t) => [index("rate_limits_window_start_idx").on(t.windowStart)],
);

export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;

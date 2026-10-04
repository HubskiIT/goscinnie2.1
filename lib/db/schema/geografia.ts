import { sql } from "drizzle-orm";
import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { geographyPoint, znacznikiCzasu } from "./typy";

/**
 * Słownik miejscowości. `powiat` jest kolumną, bo to on realizuje regułę
 * „co kto widzi”: anonim i firma bez abonamentu poznają lokalizację zlecenia
 * wyłącznie z dokładnością do powiatu.
 */
export const cities = pgTable(
  "cities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    powiat: text("powiat").notNull(),
    wojewodztwo: text("wojewodztwo").notNull(),
    point: geographyPoint("point").notNull(),
    ...znacznikiCzasu,
  },
  (t) => [
    index("cities_point_idx").using("gist", t.point),
    // Podpowiedzi w wyszukiwarce: literówka w „Żyrardów” ma nadal trafiać.
    index("cities_name_trgm_idx").using("gin", sql`${t.name} gin_trgm_ops`),
  ],
);

export type City = typeof cities.$inferSelect;

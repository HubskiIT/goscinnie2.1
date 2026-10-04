import { boolean, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { znacznikiCzasu } from "./typy";

export const userRole = pgEnum("user_role", ["client", "company_owner", "moderator"]);
export const userStatus = pgEnum("user_status", ["active", "suspended", "anonymized"]);

/**
 * Konto człowieka. Hasła i sesje trzyma better-auth we własnych tabelach —
 * nie piszemy własnego haszowania ani obsługi sesji.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  // Wymagane przez better-auth. Potwierdzenie maila wchodzi później,
  // na razie kolumna istnieje i domyślnie jest fałszem.
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRole("role").notNull().default("client"),
  status: userStatus("status").notNull().default("active"),
  // Ustawione = konto wyczyszczone z danych osobowych. Wiersz zostaje,
  // bo kaskada zabrałaby opinie i oferty powiązane z innymi ludźmi.
  anonymizedAt: timestamp("anonymized_at", { withTimezone: true }),
  ...znacznikiCzasu,
});

export type User = typeof users.$inferSelect;
export type NowyUser = typeof users.$inferInsert;

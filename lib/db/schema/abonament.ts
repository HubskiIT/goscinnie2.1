import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { categories, companies } from "./katalog";
import { znacznikiCzasu } from "./typy";

export const planCode = pgEnum("plan_code", ["start", "pro"]);
export const subscriptionStatus = pgEnum("subscription_status", ["active", "expired", "cancelled"]);

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  code: planCode("code").notNull(),
  // W groszach, rocznie.
  priceAnnual: integer("price_annual").notNull(),
  // null = bez limitu (plan pro). Wyczerpanie limitu w planie start daje 429.
  bidsLimit: integer("bids_limit"),
  ...znacznikiCzasu,
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id),
  status: subscriptionStatus("status").notNull().default("active"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...znacznikiCzasu,
});

/**
 * Idempotencja webhooków płatności. Operator wyśle to samo zdarzenie kilka razy.
 * Ograniczenie unikalności na `provider_event_id` jest tym, co sprawia,
 * że trzy dostarczenia nie dadzą trzech lat abonamentu.
 */
export const paymentEvents = pgTable("payment_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerEventId: text("provider_event_id").notNull().unique(),
  payload: jsonb("payload").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  ...znacznikiCzasu,
});

export type Plan = typeof plans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;

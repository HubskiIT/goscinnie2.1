import { date, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { companies } from "./katalog";
import { users } from "./tozsamosc";
import { znacznikiCzasu } from "./typy";

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    senderUserId: uuid("sender_user_id")
      .notNull()
      .references(() => users.id),
    senderName: text("sender_name").notNull(),
    senderEmail: text("sender_email").notNull(),
    senderPhone: text("sender_phone"),
    eventDate: date("event_date"),
    guests: integer("guests"),
    message: text("message").notNull(),
    replyText: text("reply_text"),
    repliedAt: timestamp("replied_at", { withTimezone: true }),
    ...znacznikiCzasu,
  },
  (t) => [
    index("inquiries_company_id_idx").on(t.companyId, t.createdAt),
    index("inquiries_sender_user_id_idx").on(t.senderUserId, t.createdAt),
  ],
);

export type Inquiry = typeof inquiries.$inferSelect;

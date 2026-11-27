CREATE TABLE IF NOT EXISTS "inquiries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL REFERENCES "companies"("id"),
  "sender_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "sender_name" text NOT NULL,
  "sender_email" text NOT NULL,
  "sender_phone" text,
  "event_date" date,
  "guests" integer,
  "message" text NOT NULL,
  "reply_text" text,
  "replied_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "inquiries_company_id_idx" ON "inquiries" ("company_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "inquiries_sender_user_id_idx" ON "inquiries" ("sender_user_id", "created_at" DESC);

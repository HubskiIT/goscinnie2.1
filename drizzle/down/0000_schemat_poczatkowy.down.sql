-- Cofnięcie migracji 0000.
--
-- To jedyne miejsce w projekcie, w którym `DROP` jest dozwolony: cofnięcie
-- migracji z definicji usuwa to, co ta migracja utworzyła. Zakaz twardego
-- usuwania dotyczy danych biznesowych w kodzie aplikacji, nie cofnięć schematu.
--
-- Uwaga: cofnięcie odtwarza strukturę, nie dane. Po wykonaniu tego pliku
-- zawartość tabel nie wraca.
--
-- Kolejność odwrotna do tworzenia, żeby klucze obce nie blokowały.

DROP TABLE IF EXISTS "messages";--> statement-breakpoint
DROP TABLE IF EXISTS "shortlist";--> statement-breakpoint
DROP TABLE IF EXISTS "bids";--> statement-breakpoint
DROP TABLE IF EXISTS "requests";--> statement-breakpoint
DROP TABLE IF EXISTS "payment_events";--> statement-breakpoint
DROP TABLE IF EXISTS "subscriptions";--> statement-breakpoint
DROP TABLE IF EXISTS "plans";--> statement-breakpoint
DROP TABLE IF EXISTS "availability";--> statement-breakpoint
DROP TABLE IF EXISTS "company_categories";--> statement-breakpoint
DROP TABLE IF EXISTS "companies";--> statement-breakpoint
DROP TABLE IF EXISTS "event_types";--> statement-breakpoint
DROP TABLE IF EXISTS "categories";--> statement-breakpoint
DROP TABLE IF EXISTS "cities";--> statement-breakpoint
DROP TABLE IF EXISTS "users";--> statement-breakpoint

DROP TYPE IF EXISTS "public"."bid_status";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."request_status";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."availability_status";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."company_status";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."subscription_status";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."plan_code";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."user_status";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."user_role";

-- Rozszerzeń postgis i pg_trgm celowo nie usuwamy. Mogą być używane przez
-- inne obiekty w bazie, a ich odtworzenie jest idempotentne, więc ponowne
-- wykonanie migracji w przód zadziała bez nich w tym pliku.

-- Cofnięcie migracji 0001 (sesje).
--
-- DROP jest tu dozwolony na tej samej zasadzie co w 0000: cofnięcie usuwa
-- to, co ta migracja utworzyła. Zakaz twardego usuwania dotyczy danych
-- biznesowych w kodzie aplikacji, nie cofnięć schematu.
--
-- Uwaga: to cofnięcie odtwarza strukturę, nie dane. Po jego wykonaniu znikają
-- wszystkie sesje i skróty haseł, czyli wszyscy zostają wylogowani i muszą
-- przejść przez reset hasła. Kolumny email_verified nie da się odtworzyć
-- z niczego, więc po ponownej migracji w przód wszyscy mają ją na false.

DROP TABLE IF EXISTS "verifications";--> statement-breakpoint
DROP TABLE IF EXISTS "rate_limits";--> statement-breakpoint
DROP TABLE IF EXISTS "accounts";--> statement-breakpoint
DROP TABLE IF EXISTS "sessions";--> statement-breakpoint

ALTER TABLE "users" DROP COLUMN IF EXISTS "image";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified";

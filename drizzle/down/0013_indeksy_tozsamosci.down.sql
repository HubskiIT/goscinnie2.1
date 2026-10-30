-- Cofnięcie migracji 0013 (indeksy pod ustalanie widza i własne zlecenia).
--
-- Usunięcie indeksu nie dotyka danych: wiersze w subscriptions i requests
-- zostają nietknięte, zmienia się wyłącznie sposób, w jaki baza je znajduje.
-- Po cofnięciu ustalenie widza i lista własnych zleceń wracają do przeglądu
-- całej tabeli, czyli do stanu sprzed tej migracji.

DROP INDEX IF EXISTS "subscriptions_company_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "requests_author_user_id_idx";

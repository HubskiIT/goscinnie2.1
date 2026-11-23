-- Cofnięcie migracji 0016 (rodzaj firmy i szczegóły wpisu).
--
-- CO SIĘ TRACI. Wszystkie odpowiedzi na pytania szczegółowe: pojemność przy
-- stołach, parking, nocleg, zasady alkoholu, zasięg dojazdu, zaliczki, listy
-- „co w cenie”. Firmy, kategorie, zdjęcia i rozliczenia zostają nietknięte,
-- bo ta migracja ich nie dotyka.
--
-- Rodzaj firmy da się po cofnięciu odtworzyć z kategorii, tak samo jak
-- przy wejściu w przód, więc jego utrata jest odwracalna. Odpowiedzi
-- szczegółowych nie da się odtworzyć z niczego i to jest znany koszt tego
-- cofnięcia, nie przeoczenie.
--
-- Kolejność ma znaczenie: tabele przed typami, bo typ używany przez kolumnę
-- nie daje się usunąć.

DROP TABLE IF EXISTS "service_included_items";--> statement-breakpoint
DROP TABLE IF EXISTS "service_details";--> statement-breakpoint
DROP TABLE IF EXISTS "venue_details";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN IF EXISTS "kind";--> statement-breakpoint

DROP TYPE IF EXISTS "service_deposit_kind";--> statement-breakpoint
DROP TYPE IF EXISTS "service_travel_cost";--> statement-breakpoint
DROP TYPE IF EXISTS "venue_kids";--> statement-breakpoint
DROP TYPE IF EXISTS "venue_outdoor";--> statement-breakpoint
DROP TYPE IF EXISTS "venue_lodging";--> statement-breakpoint
DROP TYPE IF EXISTS "venue_parking";--> statement-breakpoint
DROP TYPE IF EXISTS "venue_alcohol";--> statement-breakpoint
DROP TYPE IF EXISTS "venue_kitchen";--> statement-breakpoint
DROP TYPE IF EXISTS "company_kind";

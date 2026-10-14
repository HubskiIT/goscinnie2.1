-- Cofnięcie migracji 0011 (zdjęcia firm).
--
-- UWAGA: to cofnięcie USUWA WIERSZE. Tabela znika razem ze wszystkimi
-- przypisaniami zdjęć do firm. Same pliki zostają w Supabase Storage, więc
-- nie przepadają, ale wiedza o tym, które zdjęcie należy do której firmy
-- i w jakiej kolejności, przepada bezpowrotnie.
--
-- Zasada 5 zabrania twardego usuwania danych biznesowych w kodzie aplikacji.
-- Cofnięcie migracji jest czym innym: to świadoma decyzja człowieka, który
-- wie, co traci. Uruchamiane wyłącznie ręcznie, nigdy automatycznie.

DROP TABLE IF EXISTS "company_photos";

-- Cofnięcie migracji 0012 (klucz wysyłki zdjęcia).
--
-- Co się traci: wiedzę o tym, która próba wysyłki utworzyła które zdjęcie.
-- Same zdjęcia zostają, bo kolumna nie jest tożsamością wiersza, tylko
-- zabezpieczeniem przed dwukrotnym zapisem tej samej próby. Po cofnięciu
-- ponowienie żądania znów mogłoby utworzyć drugi wiersz.
--
-- Kolejność odwrotna niż w migracji w przód: najpierw indeks, potem kolumna,
-- na której stoi. `DROP COLUMN` i tak usunąłby indeks razem z kolumną, ale
-- jawne usunięcie mówi wprost, co znika.

DROP INDEX IF EXISTS "company_photos_company_upload_key_uniq";--> statement-breakpoint
ALTER TABLE "company_photos" DROP COLUMN IF EXISTS "upload_key";

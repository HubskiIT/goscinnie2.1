-- Klucz jednej próby wysyłki zdjęcia.
--
-- Po co: `path` zawiera losowy człon dokładany przy każdej próbie, więc dwa
-- wysłania tego samego pliku dawały dwa różne `path` i dwa wiersze. Tak
-- zdjęcia dublowały się po odmowie, o której interfejs nie zdążył powiedzieć:
-- zapis przechodził, człowiek tego nie widział i wybierał plik ponownie.
--
-- Kolumna dopuszcza `null`, bo zdjęcia sprzed tej migracji klucza nie mają.
-- W indeksie unikalnym Postgres traktuje każdy `null` jako osobną wartość,
-- więc stare wiersze niczego sobie nie blokują i migracja nie potrzebuje
-- uzupełniania danych.
--
-- Warunek `archived_at is null` w indeksie, tak samo jak przy pozycji:
-- usunięte zdjęcie nie ma prawa blokować klucza na zawsze.

ALTER TABLE "company_photos" ADD COLUMN "upload_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "company_photos_company_upload_key_uniq" ON "company_photos" USING btree ("company_id","upload_key") WHERE "archived_at" is null;

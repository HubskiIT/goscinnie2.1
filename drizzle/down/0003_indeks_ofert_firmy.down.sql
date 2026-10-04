-- Cofnięcie migracji 0003 (indeks pod liczenie ofert w okresie).
--
-- Usunięcie indeksu nie dotyka danych: wiersze w bids zostają nietknięte,
-- zmienia się wyłącznie sposób, w jaki baza je znajduje. To najłagodniejsze
-- z dotychczasowych cofnięć.

DROP INDEX IF EXISTS "bids_company_created_idx";

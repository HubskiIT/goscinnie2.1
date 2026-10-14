-- Cofnięcie migracji 0010 (jeden plan danego kodu na kategorię).
--
-- Usunięcie indeksu nie dotyka danych: wiersze w plans zostają nietknięte,
-- znika wyłącznie zakaz ich duplikowania. Po cofnięciu `wypelnijPlany`
-- ze scripts/slowniki.ts przestaje być idempotentne, bo opiera swoją
-- idempotencję właśnie na tym ograniczeniu.

DROP INDEX IF EXISTS "plans_category_code_uniq";

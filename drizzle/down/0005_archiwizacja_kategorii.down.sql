-- Cofnięcie migracji 0005 (archiwizacja przypisań do kategorii).
--
-- Usunięcie kolumny kasuje informację o tym, które przypisania były zdjęte.
-- Po ponownej migracji w przód wszystkie wiersze wyglądają na aktywne, więc
-- firma wróci do kategorii, z których została wcześniej zdjęta.
--
-- To jest cena za cofnięcie tej migracji i trzeba ją znać przed wykonaniem.
-- Struktura wraca, znaczenie nie.

ALTER TABLE "company_categories" DROP COLUMN IF EXISTS "archived_at";

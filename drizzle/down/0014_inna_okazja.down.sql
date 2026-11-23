-- Cofnięcie migracji 0014 (okazja wpisana własnymi słowami).
--
-- CO SIĘ TRACI. Nazwy okazji wpisane przez klientów. Zlecenia, które je
-- miały, zostają w bazie i dalej wskazują wiersz `inna`, więc po cofnięciu
-- pokazują się jako „Inna okazja” bez uszczegółowienia. Wiersze nie znikają
-- i żadne zlecenie nie przestaje istnieć, ale ta jedna informacja przepada
-- bezpowrotnie. To jest znany koszt tego cofnięcia, nie przeoczenie:
-- usunięcie kolumny nie ma jak zachować jej zawartości.
--
-- CZEGO NIE USUWAMY. Wiersza `inna` w `event_types`. Wskazują na niego
-- zlecenia przez klucz obcy, więc jego usunięcie albo wywaliłoby się na
-- ograniczeniu, albo wymagało ruszenia tych zleceń. Zostawiony jest
-- nieszkodliwy: to pozycja słownika, której formularz po cofnięciu nie
-- pokazuje, bo listę okazji buduje z content/okazje.ts, a nie z bazy.
-- Ponowne wejście migracji w przód wstawia go z `on conflict do nothing`,
-- więc sekwencja w przód, w tył i znowu w przód przechodzi.

ALTER TABLE "requests" DROP CONSTRAINT IF EXISTS "requests_custom_event_name_sensowna";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN IF EXISTS "custom_event_name";

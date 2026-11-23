-- Cofnięcie migracji 0015 (kolejka moderacji).
--
-- CO SIĘ TRACI. Dziennik decyzji moderacyjnych: kto, co i dlaczego przyjął
-- albo odrzucił. Nie ginie przy tym żaden wpis z katalogu ani z giełdy:
-- firmy, zlecenia i imprezy leżą w swoich tabelach i ta migracja ich nie
-- dotyka. Znika wyłącznie wiedza o tym, że ktoś je przejrzał.
--
-- CO SIĘ DZIEJE Z WIDOCZNOŚCIĄ. Nic. Kod, który pyta tę tabelę o zgodę,
-- jest cofany razem z nią, więc po cofnięciu katalog wraca do zachowania
-- sprzed migracji: pokazuje wszystko, co ma status `active`.

DROP TABLE IF EXISTS "moderation_submissions";--> statement-breakpoint
DROP TYPE IF EXISTS "moderation_status";--> statement-breakpoint
DROP TYPE IF EXISTS "moderation_subject";

-- Cofnięcie migracji 0017 (imprezy).
--
-- CO SIĘ TRACI. Wszystkie zapowiedziane imprezy razem z opisami i cenami
-- biletów. Firmy, które je organizowały, zostają nietknięte: ta migracja
-- nie dotyka tabeli companies.
--
-- Zgłoszenia moderacyjne dotyczące imprez zostają w moderation_submissions
-- i wskazują wtedy w pustkę. Jest to nieszkodliwe i celowe: tabela ta nie
-- ma klucza obcego do przedmiotu zgłoszenia, bo wskazuje na cztery różne
-- tabele, a kasowanie dziennika decyzji przy cofaniu migracji innej tabeli
-- byłoby gorsze niż osierocony wiersz, którego panel i tak nie pokaże,
-- skoro nie znajdzie imprezy.

DROP TABLE IF EXISTS "events";

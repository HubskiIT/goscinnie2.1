-- Cofnięcie migracji 0018 (zgody dla zastanych zleceń).
--
-- NIC NIE ROBI I TO JEST POPRAWNE COFNIĘCIE.
--
-- Migracja w przód tylko dopisała wiersze do dziennika moderacji. Ich
-- usunięcie przy cofaniu wymagałoby odróżnienia zgód wstawionych przez tę
-- migrację od zgód wydanych później przez człowieka, a jedno od drugiego
-- różni się wyłącznie datą, której nie wolno tak interpretować: moderator
-- mógł zatwierdzić zlecenie w tej samej minucie.
--
-- Skasowanie wszystkich zgód dla zleceń byłoby natomiast skasowaniem
-- cudzych decyzji, czyli dokładnie tym, przed czym broni zasada 5.
-- Zostawione wiersze są nieszkodliwe: po cofnięciu kod nie pyta
-- o zgodę dla zleceń, więc nikt na nie nie patrzy.
--
-- Plik istnieje, bo runner odmawia cofnięcia migracji bez pliku cofnięcia,
-- a cofnięcie, które świadomie nic nie robi, to nie to samo co jego brak.

SELECT 1;

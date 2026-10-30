-- Indeksy pod ustalanie widza i listę własnych zleceń.
--
-- `subscriptions` nie miała dotąd **żadnego** indeksu poza kluczem głównym,
-- a to po niej jedzie najgorętsze zapytanie w systemie: `maAktywnyAbonament`
-- z lib/auth/firma.ts pyta o abonament przy każdym ustaleniu widza, raz na
-- każde członkostwo, a `jestWKatalogu()` z lib/db/queries/katalog.ts raz na
-- każdy wiersz firmy w wynikach katalogu. Bez indeksu każde z tych pytań to
-- przegląd całej tabeli. Dziś tabela ma kilkanaście wierszy i nikt tego nie
-- czuje; przy tysiącu abonentów katalog zaczyna płacić tysiąc przeglądów
-- na jedną stronę wyników.
--
-- Filtr jest po trzech kolumnach (company_id, status, expires_at), a indeks
-- stoi na jednej. Wystarcza, bo `company_id` sam rozstrzyga prawie wszystko:
-- jedna firma ma garść abonamentów przez całe życie konta, więc status i datę
-- baza sprawdza już na kilku wierszach. Indeks złożony dodałby trzecią
-- kolumnę do utrzymywania bez różnicy w planie.
--
-- `requests.author_user_id` to drugi taki brak: `pobierzMojeZlecenia`
-- z lib/db/queries/requests.ts filtruje wyłącznie po nim, a istniejące
-- indeksy tej tabeli pokrywają szukanie po okolicy (gist na punkcie)
-- i po stanie z datą imprezy. Żaden z nich nie pomaga pytaniu „czyje to”.

CREATE INDEX "subscriptions_company_id_idx" ON "subscriptions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "requests_author_user_id_idx" ON "requests" USING btree ("author_user_id");

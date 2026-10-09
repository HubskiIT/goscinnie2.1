# Z00. Produkcja gotowa na bazę

**Status:** w toku, wymaga poprawek

**Zadanie:** wdrożenie na Vercel uruchamia migracje i wypełnia słowniki, a `/api/zdrowie` potwierdza połączenie z bazą.

**Rola:** właściciel serwisu.

**Reguła biznesowa:** skrypt słowników uruchomiony dwa razy nie tworzy duplikatów i nie wstawia żadnej firmy, użytkownika ani zlecenia.

**Skille:** `realizacja-zadania`, `migracja-bazy` (migracja 0006).

**Przeczytaj najpierw:** `docs/decyzje/007-wdrozenie-i-dostawcy.md`, `lib/db/seed.ts`, `scripts/migrate.ts`.

**Wchodzi:**
1. Skrypt `vercel-build` zgodny z decyzją 007: migracja, słowniki, budowanie. Migracja i słowniki wyłącznie przy `VERCEL_ENV=production`. Wdrożenia podglądowe robią samo `next build`.
2. Osobny skrypt `db:slowniki`, idempotentny: `categories` z `content/kategorie.ts`, `event_types` z `content/okazje.ts`, `cities` z `content/miejscowosci.json.gz`. Tabela `plans` nie wchodzi, przechodzi do Z03.
3. Rozdzielenie: `db:seed` zostaje danymi pokazowymi tylko dla bazy lokalnej i testów i odmawia działania, gdy `NODE_ENV` to `production`.
4. Migracja `0006` z cofnięciem dla `cities`: kolumny `gmina` i `rodzaj`, `point` dopuszcza pustą wartość. Wszystkie 101 865 miejscowości wchodzą, także 533 bez współrzędnych. Jeśli plik zawiera identyfikator SIMC, osobna kolumna z ograniczeniem unikalności i na niej `on conflict`. Jeśli nie zawiera, agent pokazuje, na czym opiera unikalność, zanim napisze migrację.
5. Istniejące zapytania i indeks przestrzenny działają przy pustym `point`. Zapytania po promieniu pomijają takie wiersze.
6. Testy w `tests/slowniki.test.ts`: idempotencja, brak firm, użytkowników i zleceń po słownikach, odmowa zasiewu przy `NODE_ENV=production`, brak dotknięcia bazy przy `VERCEL_ENV=preview`.
7. Wpis w `README.md`, jakie zmienne trzeba ustawić w Vercel. Same nazwy, bez wartości.

**Nie wchodzi:**
1. Uruchamianie czegokolwiek na bazie produkcyjnej przez agenta.
2. Zmiana dostawcy bazy lub hostingu.
3. Sentry (to Z10).
4. Podpinanie domeny (to Z13).
5. Jakiekolwiek zmiany ekranów.

**Ryzyka do nazwania w planie:** podgląd gałęzi roboczej puszczający niescaloną migrację na bazę produkcyjną, zasiew pokazowy na produkcji, wstawianie 101 865 miejscowości w limicie czasu budowania, migracja przez pulę połączeń zamiast połączenia bezpośredniego.

**Po stronie właściciela:** projekt Supabase, zmienne `DATABASE_URL`, `DATABASE_URL_MIGRACJE`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `APP_URL` wpisane ręcznie w Vercel.

### Stan na 9 października 2026: co jest zrobione i co trzeba poprawić

Na gałęzi `zadanie/Z00-produkcja-gotowa-na-baze` są commity od `6e868d6` do `a9c1096`, niewypchnięte. Powstały według pierwszego planu, przed rozstrzygnięciami właściciela. Do poprawienia na tej samej gałęzi:

1. `scripts/slowniki.ts` wypełnia `plans`. Usunąć. To robi Z03.
2. `scripts/slowniki.ts` pomija 533 miejscowości bez współrzędnych. Po migracji 0006 mają wejść.
3. Brak migracji 0006 dla `cities` (punkt 4 „Wchodzi”).
4. `vercel-build` w `package.json` uruchamia migrację bezwarunkowo. Przenieść do skryptu w `scripts/` z warunkiem `VERCEL_ENV=production` i testem.
5. `tests/zasiew-produkcja.test.ts` scalić z `tests/slowniki.test.ts` jako drugi blok.
6. Usunąć stary plik `docs/zadania.md`. Jedynym źródłem zadań jest folder `docs/zadania/`.

Testy: lokalnie przez Dockera. Jeśli Docker nie wstaje, wariant zapasowy z pliku README tego folderu (CI na GitHubie).

---

Po zakończeniu odpowiedz na pytania kontrolne z `docs/zadania/README.md`.

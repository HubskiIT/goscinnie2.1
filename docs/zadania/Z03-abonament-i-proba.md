# Z03. Abonament zgodny z cennikiem z 3 października

**Status:** do zrobienia

**Zadanie:** baza zna trzy plany, trzy okresy rozliczenia i okres próbny, a firma w okresie próbnym jest traktowana według ustalonych reguł.

**Rola:** firma.

**Reguła biznesowa:** firma w trzydziestodniowym okresie próbnym ma widoczny profil, a po jego upływie bez opłaty profil przestaje być widoczny w katalogu.

**Skille:** `realizacja-zadania`, `migracja-bazy`, `pionowy-plaster`.

**Przeczytaj najpierw:** `lib/db/schema/abonament.ts`, `lib/auth/firma.ts`, `lib/auth/limity.ts`, `content/cennik.ts`, `docs/uprawnienia.md`, `docs/decyzje/009-kategorie-i-wielkosc-uslugodawcy.md`, `tests/abonament.test.ts`.

**Wchodzi:**
1. Migracja: plan `wyrozniony` obok istniejących (dziś enum zna tylko `start` i `pro`), okres rozliczenia `miesiac`, `pol_roku`, `rok`, daty początku i końca próby.
2. Jedno źródło cen. `db:slowniki` wypełnia `plans` z `content/cennik.ts` po zmianie schematu, idempotentnie. Zgodność kwot w bazie z cennikiem pilnuje test.
3. Funkcja rozstrzygająca stan firmy: próba, opłacona, wygasła.
4. Limity ofert zależne od planu i okresu, liczone w `lib/auth/limity.ts`.
5. Zapis decyzji w `docs/decyzje/010-okresy-i-proba.md`, w tym nowe znaczenie statusu `visitcard` po usunięciu darmowej wizytówki.
6. Zmiana w `lib/permissions.ts` jest w tym zadaniu dozwolona, ale wyłącznie w zakresie stanu próby. Każda zmieniona gałąź ma test.

**Nie wchodzi:**
1. Płatności i webhooki (to Z12).
2. Ekran cennika i ekran zamówienia, które już pokazują właściwe kwoty.
3. Podział klasy cenowej według wielkości firmy z decyzji 009. Jest nierozstrzygnięty.
4. Faktury.
5. Przypomnienia o końcu próby.

**BLOKADA, decyzje właściciela przed startem:**
1. Limity ofert. Propozycja: Start 2 na miesiąc, 8 na pół roku, 15 na rok. Pełny 8 na miesiąc przy rozliczeniu miesięcznym, bez limitu od pół roku. Wyróżniony 15 na miesiąc przy rozliczeniu miesięcznym, bez limitu od pół roku.
2. Czy firma w okresie próbnym widzi pełne zlecenia i może składać oferty, czy tylko ma widoczny profil.
3. Co widać po wygaśnięciu: profil znika z katalogu całkowicie, czy zostaje goły wpis z przyciskiem „Przejmij profil”.

**Ryzyka:** firma z wygasłą próbą nadal przechodzi przez `maAktywnyAbonament`, rozjazd cen między bazą a ekranem, zmiana wartości enuma bez działającego cofnięcia.

---

Po zakończeniu odpowiedz na pytania kontrolne z `docs/zadania/README.md`.

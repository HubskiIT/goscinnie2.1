---
name: migracja-bazy
description: Użyj zawsze, gdy zadanie zmienia schemat bazy w Gościnnie, czyli przy dodawaniu lub zmianie tabeli, kolumny, indeksu albo ograniczenia, a także gdy użytkownik mówi "dodaj pole", "zmień tabelę", "zrób migrację". Pilnuje cofnięcia, indeksów i zakazu twardego usuwania danych.
---

# Migracja bazy

Schemat zmienia się wyłącznie przez plik migracji w `drizzle/`. Żadnych zmian
z panelu bazy, żadnego `db push` na czymkolwiek poza lokalną bazą deweloperską.

## Lista kontrolna

### Cofnięcie jest obowiązkowe

Każda migracja ma działające cofnięcie, napisane w tym samym czasie co migracja
w przód. CI uruchamia sekwencję w przód, w tył i znowu w przód. Migracja bez
cofnięcia nie przechodzi.

Przy zmianach nieodwracalnych z natury, jak usunięcie kolumny z danymi, cofnięcie
odtwarza strukturę i wprost dokumentuje w komentarzu, że dane nie wrócą.

### Zakaz twardego usuwania

W tym projekcie nic nie znika. Zamiast usuwać wiersz, oznacz go.
Migracja nie zawiera `DELETE` ani `DROP TABLE` bez mojej wyraźnej zgody.

Usunięcie konta na żądanie z RODO to anonimizacja, nie kasowanie kaskadowe.
Kaskada zabrałaby opinie i oferty powiązane z innymi ludźmi.

### Indeksy przy okazji, nie potem

Dodając kolumnę, po której będzie filtrowanie albo sortowanie, dodaj indeks
w tej samej migracji. Dopisywanie indeksów po fakcie na dużej tabeli oznacza
blokadę na produkcji.

Indeksy, które już muszą istnieć, i których nie ruszaj bez powodu:

- `companies` po `point`, typ GiST, bez niego wyszukiwanie po promieniu zabije bazę
- `company_categories(category_id, company_id)` oraz `companies(city_id, status)`
  pod strony kategoria plus miasto
- `availability(company_id, date)` unikalny
- `bids(request_id, company_id)` unikalny, jedna firma składa jedną ofertę
- GIN z `pg_trgm` na `companies.name` i `cities.name` pod podpowiedzi

### Kolumny czasowe

Wszystkie znaczniki czasu jako `timestamptz`, nigdy `timestamp`.
Daty wydarzeń, które są datą kalendarzową bez godziny, jako `date`.
Polska ma zmianę czasu i mieszanie tych typów daje błędy raz na pół roku.

### Wartości domyślne przy dodawaniu kolumny

Kolumna `NOT NULL` dodawana do istniejącej tabeli musi mieć wartość domyślną
albo migracja musi wypełnić istniejące wiersze przed nałożeniem ograniczenia.

## Po napisaniu migracji

1. `pnpm db:reset` — sprawdź, że baza wstaje od zera.
2. Uruchom migrację w przód, w tył i w przód. Pokaż wynik.
3. Zaktualizuj `docs/schemat.md` o nową tabelę lub kolumnę wraz z uzasadnieniem.
4. Dodaj do `lib/db/seed.ts` dane pokrywające nowe pole.

Migracja bez aktualizacji danych zasiewowych zostawia projekt w stanie,
w którym nowa funkcja nie ma na czym działać.

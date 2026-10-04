# 007. Wdrożenie: Vercel, Supabase, noindex

**Data:** 2026-09-24
**Status:** przyjęte

## Wybory

| Warstwa | Wybór | Uzasadnienie |
| --- | --- | --- |
| Aplikacja | Vercel | Next.js bez konfiguracji, wdrożenie z gałęzi, darmowy próg wystarcza na ten etap |
| Baza | Supabase (Postgres 15+) | ma PostGIS, kopie zapasowe po stronie dostawcy, pula połączeń |
| Błędy | Sentry | bez klucza DSN milczy, więc lokalnie i w testach nic nie wysyła |
| Domena | goscinnie.pl | patrz decyzja 005 o niezmienności adresów |

## Supabase: pasuje, ale z trzema warunkami

**Pasuje.** PostGIS jest dostępny jako rozszerzenie i migracja 0000 włącza go
sama (`create extension if not exists postgis`). `pg_trgm` tak samo.

Trzy rzeczy, które trzeba zrobić dobrze, bo inaczej objawią się dopiero
pod obciążeniem:

### 1. Aplikacja przez pulę, migracje bezpośrednio

Supabase daje dwa adresy. Port **6543** to pula (pgBouncer w trybie
transakcyjnym), port **5432** to połączenie bezpośrednie.

- `DATABASE_URL` na Vercelu: **port 6543**. Każda funkcja bezserwerowa otwiera
  własne połączenie i bez puli baza wyczerpie limit szybciej, niż ktokolwiek
  się zorientuje.
- `DATABASE_URL_MIGRACJE` na Vercelu: **port 5432**, połączenie bezpośrednie.
  Pula w trybie transakcyjnym nie gwarantuje, że wszystkie instrukcje migracji
  trafią na to samo połączenie, a migracja rozbita na dwa połączenia potrafi
  zostawić schemat w połowie.

`scripts/migrate.ts` bierze `DATABASE_URL_MIGRACJE`, a gdy jej nie ma, wraca
do `DATABASE_URL`. Lokalnie zostawiamy ją pustą, bo żadnej puli tam nie ma.

### 2. Instrukcje przygotowane wyłączone za pulą

Pula w trybie transakcyjnym zwraca połączenie do puli po każdej transakcji,
więc instrukcja przygotowana przestaje istnieć, a kolejne żądanie dostaje błąd
o nieznanym identyfikatorze. `lib/db/index.ts` wykrywa port 6543 i wyłącza
`prepare` sam, żeby nie było to kolejną zmienną do zapomnienia.

To jest awaria, która **nie pojawia się przy pierwszym uruchomieniu**, tylko
losowo pod obciążeniem. Najgorszy możliwy rodzaj.

### 3. Blokady wierszy działają, ale w jednej transakcji

`select ... for update` przy składaniu ofert działa za pulą transakcyjną,
bo cała transakcja idzie jednym połączeniem. Gdyby ktoś kiedyś rozbił tę
transakcję na dwa żądania, blokada przestanie cokolwiek znaczyć, a limit ofert
znów zacznie przepuszczać szesnastą.

## Migracje przy wdrożeniu, nie ręcznie

`vercel-build` uruchamia `pnpm db:migrate && next build`. Migracja idzie przed
budowaniem, więc nieudana migracja zatrzymuje wdrożenie, zamiast wypuszczać
kod na schemat, którego nie ma.

Cofnięcia **nie uruchamiamy automatycznie nigdy**. Cofnięcie na produkcji to
decyzja człowieka, podejmowana z wiedzą, jakie dane przy tym przepadną.

## noindex: strategia, nie ostrożność

Cały serwis jest zamknięty dla robotów aż do odwołania. Dwie bariery:
nagłówek `X-Robots-Tag` z `middleware.ts` na każdej odpowiedzi i `robots.txt`
blokujący wszystko.

Powód nie jest techniczny. Katalog zapełniamy przed wpuszczeniem ruchu,
a sześćset cienkich profili bez opisów i zdjęć zaindeksowanych teraz to
najkrótsza droga do filtra jakościowego, z którego wychodzi się miesiącami.
Strony mają być dostępne pod linkiem i niewidoczne w wyszukiwarce.

Sterowanie: zmienna `INDEKSOWANIE`. Otwiera serwis **wyłącznie** dokładna
wartość `wlaczone`, wszystko inne, łącznie z brakiem zmiennej i literówką,
zostawia go zamkniętym. Zdejmujemy to świadomie, gdy katalog będzie gotowy.

## Region i przekierowanie z www

Region `fra1` (Frankfurt), bo baza stoi w Europie i każdy przeskok przez
Atlantyk kosztowałby setki milisekund na każdym zapytaniu.

Przekierowanie `www.goscinnie.pl` na `goscinnie.pl` kodem 301, w `vercel.json`.
Jeden kanoniczny adres, a nie dwa: dwa adresy dzielą między siebie pozycję
w wyszukiwarce i linki z zewnątrz.

## Czego celowo nie ma

- **Płatności.** Pierwsze abonamenty sprzedajemy fakturą, patrz decyzja 002.
- **Kopii zapasowych poza dostawcą.** Na tym etapie kopie Supabase wystarczają.
  Warto wrócić, gdy pojawią się pierwsze prawdziwe zlecenia klientów.
- **Środowiska testowego.** Jedno wdrożenie produkcyjne i praca lokalna.
  Drugie środowisko to drugi zestaw sekretów i druga baza do utrzymania,
  a nie ma jeszcze czego na nim sprawdzać.

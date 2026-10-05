# Gościnnie

Katalog lokali i usługodawców na każdą okazję plus anonimowa giełda zleceń.
Przychód: roczny abonament firm. Klient nie płaci nigdy i za nic.

Zasady pracy, reguła „co kto widzi" i definicja ukończonego zadania są
w [CLAUDE.md](CLAUDE.md). Uzasadnienia decyzji w [docs/decyzje/](docs/decyzje).

## Czego potrzebujesz

- Node 22 lub nowszy
- pnpm 10 (`corepack enable` wystarczy, wersja jest zapięta w `package.json`)
- Docker, tylko jeśli chcesz uruchomić bazę, migracje i testy

## Start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Aplikacja stoi na http://localhost:3000. Do przeglądania katalogu, wyszukiwarki,
stron okazji i formularzy baza nie jest potrzebna: treść czyta się z `content/`.

## Baza, migracje, testy

Potrzebne dopiero przy pracy nad zapleczem.

```bash
pnpm db:up        # Postgres z PostGIS w Dockerze
pnpm db:migrate   # migracje w przód
pnpm db:seed      # dane zasiewowe
pnpm test         # Vitest
```

`pnpm db:reset` czyści wolumen i przechodzi całą sekwencję od nowa.

## Przed commitem

```bash
pnpm check        # plik blokady + Biome + tsc, dokładnie to samo co CI
```

CI dodatkowo uruchamia migracje w przód, w tył i znowu w przód, zasiew, testy
i budowanie produkcyjne.

## Dane miejscowości

`content/miejscowosci.json.gz` to 101 865 miejscowości złożone z rejestru TERYT
(GUS) i Państwowego Rejestru Nazw Geograficznych (GUGiK). Plik jest w repozytorium,
więc normalnie nic nie musisz robić. Odtworzenie go od zera:

```bash
pnpm dane:pobierz        # pobiera zbiory źródłowe do scripts/dane/ (27 MB)
pnpm dane:miejscowosci   # składa je w jeden plik
```

## Stan projektu

Działa: trasy, wyszukiwarka lokali ze stanem w adresie, strony okazji, podpowiedzi
miejscowości, filtry giełdy i imprez, walidacja formularzy po stronie serwera.

Nie działa jeszcze: zapis czegokolwiek. Formularze sprawdzają pola i kończą
komunikatem, że serwis jest w budowie. Schemat bazy, uprawnienia i testy są
przeniesione z repozytorium `goscinnie`, ale ekrany nadal czytają z `content/`,
nie z bazy.

Ogłoszenia w `content/` są przykładowe i tak oznaczone. Dopóki nie zastąpi ich
prawdziwa firma, cały serwis ma `noindex`.

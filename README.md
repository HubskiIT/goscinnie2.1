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
pnpm db:slowniki  # kategorie, okazje, plany, miejscowości
pnpm db:seed      # dane pokazowe, tylko lokalnie i w testach
pnpm test         # Vitest
```

`pnpm db:reset` czyści wolumen i przechodzi całą sekwencję od nowa.

## Zmienne na produkcji

Wdrożenie na Vercel uruchamia migracje i wypełnia słowniki, zanim zbuduje
aplikację (`vercel-build`). Żeby to zadziałało, w ustawieniach projektu muszą
być te zmienne. Same nazwy, wartości wpisuje właściciel.

| Zmienna | Do czego |
| --- | --- |
| `DATABASE_URL` | połączenie aplikacji, przez pulę (u Supabase port 6543) |
| `DATABASE_URL_MIGRACJE` | połączenie bezpośrednie (port 5432) dla migracji i słowników |
| `BETTER_AUTH_SECRET` | podpisywanie sesji, losowy ciąg wygenerowany raz: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | pełny adres aplikacji, z niego budują się linki w wiadomościach |
| `APP_URL` | pełny adres aplikacji, używany przez `sitemap.xml` |

Dlaczego dwa adresy bazy: pula w trybie transakcyjnym nie gwarantuje, że cała
migracja pójdzie jednym połączeniem. Szczegóły w `docs/decyzje/007`.

Zasiew pokazowy (`pnpm db:seed`) odmawia działania, gdy `NODE_ENV` to
`production`. Na produkcji nie ma czego zasiewać: słowniki wchodzą osobnym
skryptem, a firmy i zlecenia zakładają prawdziwi ludzie.

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

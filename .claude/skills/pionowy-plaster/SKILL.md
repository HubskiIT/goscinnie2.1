---
name: pionowy-plaster
description: Użyj przy każdym nowym zadaniu produktowym w Gościnnie, czyli gdy trzeba dodać funkcję sięgającą od bazy danych do ekranu. Uruchom też, gdy użytkownik mówi "dodaj funkcję", "zrób ekran", "zaimplementuj", albo podaje zadanie z planu tygodniowego. Prowadzi przez komplet warstw i pilnuje, żeby nie powstał kod bez testu, bez stanu pustego i bez kontroli uprawnień.
---

# Pionowy plaster

Jedno zadanie to jedna funkcja od bazy do ekranu, nie jedna warstwa.
Nigdy nie realizuj zadania typu "napisz wszystkie endpointy" albo "zrób cały schemat".
Jeśli dostaniesz takie polecenie, zaproponuj podział na plastry i poczekaj na wybór.

## Zanim napiszesz pierwszą linię

1. Przeczytaj `CLAUDE.md`, sekcję o regule "co kto widzi".
2. Sprawdź, czy podobny plaster już istnieje w repo, i trzymaj się jego wzorca.
   Spójność z istniejącym kodem jest ważniejsza niż Twoja preferencja.
3. Jeśli zadanie dotyka `requests`, `bids` albo `subscriptions`, przeczytaj
   `docs/uprawnienia.md` w całości.
4. Przedstaw plan i poczekaj na akceptację. W planie wymień pliki, które utworzysz
   i zmienisz. Jeśli wychodzi ich więcej niż piętnaście, zadanie jest źle pokrojone:
   powiedz to i zaproponuj podział.

## Kolejność, zawsze ta sama

Od bazy w górę. Nigdy od komponentu w dół, bo wtedy kształt danych wychodzi
z wygody widoku, a baza żyje dłużej niż ekran.

### 1. Migracja

Tylko gdy zadanie zmienia schemat. Plik w `drizzle/`, z działającym cofnięciem.
Cofnięcie napisz od razu, nie "potem".

### 2. Schemat Drizzle

`lib/db/schema/<obszar>.ts`. Typy wywodzą się stąd i płyną dalej bez przepisywania.

### 3. Zapytania

`lib/db/queries/<obszar>.ts`. Cały SQL mieszka tutaj.
Zapytania geograficzne używają PostGIS, nie liczenia odległości w JavaScripcie.

### 4. Walidacja

`lib/validators/<obszar>.ts`. Jeden schemat Zod waliduje wejście i daje typ.

### 5. Akcja serwerowa albo endpoint

Kontrola uprawnień przez `lib/permissions.ts`, zawsze, nawet gdy wydaje się zbędna.
Zwracaj kody z `CLAUDE.md`: 402 za abonamentem, 409 przy duplikacie oferty,
429 przy wyczerpanym limicie planu.

### 6. Komponent

Trzy stany, nie jeden:

- stan z danymi
- **stan pusty** z tekstem, który mówi co zrobić, nie "brak wyników"
- **stan błędu** z informacją co poszło nie tak

Stan pusty i stan błędu są obowiązkowe. To jest najczęściej pomijana część.

### 7. Test integracyjny

Testuj regułę biznesową, nie funkcję. Dobry test: "firma bez aktywnej subskrypcji
dostaje 402 przy próbie złożenia oferty". Zły test: "funkcja zwraca obiekt".

Jeśli zadanie dotyka uprawnień, dopisz przypadek do `tests/permissions.test.ts`.

### 8. Dane zasiewowe

Dodaj do `lib/db/seed.ts` przypadek pokrywający nową funkcję, w tym wariant
złośliwy: puste pole, wartość graniczna, polskie znaki, apostrof w nazwie.

## Zakończenie

Uruchom `pnpm check` i `pnpm test`. Pokaż wynik uruchomienia, nie samo stwierdzenie,
że przechodzi.

Przejdź nową ścieżkę raz ręcznie, curlem albo w przeglądarce, nawet gdy testy
są zielone. To jest jedyny sposób na wyłapanie błędów, wobec których testy
są ślepe z konstrukcji.

Następnie wypisz krótkie podsumowanie:

- co powstało, lista plików
- jaką regułę biznesową pokrywa test
- co świadomie pominięto i dlaczego
- jedno zdanie o tym, co warto sprawdzić ręcznie przed merge

Jeśli czegoś nie udało się zrobić, powiedz to wprost zamiast obchodzić problem.

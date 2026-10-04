# Szablon zadania dla Claude Code

Kopiuj, wypełnij trzy pola, wklej jako pierwszy prompt w nowej sesji.
Najpierw tryb planowania, dopiero po akceptacji planu implementacja.

---

## Szablon

```
Zadanie: <jedno zdanie, co użytkownik ma móc zrobić po tej zmianie>

Rola: <klient | firma | moderator>
Reguła biznesowa: <jedno zdanie, które test ma potwierdzić>

Zakres:
- co wchodzi: <lista>
- co NIE wchodzi: <lista, to jest ważniejsze niż się wydaje>

Trzymaj się skilla pionowy-plaster. Zacznij od planu, nie pisz kodu,
dopóki nie zaakceptuję planu.
```

---

## Przykład dobrze napisanego zadania

```
Zadanie: firma z aktywnym abonamentem może złożyć ofertę na otwarte zlecenie,
a firma bez abonamentu dostaje ekran sprzedażowy.

Rola: firma
Reguła biznesowa: firma bez aktywnej subskrypcji dostaje 402 przy próbie
złożenia oferty, firma z aktywną dostaje 201 i oferta zapisuje się raz.

Zakres:
- co wchodzi: tabela bids z migracją, zapytania, walidacja Zod, endpoint
  POST /api/requests/:id/bids z kontrolą przez lib/permissions.ts,
  formularz oferty ze stanem pustym i błędu, testy na 402, 201 i 409
- co NIE wchodzi: porównywarka ofert po stronie klienta, powiadomienia mailowe,
  limity planu Start (osobne zadanie)

Trzymaj się skilla pionowy-plaster. Zacznij od planu, nie pisz kodu,
dopóki nie zaakceptuję planu.
```

---

## Dlaczego "co NIE wchodzi" jest najważniejszym polem

Bez tego pola model dopisze porównywarkę, powiadomienia i panel statystyk,
bo wyglądają na potrzebne. Dostaniesz czterdzieści plików zamiast dwunastu
i nie będziesz miał jak tego sprawdzić.

Granica zakresu jest Twoją główną dźwignią jakości. Używaj jej zawsze.

---

## Pytania kontrolne po zakończeniu zadania

Zadaj je agentowi, zanim zmergujesz:

1. Pokaż wynik uruchomienia testów, nie podsumowanie.
2. Wymień pliki, które zmieniłeś, i powiedz w jednym zdaniu po co każdy.
3. Co w tym zadaniu zrobiłeś inaczej, niż sugeruje istniejący kod w repo?
4. Gdzie tu jest przypadek brzegowy, którego nie pokryłeś testem?
5. Czy któraś zmiana dotyka lib/permissions.ts albo endpointów zleceń?

Pytanie czwarte jest najlepsze z całej listy. Model zwykle uczciwie wskazuje
dziury, gdy się go wprost o nie zapyta, a nie wskazuje ich z własnej inicjatywy.

---

## Przekazanie między sesjami

Gdy zadanie nie mieści się w jednej sesji, zakończ ją poleceniem:

```
Zapisz do docs/przekazanie.md: co zrobione, co zostaje, które pliki są w trakcie,
jaka jest następna decyzja do podjęcia i dlaczego. Bez kodu, sama treść.
```

Następna sesja zaczyna się od przeczytania tego pliku.

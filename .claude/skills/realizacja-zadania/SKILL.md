---
name: realizacja-zadania
description: Użyj zawsze, gdy zaczynasz lub kontynuujesz zadanie z folderu docs/zadania/ w Gościnnie, czyli gdy pada numer typu Z00 do Z13, komenda /zadanie albo prośba "zrób następne zadanie". Prowadzi od przeczytania pliku zadania przez plan, gałąź i testy do pytań kontrolnych.
---

# Realizacja zadania z docs/zadania/

Jedno zadanie to jedna sesja i jedna gałąź. Ten skill mówi, w jakiej kolejności to robić. Co dokładnie budować, mówi plik zadania.

## Krok 1. Wczytaj kontekst

1. `CLAUDE.md` w całości.
2. `docs/zadania/README.md`: zasady wspólne, tabela stanu, decyzje właściciela.
3. Plik zadania `docs/zadania/ZNN-*.md` w całości.
4. Pliki z pola „Przeczytaj najpierw”.
5. `docs/przekazanie.md`, jeśli istnieje i dotyczy tego zadania.
6. Gdy zadanie dotyka `requests`, `bids` albo `subscriptions`: `docs/uprawnienia.md` w całości.

## Krok 2. Sprawdź, czy wolno zacząć

1. Każde zadanie z kolumny „Zależy od” ma stan `zrobione` i jest w `main` (`git log main`). Jeśli nie, zatrzymaj się i powiedz, czego brakuje.
2. Zadanie ma oznaczenie BLOKADA albo czeka na decyzję z listy w README: wypisz, czego potrzebujesz od właściciela, i zatrzymaj się. Nie przyjmuj wartości domyślnych za niego.
3. Gałąź `zadanie/ZNN-*` już istnieje: przeczytaj jej commity (`git log main..gałąź`) i sekcję „Stan” w pliku zadania. Kontynuujesz, nie zaczynasz od zera.
4. Sprawdź, czy działa Docker (`docker info`). Jeśli nie, powiedz to w planie i zaproponuj wariant zapasowy z README.

## Krok 3. Plan, potem stop

Przedstaw plan i czekaj na akceptację. Kodu nie piszesz przed akceptacją.

1. Pliki do utworzenia i zmiany, przy każdym jedno zdanie po co. Powyżej piętnastu plików nie planuj dalej, tylko zaproponuj podział przez `/goal`.
2. Reguła biznesowa i testy, które ją potwierdzą, oraz jak sprawdzisz ich czułość. Przy kilku barierach osobny test na każdą.
3. Każde ryzyko z pola „Ryzyka” i co z nim zrobisz. Jeśli nie występuje, napisz dlaczego.
4. Nowe zależności z dokładną wersją i uzasadnieniem. Zwykle: żadnych.
5. Rozbieżności między plikiem zadania a kodem. Nie rozstrzygaj ich sam.
6. Pytania do właściciela.

## Krok 4. Budowa

1. Gałąź `zadanie/ZNN-krotka-nazwa` z aktualnego `main`, chyba że już istnieje.
2. Kolejność warstw według skilla `pionowy-plaster`. Zmiana schematu według skilla `migracja-bazy`.
3. Tylko pole „Wchodzi”. Nic z „Nie wchodzi”. Jeśli bez czegoś zadanie traci sens, zatrzymaj się i zapytaj.
4. Małe commity po polsku w konwencji z historii (`feat:`, `fix:`, `test:`, `docs:`, `chore:`). Przed każdym `pnpm check`.
5. Nie wypychasz do `main`, nie mergujesz, nie robisz force push. Gałąź zadania wypychasz tylko w wariancie zapasowym testów albo na prośbę właściciela.

## Krok 5. Domknięcie

1. Uruchom `pnpm check` i `pnpm test --run`. Wklej wynik, nie streszczenie.
2. Pokaż sprawdzenie czułości: co złamałeś, które testy padły, że po przywróceniu przechodzą.
3. Zaktualizuj plik zadania: stan `do scalenia` w nagłówku, sekcja „Stan” z listą commitów i tym, co zostało.
4. Zaktualizuj tabelę w `docs/zadania/README.md` tak samo.
5. Odpowiedz na pytania kontrolne z README.
6. Wypisz, co właściciel musi zrobić ręcznie (zmienne w Vercel, konta, DNS), żeby to działało na produkcji.

Gdy właściciel potwierdzi scalenie, zmień stan na `zrobione` w obu miejscach.

## Gdy sesja się kończy przed czasem

Zapisz `docs/przekazanie.md`: numer zadania, co zrobione, co zostaje, pliki w trakcie, następna decyzja i dlaczego. Bez kodu.

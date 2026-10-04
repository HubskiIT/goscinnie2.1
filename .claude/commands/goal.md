---
description: Zamienia jedno zdanie o tym, co ma powstać, w poprawnie pokrojone zadanie. Planuje, nie koduje.
argument-hint: [co ma powstać, jednym zdaniem]
---

Cel: $ARGUMENTS

Nie dotykaj plików. Twoim zadaniem w tej komendzie jest doprowadzić powyższe
do zadania, które da się uczciwie zrobić w jednej sesji, i zatrzymać się
na akceptacji zakresu.

## 1. Osadź to w projekcie

Przeczytaj `CLAUDE.md` i `docs/uprawnienia.md`. Sprawdź, czy podobny plaster
już istnieje w repo, i jeśli tak, trzymaj się jego wzorca zamiast wymyślać nowy.

Wypisz, których przypadków z `docs/uprawnienia.md` to zadanie dotyka i które
z nich domknie. Jeśli żadnego, powiedz to wprost.

## 2. Zmierz rozmiar, zanim cokolwiek zaplanujesz

Wypisz pliki, które utworzysz i zmienisz.

Powyżej piętnastu plików zadanie jest źle pokrojone. Wtedy nie planuj dalej:
zaproponuj podział na plastry, pokaż zależności między nimi, wskaż, który
idzie pierwszy i dlaczego, i **zatrzymaj się na tym**.

Uważaj na zadania, które brzmią jak jedna rzecz, a są czterema. Jeśli coś
wymaga jednocześnie nowej encji, płatności i interfejsu, to nie jest jeden
plaster.

## 3. Zaproponuj zakres

W tym formacie, bez skrótów:

- **Zadanie**: jedno zdanie od strony tego, co użytkownik będzie mógł zrobić,
  nie od strony tego, co powstanie w kodzie
- **Rola**: kto to robi
- **Reguła biznesowa**: jedno zdanie, które test ma potwierdzić
- **Co wchodzi**: lista
- **Co NIE wchodzi**: lista

Pole "co NIE wchodzi" jest najważniejsze w całej komendzie. Wymień co najmniej
pięć rzeczy, które ktoś mógłby uznać za naturalną część tego zadania, a które
świadomie zostawiamy na później. Bez tego pola dostanę czterdzieści plików
zamiast dwunastu i nie będę miał jak tego sprawdzić.

## 4. Wskaż, gdzie to pójdzie źle

Zanim zaczniesz, nazwij ryzyka konkretne dla tego zadania:

- gdzie dane mogą po cichu wyciec do widza, który nie ma do nich prawa
- gdzie jest wyścig, brak idempotencji albo operacja nieodwracalna
- gdzie komunikat błędu, czas odpowiedzi albo cokolwiek innego zdradza
  informację, której odbiorca nie miał poznać
- ile barier będzie chronić tę samą regułę; każda potrzebuje osobnego testu
  i zasiewu ustawionego pod nią, inaczej nie da się jej sprawdzić
- gdzie test negatywny wymaga instancji pozytywnej w bazie

Jeśli któreś z tych ryzyk tu nie występuje, napisz że nie występuje i dlaczego.
Nie wypełniaj listy na siłę.

## 5. Zatrzymaj się

Czekaj na akceptację zakresu. Nie zaczynaj pisać, nawet jeśli wydaje Ci się
oczywisty. Jeśli czegoś nie wiesz, zapytaj teraz, nie w połowie pracy.

Po akceptacji prowadź zadanie skillem `pionowy-plaster`.

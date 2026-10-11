# Z06. Katalog i profil czytają z bazy

**Status:** do zrobienia

**Zadanie:** listy lokali i usługodawców oraz strona profilu pokazują firmy zatwierdzone przez moderatora, a wyszukiwanie po promieniu działa na prawdziwych odległościach.

**Rola:** anonim, klient.

**Reguła biznesowa:** w katalogu jest wyłącznie firma w stanie `active` z trwającą próbą albo opłaconym abonamentem.

**Skille:** `realizacja-zadania`, `pionowy-plaster`.

**Przeczytaj najpierw:** `content/ogloszenia.ts`, `lib/wyszukiwanie.ts`, `lib/wyszukiwanie-serwer.ts`, `lib/filtry.ts`, `lib/db/queries/firmy.ts`, `tests/indeksy.test.ts`.

**Wchodzi:**
1. Migracja 0007: `simc not null` w `cities`. Po migracji 0006 wszystkie miasta mają SIMC, więc bezpieczne.
2. Zapytania listy z filtrami z adresu: rodzaj lub kategoria, miejscowość z promieniem liczona w PostGIS, liczba gości, okazja.
3. Podmiana źródła w `/lokale`, `/uslugodawcy`, ich stronach z parametrami i w `/f/[slug]`.
4. Stan pusty z przyciskiem „Dodaj zlecenie".
5. Stronicowanie w adresie.
6. Usunięcie przykładowych lokali i usługodawców z `content/ogloszenia.ts`. Zlecenie i impreza przykładowa zostają do Z09.
7. Etykieta „Ogłoszenie przykładowe" znika razem z przykładami. Blokada indeksowania zostaje.
8. Testy: szkic i firma po wygasłej próbie poza listą, firma spoza promienia poza listą przy istniejącej firmie w promieniu.

**Nie wchodzi:**
1. Mapa. Decyzja z 3 października: mapy nie ma.
2. Sortowanie po ocenie i opinie.
3. Wyróżnienie planu Wyróżniony na liście.
4. Krótka lista ulubionych zapisywana na koncie.
5. Imprezy z bazy.
6. Włączenie indeksowania.

**Ryzyka:** miejscowość bez współrzędnych wybrana jako środek wyszukiwania po promieniu, podpowiedzi tracące gminę i powiat po przejściu na bazę, zapytanie bez indeksu przestrzennego, liczenie odległości w JavaScripcie zamiast w bazie, dane kontaktowe firmy w odpowiedzi listy.

---

Po zakończeniu odpowiedz na pytania kontrolne z `docs/zadania/README.md`.

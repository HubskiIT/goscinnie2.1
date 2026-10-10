# Z09. Giełda z bazy i formularz oferty

**Status:** do zrobienia

**Zadanie:** lista zleceń i strona zlecenia czytają z bazy według reguły „co kto widzi”, a firma składa ofertę z poziomu strony.

**Rola:** anonim, firma, klient jako autor.

**Reguła biznesowa:** każda z czterech kolumn tabeli „co kto widzi” dostaje na ekranie dokładnie te pola, które jej przysługują, a firma bez prawa do oferty widzi ekran sprzedażowy z ceną swojego planu.

**Skille:** `realizacja-zadania`, `pionowy-plaster`.

**Przeczytaj najpierw:** `docs/uprawnienia.md` w całości, `lib/db/queries/requests.ts`, `lib/db/queries/bids.ts`, `app/api/zlecenia/[id]/oferty/route.ts`, `lib/api/odmowy.ts`, `tests/oferty.test.ts`.

**Wchodzi:**
1. `/zlecenia` i `/zlecenia/[id]` czytają przez `pobierzListeDlaWidza` i `pobierzZlecenieDlaWidza`. Filtry zostają w adresie.
2. Formularz oferty podpięty do istniejącego endpointu.
3. Obsługa kodów jako ekranów, nie błędów: 402 prowadzi do cennika z ceną dla kategorii firmy, 409 pokazuje złożoną ofertę, 429 prowadzi do podniesienia planu.
4. Autor widzi oferty i dodaje firmę do krótkiej listy, co odblokowuje kontakt.
5. Wiadomość e-mail do klienta o nowej ofercie.
6. Usunięcie przykładowego zlecenia z `content/ogloszenia.ts`.
7. `lib/permissions.ts` bez zmian. Jeśli zmiana wydaje się konieczna, zatrzymaj się i zapytaj.

**Nie wchodzi:**
1. Porównywarka ofert.
2. Powiadomienia firm o nowych zleceniach z opóźnieniem zależnym od planu.
3. Czat między klientem a firmą.
4. Opinie po realizacji.
5. Imprezy z bazy.
6. Wybór zwycięskiej oferty i zamknięcie zlecenia.

**Ryzyka:** pole ukryte w komponencie zamiast w zapytaniu, liczba ofert widoczna dla firm, budżet w kodzie HTML strony dla firmy bez abonamentu, wyścig przy limicie dziesięciu ofert.

---

Po zakończeniu odpowiedz na pytania kontrolne z `docs/zadania/README.md`.

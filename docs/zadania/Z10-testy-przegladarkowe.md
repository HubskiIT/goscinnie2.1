# Z10. Testy przeglądarkowe i zgłaszanie błędów

**Status:** do zrobienia

**Zadanie:** cztery główne ścieżki są sprawdzane w prawdziwej przeglądarce przy każdej zmianie, a błąd na produkcji trafia do właściciela.

**Rola:** właściciel serwisu.

**Reguła biznesowa:** zmiana, która psuje którąkolwiek z czterech ścieżek, nie przechodzi CI.

**Skille:** `realizacja-zadania`.

**Wchodzi:**
1. Propozycja zależności do akceptacji: Playwright, axe, Sentry. Z dokładnymi wersjami.
2. Ścieżki: firma od rejestracji do widocznego profilu, klient od wyszukiwarki do wysłanego zapytania, klient od zlecenia do krótkiej listy, firma bez abonamentu trafiająca na ekran sprzedażowy.
3. Każda ścieżka dodatkowo z wyłączonym JavaScriptem tam, gdzie zasady tego wymagają.
4. Test dostępności stron publicznych.
5. Krok w CI na bazie z zasiewem.
6. Sentry milczące bez klucza, zgodnie z decyzją 007.

**Nie wchodzi:**
1. Testy wizualne ze zrzutami ekranu.
2. Testy wydajności i obciążenia.
3. Analityka ruchu.
4. Nagrywanie sesji użytkowników.
5. Testy na produkcji.

**Ryzyka:** testy zależne od kolejności i wspólnego stanu bazy, dane osobowe w zgłoszeniach błędów.

---

Po zakończeniu odpowiedz na pytania kontrolne z `docs/zadania/README.md`.

# Z08. Klient dodaje zlecenie, moderator je puszcza

**Status:** do zrobienia

**Zadanie:** klient opisuje wydarzenie w `/dodaj-zlecenie`, zlecenie czeka na moderację, a po akceptacji staje się otwarte.

**Rola:** klient, moderator.

**Reguła biznesowa:** zlecenie przed akceptacją moderatora widzi wyłącznie autor i moderator.

**Skille:** `realizacja-zadania`, `pionowy-plaster`, `migracja-bazy`.

**Przeczytaj najpierw:** `docs/uprawnienia.md` w całości, `lib/db/queries/requests.ts`, `lib/validators/zlecenia.ts`, `app/api/zlecenia/route.ts`, `tests/permissions.test.ts`.

**Wchodzi:**
1. Migracja: stan oczekiwania na moderację i stan odrzucenia w `request_status`. Dziś enum zna tylko `open`, `closed`, `expired`, `archived`.
2. Formularz zapisuje zlecenie przez istniejące zapytania. Wymaga konta klienta.
3. Lista zleceń klienta w `/moje` ze stanem każdego zlecenia.
4. Zakładka zleceń w `/moderacja`: akceptuj, odrzuć z powodem.
5. Wiadomość e-mail do klienta po decyzji.
6. Rozszerzenie `tests/permissions.test.ts` o nowe stany dla każdej kolumny tabeli „co kto widzi”.
7. Zmiana w `lib/permissions.ts` dozwolona wyłącznie w zakresie nowych stanów.

**Nie wchodzi:**
1. Kilka kategorii w jednym formularzu i zlecenia powiązane.
2. Tryb „nie wiem, kogo szukam”.
3. Automatyczna moderacja.
4. Powiadomienia firm o nowym zleceniu.
5. Edycja zlecenia po publikacji.
6. Wygasanie zleceń w tle.

**Ryzyka:** zlecenie w moderacji widoczne na liście publicznej, dokładna miejscowość zamiast powiatu, identyfikator zlecenia możliwy do odgadnięcia, powód odrzucenia widoczny dla firm.

---

Po zakończeniu odpowiedz na pytania kontrolne z `docs/zadania/README.md`.

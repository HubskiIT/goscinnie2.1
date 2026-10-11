# Z01. Nadawca poczty

**Status:** do zrobienia

**Zadanie:** serwis potrafi wysłać wiadomość e-mail, a link do resetu hasła trafia do skrzynki zamiast do logu.

**Rola:** każdy użytkownik z kontem.

**Reguła biznesowa:** odpowiedź na prośbę o reset hasła jest identyczna dla adresu istniejącego i nieistniejącego, a wiadomość wychodzi tylko dla istniejącego.

**Skille:** `realizacja-zadania`, `pionowy-plaster`.

**Przeczytaj najpierw:** `lib/auth/index.ts` (komentarz DO ZROBIENIA przy `sendResetPassword`).

**Wchodzi:**
1. Moduł `lib/poczta/` z jednym interfejsem `wyslij` i dwoma nadawcami: konsola dla pracy lokalnej i testów, dostawca zewnętrzny dla produkcji.
2. Nadawca produkcyjny przez zwykłe `fetch` do API dostawcy, bez nowej zależności. Propozycja dostawcy do akceptacji w planie.
3. Dwa szablony tekstowe: potwierdzenie adresu, reset hasła. Zwykły tekst plus prosty HTML, bez grafik.
4. Podpięcie do `better-auth`: `sendResetPassword` i potwierdzenie adresu, `requireEmailVerification` włączone.
5. Brak klucza dostawcy na produkcji kończy się głośnym błędem przy starcie, nie cichym pominięciem wysyłki.
6. Testy: identyczna odpowiedź resetu, brak wysyłki dla nieznanego adresu, treść wiadomości zawiera link.

**Nie wchodzi:**
1. Powiadomienia o zapytaniach i zleceniach (to Z07 i Z09).
2. Newsletter i wiadomości marketingowe.
3. Kolejka wysyłki i ponawianie.
4. Szablony graficzne.
5. Ekrany logowania (to Z02).

**Ryzyka:** wyciek istnienia konta przez różnicę w treści lub czasie odpowiedzi, link resetu w logach produkcyjnych, wysyłka z domeny bez wpisów SPF i DKIM.

**Po stronie właściciela:** konto u dostawcy, klucz w Vercel, wpisy DNS dla domeny nadawcy.

---

Po zakończeniu odpowiedz na pytania kontrolne z `docs/zadania/README.md`.

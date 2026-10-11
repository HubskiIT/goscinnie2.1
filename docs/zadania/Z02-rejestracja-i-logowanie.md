# Z02. Rejestracja i logowanie na ekranach

**Status:** do zrobienia

**Zadanie:** klient i firma zakładają konto, potwierdzają adres, logują się, wylogowują i odzyskują hasło z poziomu strony.

**Rola:** klient, firma.

**Reguła biznesowa:** niezalogowany, który wchodzi na dowolny adres z grupy `(panel)`, trafia na `/logowanie` i po zalogowaniu wraca tam, dokąd szedł.

**Skille:** `realizacja-zadania`, `pionowy-plaster`.

**Przeczytaj najpierw:** `lib/auth/index.ts`, `lib/auth/klient.ts`, `lib/auth/widz.ts`, `lib/akcje/formularze.ts`, `components/screens/LogowanieScreen.tsx`, `components/screens/RejestracjaFirmyScreen.tsx`.

**Wchodzi:**
1. Akcje serwerowe logowania, rejestracji klienta, rejestracji firmy (samo konto, bez profilu), wylogowania, prośby o reset i ustawienia nowego hasła. Zastępują gałąź „w budowie” dla tych formularzy.
2. Ekran „Sprawdź skrzynkę” i ekran ustawienia nowego hasła w istniejącym stylu.
3. Ochrona grupy `(panel)` w jej `layout.tsx` po stronie serwera.
4. Nagłówek i menu mobilne pokazują stan: niezalogowany, klient, firma.
5. Flaga `REJESTRACJA_OTWARTA`. Gdy jest wyłączona, formularze rejestracji pokazują komunikat o budowie, a logowanie działa. Domyślnie wyłączona na produkcji.
6. Pole zgody na regulamin z linkami do `/regulamin` i `/polityka-prywatnosci`. Strony istnieją i zawierają jedno zdanie: dokument jest w przygotowaniu.
7. Ograniczenie liczby prób logowania przez istniejącą tabelę `rate_limits`.
8. Testy: przekierowanie niezalogowanego, powrót po zalogowaniu, zamknięta rejestracja przy wyłączonej fladze, blokada po przekroczeniu limitu prób.

**Nie wchodzi:**
1. Logowanie przez Google.
2. TOTP dla firm.
3. Weryfikacja NIP i numeru telefonu.
4. Treść regulaminu i polityki prywatności.
5. Edycja danych konta i usuwanie konta.
6. Kreator profilu (to Z04).

**Ryzyka:** otwarte przekierowanie przez parametr powrotu, różne komunikaty dla „złe hasło” i „nie ma konta”, sesja ustawiana przed potwierdzeniem adresu, rejestracja dostępna mimo wyłączonej flagi przez bezpośrednie wywołanie API `better-auth`.

---

Po zakończeniu odpowiedz na pytania kontrolne z `docs/zadania/README.md`.

# Zadania do otwarcia serwisu

Stan na 6 października 2026. Podstawa: repozytorium `goscinnie2.1` po commicie `52ab1af`.

Cel: prawdziwa firma zakłada konto, buduje profil i trafia do katalogu, a prawdziwy klient wysyła zapytanie i dodaje zlecenie. Dziś żadna z tych rzeczy się nie zapisuje.

## Jak czytać ten plik

1. Jedno zadanie to jedna sesja agenta i jedna gałąź `zadanie/ZNN-nazwa`.
2. Zadania idą w kolejności z tabeli. Nie zaczynaj zadania, którego zależność nie jest zmergowana.
3. Każde zadanie zaczyna się od planu. Kod powstaje dopiero po akceptacji planu przez właściciela.
4. Jeśli plan wychodzi powyżej piętnastu plików, zadanie jest źle pokrojone. Zaproponuj podział i zatrzymaj się.
5. Pole „Nie wchodzi” jest wiążące. Rzeczy z tej listy nie powstają nawet wtedy, gdy wyglądają na potrzebne.
6. Zadanie z oznaczeniem BLOKADA nie rusza, dopóki właściciel nie dostarczy wskazanej rzeczy.

## Narzędzia agenta

1. Skill `pionowy-plaster`: każde zadanie produktowe, kolejność od bazy do ekranu, trzy stany komponentu.
2. Skill `migracja-bazy`: każde zadanie zmieniające schemat. Migracja i cofnięcie powstają razem.
3. Komenda `/goal`: gdy zadanie okaże się za duże i trzeba je pokroić.
4. `CLAUDE.md`: zasady i definicja ukończonego zadania. Obowiązuje w całości.
5. `docs/uprawnienia.md`: czytane w całości przy każdym zadaniu dotykającym `requests`, `bids`, `subscriptions`.
6. `docs/szablon-zadania.md`: pięć pytań kontrolnych, na które agent odpowiada na końcu każdego zadania bez proszenia.

## Zasady wspólne dla wszystkich zadań

1. Żadnej zmyślonej treści. Brak danych oznacza brak sekcji, nie tekst zastępczy.
2. Wygląd się nie zmienia. Kolory i typografia tylko z `docs/tokeny.md`.
3. Nawigacja to linki, formularze działają bez JavaScriptu, stan filtrów siedzi w adresie.
4. Nowa zależność wymaga zgody właściciela. Zaproponuj, uzasadnij, poczekaj.
5. Migracje uruchamiasz wyłącznie na bazie lokalnej.
6. Nie czytasz plików `.env*`. Nazwy zmiennych bierzesz z `.env.example`.
7. Nie zmieniasz `lib/permissions.ts` bez wyraźnego polecenia w treści zadania.
8. Nie piszesz regulaminu ani polityki prywatności.
9. Test na regułę biznesową ma sprawdzoną czułość: złam regułę, pokaż, że test pada, przywróć kod.
10. Na końcu pokazujesz wynik `pnpm check` i `pnpm test --run`, nie streszczenie.

## Kolejność i zależności

| Nr | Zadanie | Zależy od | Blokada po stronie właściciela |
|---|---|---|---|
| Z00 | Produkcja gotowa na bazę | brak | zmienne w Vercel, projekt Supabase |
| Z01 | Nadawca poczty | Z00 | konto u dostawcy poczty, wpisy DNS |
| Z02 | Rejestracja i logowanie na ekranach | Z01 | brak |
| Z03 | Abonament zgodny z cennikiem z 3 października | Z00 | limity ofert, widoczność zleceń w próbie |
| Z04 | Kreator profilu firmy zapisuje do bazy | Z02, Z03 | brak |
| Z05 | Moderator zatwierdza firmy | Z04 | brak |
| Z06 | Katalog i profil czytają z bazy | Z05 | brak |
| Z07 | Zapytanie do firmy | Z06 | brak |
| Z08 | Klient dodaje zlecenie, moderator je puszcza | Z05 | brak |
| Z09 | Giełda z bazy i formularz oferty | Z08, Z03 | brak |
| Z10 | Testy przeglądarkowe i zgłaszanie błędów | Z07, Z09 | zgoda na zależności |
| Z11 | Zdjęcia w profilu | Z04 | wybór magazynu plików |
| Z12 | Płatności | Z03 | konto Stripe i Przelewy24, regulamin |
| Z13 | Otwarcie: prawdziwe firmy i indeksowanie | Z10 | regulamin, polityka prywatności, domena, pierwsze firmy |

Kamień A, firmy mogą wchodzić: Z00 do Z06.
Kamień B, klienci mogą wchodzić: Z07 do Z10.
Kamień C, serwis publiczny: Z13.

Rejestracja na produkcji pozostaje zamknięta flagą do czasu dostarczenia regulaminu i polityki prywatności (patrz Z02).

---

## Z00. Produkcja gotowa na bazę

**Zadanie:** wdrożenie na Vercel uruchamia migracje i wypełnia słowniki, a `/api/zdrowie` potwierdza połączenie z bazą.

**Rola:** właściciel serwisu.

**Reguła biznesowa:** skrypt słowników uruchomiony dwa razy nie tworzy duplikatów i nie wstawia żadnej firmy, użytkownika ani zlecenia.

**Skille:** `migracja-bazy` tylko jeśli okaże się potrzebna zmiana schematu.

**Przeczytaj najpierw:** `docs/decyzje/007-wdrozenie-i-dostawcy.md`, `lib/db/seed.ts`, `scripts/migrate.ts`.

**Wchodzi:**
1. Skrypt `vercel-build` w `package.json` zgodny z decyzją 007: migracja, potem budowanie. Dziś go nie ma.
2. Osobny skrypt `db:slowniki`, idempotentny: `categories` z `content/kategorie.ts`, `event_types` z `content/okazje.ts`, `plans`, `cities` z `content/miejscowosci.json.gz`.
3. Rozdzielenie: `db:seed` zostaje danymi pokazowymi tylko dla bazy lokalnej i testów i odmawia działania, gdy `NODE_ENV` to `production`.
4. Test idempotencji słowników i test odmowy zasiewu na produkcji.
5. Wpis w `README.md`, jakie zmienne trzeba ustawić w Vercel. Same nazwy, bez wartości.

**Nie wchodzi:**
1. Uruchamianie czegokolwiek na bazie produkcyjnej przez agenta.
2. Zmiana dostawcy bazy lub hostingu.
3. Sentry (to Z10).
4. Podpinanie domeny (to Z13).
5. Jakiekolwiek zmiany ekranów.

**Ryzyka do nazwania w planie:** zasiew pokazowy na produkcji, wstawianie 101 865 miejscowości w limicie czasu budowania, migracja przez pulę połączeń zamiast połączenia bezpośredniego.

**Po stronie właściciela:** projekt Supabase, zmienne `DATABASE_URL`, `DATABASE_URL_MIGRACJE`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `APP_URL` wpisane ręcznie w Vercel.

---

## Z01. Nadawca poczty

**Zadanie:** serwis potrafi wysłać wiadomość e-mail, a link do resetu hasła trafia do skrzynki zamiast do logu.

**Rola:** każdy użytkownik z kontem.

**Reguła biznesowa:** odpowiedź na prośbę o reset hasła jest identyczna dla adresu istniejącego i nieistniejącego, a wiadomość wychodzi tylko dla istniejącego.

**Skille:** `pionowy-plaster`.

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

## Z02. Rejestracja i logowanie na ekranach

**Zadanie:** klient i firma zakładają konto, potwierdzają adres, logują się, wylogowują i odzyskują hasło z poziomu strony.

**Rola:** klient, firma.

**Reguła biznesowa:** niezalogowany, który wchodzi na dowolny adres z grupy `(panel)`, trafia na `/logowanie` i po zalogowaniu wraca tam, dokąd szedł.

**Skille:** `pionowy-plaster`.

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

## Z03. Abonament zgodny z cennikiem z 3 października

**Zadanie:** baza zna trzy plany, trzy okresy rozliczenia i okres próbny, a firma w okresie próbnym jest traktowana według ustalonych reguł.

**Rola:** firma.

**Reguła biznesowa:** firma w trzydziestodniowym okresie próbnym ma widoczny profil, a po jego upływie bez opłaty profil przestaje być widoczny w katalogu.

**Skille:** `migracja-bazy`, `pionowy-plaster`.

**Przeczytaj najpierw:** `lib/db/schema/abonament.ts`, `lib/auth/firma.ts`, `lib/auth/limity.ts`, `content/cennik.ts`, `docs/uprawnienia.md`, `docs/decyzje/009-kategorie-i-wielkosc-uslugodawcy.md`, `tests/abonament.test.ts`.

**Wchodzi:**
1. Migracja: plan `wyrozniony` obok istniejących (dziś enum zna tylko `start` i `pro`), okres rozliczenia `miesiac`, `pol_roku`, `rok`, daty początku i końca próby.
2. Jedno źródło cen. Kwoty w tabeli `plans` muszą się zgadzać z `content/cennik.ts` i pilnuje tego test.
3. Funkcja rozstrzygająca stan firmy: próba, opłacona, wygasła.
4. Limity ofert zależne od planu i okresu, liczone w `lib/auth/limity.ts`.
5. Zapis decyzji w `docs/decyzje/010-okresy-i-proba.md`, w tym nowe znaczenie statusu `visitcard` po usunięciu darmowej wizytówki.
6. Zmiana w `lib/permissions.ts` jest w tym zadaniu dozwolona, ale wyłącznie w zakresie stanu próby. Każda zmieniona gałąź ma test.

**Nie wchodzi:**
1. Płatności i webhooki (to Z12).
2. Ekran cennika i ekran zamówienia, które już pokazują właściwe kwoty.
3. Podział klasy cenowej według wielkości firmy z decyzji 009. Jest nierozstrzygnięty.
4. Faktury.
5. Przypomnienia o końcu próby.

**BLOKADA, decyzje właściciela przed startem:**
1. Limity ofert. Propozycja: Start 2 na miesiąc, 8 na pół roku, 15 na rok. Pełny 8 na miesiąc przy rozliczeniu miesięcznym, bez limitu od pół roku. Wyróżniony 15 na miesiąc przy rozliczeniu miesięcznym, bez limitu od pół roku.
2. Czy firma w okresie próbnym widzi pełne zlecenia i może składać oferty, czy tylko ma widoczny profil.
3. Co widać po wygaśnięciu: profil znika z katalogu całkowicie, czy zostaje goły wpis z przyciskiem „Przejmij profil”.

**Ryzyka:** firma z wygasłą próbą nadal przechodzi przez `maAktywnyAbonament`, rozjazd cen między bazą a ekranem, zmiana wartości enuma bez działającego cofnięcia.

---

## Z04. Kreator profilu firmy zapisuje do bazy

**Zadanie:** zalogowana firma buduje profil krok po kroku, może przerwać i wrócić, a na końcu wysyła go do zatwierdzenia.

**Rola:** firma.

**Reguła biznesowa:** profil w stanie szkicu widzi wyłącznie jego właściciel i moderator. Nikt inny nie dostaje go ani w katalogu, ani pod bezpośrednim adresem.

**Skille:** `pionowy-plaster`, `migracja-bazy` jeśli brakuje kolumn.

**Przeczytaj najpierw:** `lib/db/queries/firmy.ts`, `lib/validators/profil.ts`, `lib/db/schema/katalog.ts`, `app/(panel)/panel/profil/page.tsx`, `content/kategorie.ts`, `content/rodzaje-lokali.ts`, `tests/profil-firmy.test.ts`.

**Wchodzi:**
1. Utworzenie firmy w stanie `draft` i powiązanie jej z kontem przez `company_members`.
2. Kroki: rodzaj ogłoszenia (lokal albo usługodawca), kategoria lub rodzaj lokalu, miejscowość z podpowiedzi, opis, cena od, pojemność dla lokalu albo zasięg dojazdu dla usługodawcy, okazje, dane kontaktowe.
3. Zapis po każdym kroku. Powrót do kreatora otwiera ostatni niedokończony krok.
4. Krok „Cena i okres” pokazuje kwotę z cennika dla kategorii głównej i informację o trzydziestu dniach próby. Niczego nie pobiera.
5. Przycisk „Wyślij do zatwierdzenia”. Profil czeka na moderatora, firma widzi ten stan w panelu.
6. Slug nadawany raz i niezmienny, zgodnie z decyzją 005.
7. Testy: szkic niewidoczny dla anonima, klienta i innej firmy, widoczny dla właściciela, niezmienność sluga.

**Nie wchodzi:**
1. Zdjęcia (to Z11).
2. Kalendarz dostępności.
3. Weryfikacja NIP i SMS. Moderator zatwierdza ręcznie w Z05.
4. Kilka profili na jedno konto.
5. Płatność.
6. Edycja profilu już opublikowanego poza tym, co daje istniejące `zaktualizujProfil`.

**Ryzyka:** szkic dostępny pod `/f/[slug]` przez odgadnięcie adresu, różnica między odpowiedzią „nie istnieje” a „istnieje, ale ukryty”, dwa szkice z tym samym slugiem przy jednoczesnym zapisie.

---

## Z05. Moderator zatwierdza firmy

**Zadanie:** właściciel serwisu widzi listę profili czekających na zatwierdzenie i jednym kliknięciem publikuje profil albo odsyła go z powodem.

**Rola:** moderator.

**Reguła biznesowa:** tylko konto z rolą `moderator` otwiera widok moderacji i wykonuje jego akcje. Każda inna rola dostaje odmowę, także przy bezpośrednim wywołaniu akcji.

**Skille:** `pionowy-plaster`, `migracja-bazy` dla dziennika decyzji.

**Przeczytaj najpierw:** `lib/permissions.ts`, `lib/auth/widz.ts`, `tests/permissions.test.ts`.

**Wchodzi:**
1. Trasa `/moderacja` w grupie `(panel)` z listą oczekujących profili i podglądem.
2. Akcje: zatwierdź (profil staje się `active`, startuje trzydzieści dni próby), odeślij z powodem (wraca do `draft`, firma widzi powód w panelu).
3. Dziennik decyzji moderatora: kto, co, kiedy, powód.
4. Skrypt nadający rolę moderatora wskazanemu adresowi, uruchamiany ręcznie przez właściciela.
5. Wiadomość e-mail do firmy po decyzji.
6. Testy: odmowa dla klienta i firmy na trasie i na akcji osobno, start próby dokładnie raz przy podwójnym kliknięciu.

**Nie wchodzi:**
1. Moderacja zleceń (to Z08).
2. Moderacja opinii i zdjęć.
3. Zawieszanie i blokowanie kont.
4. Statystyki.
5. Wnioski o przejęcie profilu.

**Ryzyka:** próba startująca dwa razy, akcja moderatora dostępna bez sprawdzenia roli po stronie serwera, powód odrzucenia widoczny publicznie.

---

## Z06. Katalog i profil czytają z bazy

**Zadanie:** listy lokali i usługodawców oraz strona profilu pokazują firmy zatwierdzone przez moderatora, a wyszukiwanie po promieniu działa na prawdziwych odległościach.

**Rola:** anonim, klient.

**Reguła biznesowa:** w katalogu jest wyłącznie firma w stanie `active` z trwającą próbą albo opłaconym abonamentem.

**Skille:** `pionowy-plaster`.

**Przeczytaj najpierw:** `content/ogloszenia.ts`, `lib/wyszukiwanie.ts`, `lib/wyszukiwanie-serwer.ts`, `lib/filtry.ts`, `lib/db/queries/firmy.ts`, `tests/indeksy.test.ts`.

**Wchodzi:**
1. Zapytania listy z filtrami z adresu: rodzaj lub kategoria, miejscowość z promieniem liczona w PostGIS, liczba gości, okazja.
2. Podmiana źródła w `/lokale`, `/uslugodawcy`, ich stronach z parametrami i w `/f/[slug]`.
3. Stan pusty z przyciskiem „Dodaj zlecenie”.
4. Stronicowanie w adresie.
5. Usunięcie przykładowych lokali i usługodawców z `content/ogloszenia.ts`. Zlecenie i impreza przykładowa zostają do Z09.
6. Etykieta „Ogłoszenie przykładowe” znika razem z przykładami. Blokada indeksowania zostaje.
7. Testy: szkic i firma po wygasłej próbie poza listą, firma spoza promienia poza listą przy istniejącej firmie w promieniu.

**Nie wchodzi:**
1. Mapa. Decyzja z 3 października: mapy nie ma.
2. Sortowanie po ocenie i opinie.
3. Wyróżnienie planu Wyróżniony na liście.
4. Krótka lista ulubionych zapisywana na koncie.
5. Imprezy z bazy.
6. Włączenie indeksowania.

**Ryzyka:** zapytanie bez indeksu przestrzennego, liczenie odległości w JavaScripcie zamiast w bazie, dane kontaktowe firmy w odpowiedzi listy.

---

## Z07. Zapytanie do firmy

**Zadanie:** klient wysyła zapytanie z profilu firmy, firma dostaje je e-mailem i widzi w panelu, a klient widzi swoje zapytania w `/moje`.

**Rola:** klient, firma.

**Reguła biznesowa:** zapytanie widzi wyłącznie jego autor i firma, do której trafiło.

**Skille:** `pionowy-plaster`, `migracja-bazy`.

**Przeczytaj najpierw:** `app/(publiczne)/f/[slug]/zapytanie/page.tsx`, `lib/validators/formularze.ts` (`schematZapytania`), schemat tabeli `messages`.

**Wchodzi:**
1. Rozstrzygnięcie w planie: istniejąca tabela `messages` czy nowa tabela zapytań. Z uzasadnieniem.
2. Zapis zapytania z danymi wydarzenia: okazja, data, liczba gości, treść.
3. Wiadomość e-mail do firmy bez danych kontaktowych klienta w temacie.
4. Lista zapytań w panelu firmy i w `/moje`, obie ze stanem pustym.
5. Wymóg konta klienta. Niezalogowany przechodzi przez logowanie i wraca do wypełnionego formularza.
6. Limit zapytań na konto na dobę.
7. Testy: inna firma i inny klient nie widzą zapytania, limit działa.

**Nie wchodzi:**
1. Odpowiadanie w serwisie i wątki rozmów.
2. Załączniki.
3. Zapytanie do kilku firm naraz.
4. Powiadomienia SMS i push.
5. Rezerwacja terminu i zadatek. Decyzja 002.

**Ryzyka:** zapytanie do firmy w stanie szkicu, zalew zapytań z jednego konta, adres zapytania możliwy do odgadnięcia.

---

## Z08. Klient dodaje zlecenie, moderator je puszcza

**Zadanie:** klient opisuje wydarzenie w `/dodaj-zlecenie`, zlecenie czeka na moderację, a po akceptacji staje się otwarte.

**Rola:** klient, moderator.

**Reguła biznesowa:** zlecenie przed akceptacją moderatora widzi wyłącznie autor i moderator.

**Skille:** `pionowy-plaster`, `migracja-bazy`.

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

## Z09. Giełda z bazy i formularz oferty

**Zadanie:** lista zleceń i strona zlecenia czytają z bazy według reguły „co kto widzi”, a firma składa ofertę z poziomu strony.

**Rola:** anonim, firma, klient jako autor.

**Reguła biznesowa:** każda z czterech kolumn tabeli „co kto widzi” dostaje na ekranie dokładnie te pola, które jej przysługują, a firma bez prawa do oferty widzi ekran sprzedażowy z ceną swojego planu.

**Skille:** `pionowy-plaster`.

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

## Z10. Testy przeglądarkowe i zgłaszanie błędów

**Zadanie:** cztery główne ścieżki są sprawdzane w prawdziwej przeglądarce przy każdej zmianie, a błąd na produkcji trafia do właściciela.

**Rola:** właściciel serwisu.

**Reguła biznesowa:** zmiana, która psuje którąkolwiek z czterech ścieżek, nie przechodzi CI.

**Skille:** brak dedykowanego. Trzymaj się `CLAUDE.md`.

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

## Z11. Zdjęcia w profilu

**BLOKADA:** wybór magazynu plików przez właściciela (Supabase Storage albo Vercel Blob) i zgoda na zależność.

**Zadanie:** firma dodaje, porządkuje i usuwa zdjęcia profilu, a profil pokazuje galerię.

**Reguła biznesowa:** zdjęcia profilu w stanie szkicu nie są dostępne publicznie pod żadnym adresem.

**Skille:** `pionowy-plaster`, `migracja-bazy`.

**Wchodzi:** przesyłanie z limitem rozmiaru i typu, miniatury przez `next/image`, kolejność, zdjęcie główne, opis alternatywny, limit liczby zdjęć.

**Nie wchodzi:** wideo, wirtualny spacer, edycja zdjęć, moderacja zdjęć, import z zewnętrznych serwisów.

**Ryzyka:** publiczny adres pliku przed publikacją profilu, przesłanie pliku innego typu niż obraz, dane lokalizacji w metadanych zdjęcia.

---

## Z12. Płatności

**BLOKADA:** konta Stripe i Przelewy24, regulamin z warunkami płatności. Musi być gotowe przed końcem pierwszego okresu próbnego.

**Zadanie:** firma opłaca wybrany plan i okres, a abonament aktywuje się po potwierdzeniu od operatora.

**Reguła biznesowa:** to samo zdarzenie od operatora dostarczone trzy razy przedłuża abonament dokładnie raz.

**Skille:** `pionowy-plaster`, `migracja-bazy`.

**Przeczytaj najpierw:** sekcja „Webhooki płatności” w `CLAUDE.md`, tabela `payment_events`.

**Pokrój przez `/goal` przed startem.** To co najmniej trzy plastry: zamówienie i przekierowanie do operatora, webhook, stan abonamentu w panelu.

**Nie wchodzi:** faktury, zwroty, zmiana planu w trakcie okresu, kody rabatowe, automatyczne odnawianie.

---

## Z13. Otwarcie

**BLOKADA:** regulamin i polityka prywatności od prawnika, podpięta domena, co najmniej trzy zatwierdzone prawdziwe firmy.

**Zadanie:** serwis działa pod własną domeną, rejestracja jest otwarta, a wyszukiwarki mogą go indeksować.

**Wchodzi:**
1. Kroki z `docs/decyzje/008-co-zmienic-przy-podpieciu-domeny.md`.
2. Treść dokumentów prawnych wklejona przez właściciela w przygotowane strony.
3. Flaga `REJESTRACJA_OTWARTA` włączona.
4. Usunięcie ostatnich przykładów z `content/ogloszenia.ts`.
5. Włączenie indeksowania jednym przełącznikiem w `lib/indeksowanie.ts`. Test `tests/indeksowanie.test.ts` ma to potwierdzić.
6. `sitemap.xml` z profili z bazy.

**Nie wchodzi:** kampanie, import sześciuset firm, blog, aplikacja mobilna, wersje językowe.

---

## Pytania kontrolne po każdym zadaniu

Agent odpowiada na nie sam, w ostatniej wiadomości zadania:

1. Wynik `pnpm check` i `pnpm test --run`, wklejony, nie streszczony.
2. Lista zmienionych plików i po jednym zdaniu, po co każdy.
3. Którą regułę złamałem, żeby sprawdzić czułość testu, i które testy padły.
4. Co zrobiłem inaczej, niż sugeruje istniejący kod.
5. Jaki przypadek brzegowy nie jest pokryty testem.
6. Czy zmiana dotyka `lib/permissions.ts` albo endpointów zleceń.
7. Co właściciel musi zrobić ręcznie, żeby to zadziałało na produkcji.

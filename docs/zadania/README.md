# Zadania do otwarcia serwisu

Cel: prawdziwa firma zakłada konto, buduje profil i trafia do katalogu, a prawdziwy klient wysyła zapytanie i dodaje zlecenie.

Ten folder jest jedynym źródłem zadań. Każde zadanie to osobny plik, jedna sesja agenta i jedna gałąź `zadanie/ZNN-nazwa`.

## Jak zacząć zadanie

W VS Code wpisz w Claude Code: `/zadanie Z01` (numer zadania). Komenda uruchamia skill `realizacja-zadania`, który prowadzi przez całą procedurę.

## Kolejność i stan

| Nr | Zadanie | Zależy od | Stan |
|---|---|---|---|
| Z00 | [Produkcja gotowa na bazę](Z00-produkcja-gotowa-na-baze.md) | brak | w toku, wymaga poprawek |
| Z01 | [Nadawca poczty](Z01-nadawca-poczty.md) | Z00 | do zrobienia |
| Z02 | [Rejestracja i logowanie na ekranach](Z02-rejestracja-i-logowanie.md) | Z01 | do zrobienia |
| Z03 | [Abonament zgodny z cennikiem z 3 października](Z03-abonament-i-proba.md) | Z00 | do zrobienia |
| Z04 | [Kreator profilu firmy zapisuje do bazy](Z04-kreator-profilu.md) | Z02, Z03 | do zrobienia |
| Z05 | [Moderator zatwierdza firmy](Z05-moderacja-firm.md) | Z04 | do zrobienia |
| Z06 | [Katalog i profil czytają z bazy](Z06-katalog-z-bazy.md) | Z05 | do zrobienia |
| Z07 | [Zapytanie do firmy](Z07-zapytanie-do-firmy.md) | Z06 | do zrobienia |
| Z08 | [Klient dodaje zlecenie, moderator je puszcza](Z08-dodanie-zlecenia.md) | Z05 | do zrobienia |
| Z09 | [Giełda z bazy i formularz oferty](Z09-gielda-i-oferty.md) | Z08, Z03 | do zrobienia |
| Z10 | [Testy przeglądarkowe i zgłaszanie błędów](Z10-testy-przegladarkowe.md) | Z07, Z09 | do zrobienia |
| Z11 | [Zdjęcia w profilu](Z11-zdjecia.md) | Z04 | do zrobienia |
| Z12 | [Płatności](Z12-platnosci.md) | Z03 | do zrobienia |
| Z13 | [Otwarcie](Z13-otwarcie.md) | Z10 | do zrobienia |

Kamień A, firmy mogą wchodzić: Z00 do Z06.
Kamień B, klienci mogą wchodzić: Z07 do Z10.
Kamień C, serwis publiczny: Z13. Z11 i Z12 idą obok, Z12 przed końcem pierwszego okresu próbnego.

Agent po scaleniu zadania zmienia jego stan w tej tabeli i w nagłówku pliku zadania na `zrobione`.

## Narzędzia agenta

1. Skill `realizacja-zadania`: procedura każdego zadania od przeczytania pliku do pytań kontrolnych. Zawsze pierwszy.
2. Skill `pionowy-plaster`: kolejność od bazy do ekranu, trzy stany komponentu. Przy każdym zadaniu produktowym.
3. Skill `migracja-bazy`: każda zmiana schematu. Migracja i cofnięcie powstają razem.
4. Komenda `/goal`: gdy plan wychodzi powyżej piętnastu plików i trzeba pokroić zadanie.
5. `CLAUDE.md`: zasady i definicja ukończonego zadania. Obowiązuje w całości.
6. `docs/uprawnienia.md`: w całości przy każdym zadaniu dotykającym `requests`, `bids`, `subscriptions`.
7. `docs/decyzje/`: przed zmianą czegokolwiek, czego dotyczy decyzja.

## Zasady wspólne

1. Plan przed kodem. Kod dopiero po akceptacji planu przez właściciela.
2. Pole „Nie wchodzi” jest wiążące.
3. Zadanie z oznaczeniem BLOKADA nie rusza, dopóki właściciel nie dostarczy wskazanej rzeczy.
4. Żadnej zmyślonej treści. Brak danych oznacza brak sekcji.
5. Wygląd się nie zmienia. Kolory i typografia tylko z `docs/tokeny.md`.
6. Nawigacja to linki, formularze działają bez JavaScriptu, stan filtrów siedzi w adresie.
7. Mapy nie ma na żadnej stronie (decyzja z 3 października 2026).
8. Nowa zależność wymaga zgody właściciela.
9. Migracje wyłącznie na bazie lokalnej. Plików `.env*` agent nie czyta.
10. `lib/permissions.ts` zmienia się tylko wtedy, gdy zadanie wprost na to pozwala.
11. Regulaminu i polityki prywatności agent nie pisze.
12. Test na regułę biznesową ma sprawdzoną czułość.
13. Agent nie wypycha do `main`, nie merguje i nie robi force push.

## Testy, gdy Docker nie działa

Wariant zapasowy: agent wypycha gałąź, CI na GitHubie uruchamia migracje w przód, w tył i w przód oraz testy, a agent wkleja wynik z CI. Sprawdzenie czułości to osobny commit z celowo złamaną regułą, czerwone CI i cofnięcie kolejnym commitem.

## Decyzje właściciela, na które czekają zadania

1. Z03: limity ofert. Propozycja: Start 2 na miesiąc, 8 na pół roku, 15 na rok. Pełny i Wyróżniony z limitem tylko przy rozliczeniu miesięcznym (8 i 15), bez limitu od pół roku.
2. Z03: czy firma w okresie próbnym widzi pełne zlecenia i składa oferty, czy ma tylko widoczny profil.
3. Z03: co widać po wygaśnięciu próby: nic, czy goły wpis z „Przejmij profil”.
4. Z03: klasa cenowa a wielkość firmy (decyzja 009). Do czasu rozstrzygnięcia klasa wynika z kategorii.
5. Z11: magazyn plików, Supabase Storage albo Vercel Blob.
6. Z12: konta Stripe i Przelewy24.
7. Z13: regulamin i polityka prywatności od prawnika, domena, co najmniej trzy prawdziwe firmy.

## Pytania kontrolne po każdym zadaniu

Agent odpowiada na nie sam, w ostatniej wiadomości zadania:

1. Wynik `pnpm check` i `pnpm test --run`, wklejony, nie streszczony.
2. Lista zmienionych plików i po jednym zdaniu, po co każdy.
3. Którą regułę złamałem, żeby sprawdzić czułość testu, i które testy padły.
4. Co zrobiłem inaczej, niż sugeruje istniejący kod.
5. Jaki przypadek brzegowy nie jest pokryty testem.
6. Czy zmiana dotyka `lib/permissions.ts` albo endpointów zleceń.
7. Co właściciel musi zrobić ręcznie, żeby to zadziałało na produkcji.

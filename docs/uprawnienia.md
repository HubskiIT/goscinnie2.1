# Reguła "co kto widzi"

To jest najważniejszy dokument techniczny w projekcie. Cała wartość abonamentu
opiera się na jednej zasadzie: bez abonamentu nie zobaczysz szczegółów zlecenia
i nie złożysz oferty. Jeśli ta ściana przecieknie, przychód znika.

## Gdzie to żyje

Wyłącznie w `lib/permissions.ts`. Nigdzie indziej.

Reguła jest egzekwowana **na poziomie zapytania do bazy**, nie przez ukrywanie
pól w komponencie. Ukrycie w interfejsie przy jawnym API to żadne zabezpieczenie:
wystarczy, że ktoś otworzy narzędzia deweloperskie.

Praktycznie oznacza to, że zapytania o zlecenia nie zwracają pól, których
odbiorca nie ma prawa zobaczyć. Nie zwracają ich i potem filtrują, tylko
nie pobierają ich z bazy.

## Pełna tabela widoczności

| Pole zlecenia | Anonim i klient | Firma bez abonamentu | Firma z abonamentem | Autor zlecenia |
| --- | --- | --- | --- | --- |
| Rodzaj okazji | tak | tak | tak | tak |
| Data wydarzenia | tak | tak | tak | tak |
| Liczba osób | tak | tak | tak | tak |
| Lokalizacja | powiat | powiat | powiat + promień | dokładna |
| Opis własnymi słowami | nie | pierwsze 120 znaków | cały | cały |
| Budżet | nie | nie | tak | tak |
| Dane kontaktowe klienta | nie | nie | po `shortlist` | swoje |
| Liczba złożonych ofert | nie | nie | nie | tak |
| Ceny konkurencji | nie | nie | nie | tak |
| Treść ofert konkurencji | nie | nie | nie | tak |

## Autor zlecenia, pole po polu

Autor ma **najszerszy dostęp w całym systemie**, szerszy niż firma z abonamentem
i szerszy niż moderator. Tabela wyżej opisuje go jedną kolumną, co nie oddaje,
ile to naprawdę jest. Stąd ta sekcja.

| Pole | Co widzi autor | Uwaga |
| --- | --- | --- |
| Rodzaj okazji, data, liczba osób | wszystko | tak jak wszyscy |
| Lokalizacja | **dokładna** | miasto i współrzędne, nie powiat |
| Opis własnymi słowami | **cały** | bez obcinania |
| Budżet | **tak**, oba końce widełek | |
| Dane kontaktowe | **swoje**, zawsze | `shortlist` rozstrzyga o dostępie firmy, nie autora |
| Liczba złożonych ofert | **tak** | jedyny widz, który ją widzi |
| Ceny konkurencji | **tak** | ceny wszystkich ofert na jego zleceniu |
| Treść ofert | **tak** | pełna treść każdej oferty |
| Status zlecenia | **każdy** | widzi też własne zlecenia zamknięte i wygasłe |

Dwie rzeczy, które z tego wynikają i łatwo je przeoczyć:

1. **Autorstwo nie jest rolą, tylko relacją do konkretnego zlecenia.** Ten sam
   człowiek jest autorem swojego zlecenia i zwykłym klientem przy cudzym.
   Podniesienie klienta do autora dzieje się na poziomie pojedynczego zlecenia
   i tylko w jednym kierunku: z klienta na autora, nigdy odwrotnie i nigdy
   na firmę.
2. **Zalogowanie się samo w sobie niczego nie odsłania.** Zalogowany klient
   przy cudzym zleceniu widzi dokładnie tyle, co ktoś z ulicy. Jeśli kiedykolwiek
   zacznie widzieć więcej, to znaczy, że gdzieś uprawnienia wyprowadzono z faktu
   posiadania sesji, a nie z relacji do danych.

## Dlaczego firma nie widzi liczby ofert

To jest świadoma decyzja produktowa, nie przeoczenie. Gdyby firma widziała,
że jest dziewiąta w kolejce, nie złożyłaby oferty, a wartość abonamentu
spadłaby na jej oczach.

Nie "naprawiaj" tego, dodając licznik ofert do widoku firmy.

## Kody odpowiedzi

| Kod | Kiedy | Co robi front |
| --- | --- | --- |
| 402 | firma bez aktywnej subskrypcji prosi o szczegóły albo składa ofertę | ekran sprzedażowy z ceną planu dla kategorii tej firmy |
| 409 | firma już złożyła ofertę na to zlecenie | komunikat plus link do własnej oferty |
| 409 | zlecenie nie przyjmuje ofert: pełne, zamknięte albo wygasłe | jeden komunikat, bez rozróżnienia przyczyny |
| 429 | wyczerpany limit ofert w planie Start | propozycja podniesienia planu w tym samym ekranie |

Dwa różne 409 rozróżnia pole `powod` w treści odpowiedzi, ale **tylko przy
pierwszym**. Drugie zwraca zawsze tę samą treść, bo rozróżnienie „pełne”
od „zamknięte” oddałoby firmie liczbę ofert: wystarczyłoby próbować, aż
odpowiedź się zmieni.

Z tego samego powodu sprawdzenie limitu planu (429) idzie **przed** sprawdzeniem
stanu zlecenia. Przy odwrotnej kolejności firma na wyczerpanym limicie
dostawałaby raz 409, raz 429 w zależności od tego, czy zlecenie jest pełne,
i porównanie tych dwóch odpowiedzi znów zdradzałoby liczbę ofert.

402 i 429 to nie są błędy techniczne. To są dwa najważniejsze miejsca konwersji
w całym systemie i front ma je obsłużyć jak ekrany sprzedażowe.

## Odblokowanie kontaktu

Dane kontaktowe klienta stają się widoczne dla firmy dopiero, gdy klient doda
jej ofertę do krótkiej listy (`shortlist`). Jest to działanie klienta, nie firmy.

Do tego momentu filtr wiadomości maskuje numery telefonów, adresy e-mail i linki
w treści rozmowy, z komunikatem wyjaśniającym dlaczego. Maskuje, nie blokuje:
wiadomość dochodzi, tylko bez danych kontaktowych.

## Testy, które muszą istnieć

W `tests/permissions.test.ts`, rozszerzane przy każdej zmianie:

1. Anonimowe zapytanie do API zlecenia nie zwraca `description` ani `budget`.
2. Firma bez subskrypcji dostaje 402 przy próbie złożenia oferty.
3. Firma bez subskrypcji widzi najwyżej 120 znaków opisu.
4. Firma z subskrypcją nie widzi ofert innych firm na tym samym zleceniu.
5. Firma nie widzi pola z liczbą ofert.
6. Druga oferta tej samej firmy na to samo zlecenie daje 409.
7. Szesnasta oferta w planie Start daje 429.
8. Dane kontaktowe pojawiają się dopiero po `shortlist`.
9. Wygaśnięcie subskrypcji natychmiast przywraca ograniczenia.

Przypadki dopisane później. Numeracja idzie dalej i **nie jest przenumerowywana**,
bo odwołania do numerów siedzą w treści commitów.

Dotyczące autora i sesji:

10. Autor widzi własny opis i budżet w odpowiedzi API.
11. Zalogowany klient, który nie jest autorem, nie widzi opisu ani budżetu.
12. Odpowiedź dla anonima i dla zalogowanego obcego klienta jest identyczna.
13. Podrobione ciasteczko sesji nie podnosi widza do autora.
14. Autor widzi liczbę ofert na własnym zleceniu.

Dotyczące samej warstwy uprawnień:

15. Gałąź uprawnień, której nie zaimplementowano, rzuca wyjątkiem dla każdej
    funkcji w `lib/permissions.ts`.
16. Każde zapytanie w `lib/db/queries/requests.ts` odmawia widzowi, którego
    gałąź nie istnieje. Sprawdzane przez wyliczenie eksportów modułu, więc
    obejmuje też funkcje dopisane w przyszłości.

Dotyczące składania ofert:

21. Odpowiedź na próbę złożenia oferty na zlecenie pełne jest **identyczna
    co do bajtu** z odpowiedzią dla zlecenia zamkniętego i wygasłego.
22. Odmowa złożenia oferty nie zawiera żadnej liczby.
23. Firma na wyczerpanym limicie planu dostaje 429 niezależnie od stanu
    zlecenia, więc nie wnioskuje o liczbie ofert z różnicy kodów.
24. Dwie równoległe oferty przy jednym wolnym miejscu w planie dają jedno 201
    i jedno 429, a w bazie powstaje jeden wiersz, nie dwa.
25. Krótka lista odblokowuje kontakt wyłącznie firmie, której ofertę klient
    dodał. Druga firma na tym samym zleceniu nadal go nie ma.
26. Oferty dodanej do krótkiej listy nie da się już wycofać.
27. Firma nie może sama dodać swojej oferty do krótkiej listy.

Dotyczące publicznego profilu firmy:

28. Profil o statusie `draft` jest publicznie widoczny i zaprasza do przejęcia.
29. Profil o statusie `visitcard` jest widoczny, ale bez kalendarza dostępności.
30. Profil o statusie `suspended` zwraca **prawdziwe 404**, a jego nazwa
    nie pojawia się w treści odpowiedzi.
31. Profil zawieszony i nieistniejący dają ten sam wynik.
32. Żaden status profilu nie odsłania danych kontaktowych firmy.
33. Zalogowany obcy widzi na profilu dokładnie to samo co anonim.
34. Członkowi firmy nie proponujemy przejęcia jej własnego profilu.

Dotyczące przejęcia profilu i edycji:

35. Zgłoszenie przejęcia wymaga zalogowania.
36. Zgłoszenie **nie zakłada członkostwa** i nie zmienia statusu firmy.
37. Człowiek z oczekującym wnioskiem dostaje przy edycji dokładnie tę samą
    odpowiedź, co zupełnie obcy, co do bajtu.
38. Drugi wniosek tej samej osoby do tej samej firmy daje 409.
39. Dwa wnioski od różnych osób do tej samej firmy zapisują się oba.
40. Edytować profil może wyłącznie członek tej firmy.
41. Członek jednej firmy nie może edytować innej.
42. Zdjęcie kategorii archiwizuje przypisanie, nie usuwa wiersza.

Dotyczące logowania:

17. W kolumnie z hasłem leży skrót argon2id, nie hasło i nie skrót scrypt.
18. Limit prób logowania działa po koncie, niezależnie od adresu IP.
19. Blokada po przekroczeniu limitu wygląda tak samo dla konta istniejącego
    i nieistniejącego.
20. Reset hasła kończy się tą samą odpowiedzią niezależnie od tego, czy konto
    o podanym adresie istnieje.

Każdy nowy endpoint dotykający `requests` albo `bids` dokłada tu przypadek.
Pull request, który dodaje taki endpoint bez testu, nie wchodzi.

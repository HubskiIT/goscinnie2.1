# Gościnnie

Katalog lokali i usługodawców na każdą okazję plus anonimowa giełda zleceń.
Przychód: roczny abonament firm. Klient nie płaci nigdy i za nic.

## Polecenia

```bash
pnpm dev                 # aplikacja na localhost:3000
pnpm build               # budowanie produkcyjne
pnpm lint                # Biome, format i lint
pnpm check               # plik blokady + lint + tsc, to samo co CI
pnpm dane:pobierz        # TERYT (GUS) i PRNG (GUGiK) do scripts/dane/
pnpm dane:miejscowosci   # buduje content/miejscowosci.json.gz z pobranych danych
```

Przed każdym commitem uruchamiam `pnpm check`. Jeśli nie przechodzi, nie commituję.

## Struktura

```
app/                  trasy Next.js (App Router)
components/           komponenty UI
  screens/            ekrany przenoszone na trasy w Etapie 1
lib/                  funkcje pomocnicze
hooks/                hooki Reacta
docs/                 decyzje i kontekst, czytane na żądanie
```

Stan na Etap 0: nie ma jeszcze bazy, logowania, testów ani prawdziwych danych.
Zasady poniżej dotyczące bazy, uprawnień i migracji obowiązują od Etapu 6, gdy
wejdzie zaplecze. Do tego czasu są kontraktem, nie opisem istniejącego kodu.
Układ `lib/db/`, `lib/permissions.ts`, `drizzle/`, `tests/` i `e2e/` przenosimy
wtedy z repozytorium `goscinnie`.

## Zasady, których złamanie jest błędem

1. **TypeScript strict.** Żadnego `any`, żadnego `@ts-ignore`. Lint to blokuje.
2. **Zmiana schematu tylko przez migrację.** Każda migracja ma działające cofnięcie.
   Migracja w przód to `drizzle/NNNN_nazwa.sql`, cofnięcie to
   `drizzle/down/NNNN_nazwa.down.sql` pod tą samą nazwą. Runner odmawia cofnięcia
   migracji, która nie ma pliku cofnięcia, a CI uruchamia sekwencję w przód,
   w tył i znowu w przód przy każdym PR.
3. **Cały SQL w `lib/db/queries/`.** Komponenty nie odpytują bazy bezpośrednio.
4. **Walidacja Zod na każdej granicy:** formularz, akcja serwerowa, API, webhook.
5. **Żadnego twardego usuwania danych biznesowych.** Nic, co dotyczy firm,
   klientów, zleceń, ofert, opinii ani rozliczeń, nie znika z bazy. Usunięcie
   konta to anonimizacja, wygaśnięcie abonamentu to zejście do wizytówki.

   Jedyny dozwolony `DELETE` w całym projekcie to czyszczenie wpisu w
   `_migracje` przez runner migracji przy cofaniu. To dziennik techniczny,
   nie dane. Każdy inny `DELETE` lub `DROP` w kodzie aplikacji jest błędem
   i nie stanowi precedensu.
6. **Nowa zależność wymaga mojej zgody.** Zaproponuj i poczekaj, nie instaluj.
   Wersje zapinamy dokładnie, bez `^` i `~`, a po każdej zmianie w zależnościach
   przeliczamy `pnpm-lock.yaml`. Rozjazd między nim a `package.json` przechodzi
   lokalnie i zatrzymuje wdrożenie, bo CI i Vercel instalują z `--frozen-lockfile`.
   Pilnuje tego pierwszy krok `pnpm check`.
7. **Kolory i typografia tylko z tokenów** z `docs/tokeny.md`. Nie wymyślaj wartości hex.
8. **Kod czytelny ponad sprytny.** Ten projekt może przejąć człowiek. Konwencjonalne rozwiązanie wygrywa z eleganckim.

## Reguła "co kto widzi", najważniejsza rzecz w tym projekcie

Cała wartość abonamentu opiera się na tym, że bez niego nie zobaczysz szczegółów
zlecenia i nie złożysz oferty. Wyciek tych danych kasuje model przychodowy.

| Pole zlecenia | Anonim i klient | Firma bez abonamentu | Firma z abonamentem | Autor |
| --- | --- | --- | --- | --- |
| Rodzaj okazji, data, liczba osób | tak | tak | tak | tak |
| Lokalizacja | powiat | powiat | powiat + promień | dokładna |
| Opis własnymi słowami | nie | pierwsze 120 znaków | cały | cały |
| Budżet | nie | nie | tak | tak |
| Dane kontaktowe klienta | nie | nie | po `shortlist` | swoje |
| Liczba złożonych ofert | nie | nie | nie | tak |
| Ceny konkurencji | nie | nie | nie | tak |

Egzekwowanie:

- Reguła żyje **wyłącznie** w `lib/permissions.ts` i jest stosowana na poziomie
  zapytania do bazy, nie przez ukrywanie pól w komponencie.
- Każdy nowy endpoint albo akcja dotykająca `requests` lub `bids` przechodzi przez
  tę warstwę. Nie ma wyjątków i nie ma "tymczasowo bez sprawdzania".
- Testy `tests/permissions.test.ts` muszą zostać rozszerzone o każdy nowy przypadek.
- **Każda funkcja zapytania w `lib/db/queries/` przyjmuje widza jako pierwszy
  argument** i odmawia, zanim dotknie pozostałych. Konwencji pilnuje
  `tests/konwencja-zapytan.test.ts`, który wylicza eksporty modułu i sprawdza
  każdy z osobna. Funkcja poza wzorcem wywali ten test i to jest poprawny wynik:
  znaczy, że ktoś wyszedł poza konwencję i trzeba to omówić, a nie przemycić.
- Gałąź uprawnień, której jeszcze nie napisano, **rzuca wyjątkiem**. Nie zwraca
  pustego obiektu, nie zwraca pełnych danych, nie przechodzi dalej. Domyślna
  odmowa od pierwszej linii, nie domyślne przepuszczenie.

## Kody HTTP, które niosą logikę biznesową

- `402` — treść za abonamentem. Front pokazuje ekran sprzedażowy z ceną planu dla
  kategorii tej firmy, nigdy ogólnego błędu.
- `409` — firma już złożyła ofertę na to zlecenie. Jedna firma, jedna oferta.
- `429` — wyczerpany limit ofert w planie Start. Front prowadzi do podniesienia planu.

To są dwa najważniejsze miejsca konwersji w całym systemie. Nie traktuj ich jak błędy.

## Webhooki płatności

Operator wyśle to samo zdarzenie kilka razy. Obsługa musi być idempotentna:

1. Identyfikator zdarzenia od operatora trafia do tabeli z ograniczeniem unikalności.
2. Cała obsługa dzieje się w jednej transakcji.
3. Duplikat kończy się bez efektu i zwraca 200.

Trzy dostarczenia tego samego zdarzenia nie mogą dać trzech lat abonamentu.

## Definicja ukończonego zadania

Zadanie jest gotowe, gdy ma komplet:

- [ ] migracja z cofnięciem, jeśli dotyczy schematu
- [ ] zapytania w `lib/db/queries/` z typami
- [ ] schemat Zod dla wejścia
- [ ] akcja lub endpoint z kontrolą uprawnień przez `lib/permissions.ts`
- [ ] komponent **ze stanem pustym i stanem błędu**
- [ ] test integracyjny na regułę biznesową tego zadania
- [ ] dane zasiewowe pokrywające nowy przypadek
- [ ] `pnpm check` przechodzi

Nie pisz "gotowe, powinno działać". Pokaż wynik uruchomienia testu.

**Test bez sprawdzonej czułości nie jest testem.** Po napisaniu testu na regułę
biznesową złam tę regułę w kodzie, uruchom zestaw i potwierdź, że test pada.
Potem przywróć kod. W podsumowaniu zadania napisz, co złamałeś i które testy
padły.

Test, który przechodzi zawsze, jest gorszy niż brak testu: kosztuje tyle samo
czasu przy każdym uruchomieniu, a daje fałszywe poczucie pokrycia.

**Przy kilku barierach sprawdzaj każdą osobno.** Gdy jedną regułę chroni więcej
niż jedna bariera, na każdą z nich ma przypadać test, który pada po zdjęciu
wyłącznie tej jednej. Test padający dopiero po zdjęciu wszystkich naraz dowodzi
tylko, że działa co najmniej jedna. Nadmiarowość, której nie da się sprawdzić,
znika przy pierwszym refaktorze i nikt tego nie zauważy.

**Bariera jest sprawdzalna tylko przy zasiewie ustawionym pod nią.** Scenariusz,
w którym o wyniku może rozstrzygnąć więcej niż jedno kryterium, nie dowodzi
niczego o żadnym z nich. Zasiew ma izolować barierę: pozostałe kryteria
ustawione tak, żeby wskazywały odwrotnie albo nie wskazywały wcale.

**Test negatywny wymaga instancji pozytywnej gdzie indziej.** Sprawdzając,
że podmiot X czegoś nie ma, zadbaj, żeby w bazie istniał podmiot Y, który
to ma. Inaczej "nigdzie nie ma" i "ten nie ma" dają ten sam wynik,
a nieskorelowane podzapytanie przechodzi.

**Gdy kilka niezależnych testów pada w losowych miejscach, przyczyną jest stan
dzielony, nie żaden z tych testów.** Przestań poprawiać testy po drugiej
nieudanej próbie i poszukaj stanu, który zestaw dziedziczy po sobie. Poprawki
w pojedynczych testach bywają wtedy sensowne i wszystkie nieskuteczne, bo
naprawiają objaw w miejscu, w którym nie ma przyczyny.

**Automatyczna podmiana tekstu, która nie znalazła dopasowania, jest błędem,
nie brakiem zmian.** Każde narzędzie zmieniające tekst w plikach ma zgłaszać
zero dopasowań jako niepowodzenie. Cisza po zmianie znaczy, że zmiany nie było.

**Zasiew musi zawierać podmioty pełniące kilka ról naraz.** Właściciel sali,
który organizuje komunię córki, jest jednocześnie firmą i klientem. Dopóki
zbiory ról w zasiewie się nie przecinają, cała klasa błędów w rozpoznawaniu
widza jest niewidoczna.

**Testy mają korzystać z danych zasiewowych, nie tylko je tworzyć.** Co najmniej
jeden test na każdą istotną encję działa na rekordzie z zasiewu, a nie na
utworzonym przez sam test. Test, który buduje stan własną ścieżką, jest ślepy
na błędy zasiewu, a z zasiewu korzystasz przy każdej pracy ręcznej.

## Czego nie robisz bez pytania

- Nie zmieniasz `lib/permissions.ts` bez wyraźnego polecenia.
- Nie piszesz własnej obsługi sesji ani haszowania haseł. Biblioteka.
- Nie generujesz regulaminu ani polityki prywatności.
- Nie uruchamiasz migracji na bazie innej niż lokalna.
- Nie dodajesz analityki, telemetrii ani zewnętrznych skryptów.

## Kontekst na żądanie

Nie wczytuję tego domyślnie. Sięgnij, gdy zadanie tego dotyczy:

- `docs/schemat.md` — pełny model danych i uzasadnienia
- `docs/uprawnienia.md` — rozwinięcie reguły "co kto widzi"
- `docs/tokeny.md` — kolory, typografia, odstępy z projektu
- `docs/decyzje/` — dlaczego tak, a nie inaczej

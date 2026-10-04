# Model danych

Pełny model z uzasadnieniami. Aktualizowany przy każdej migracji — tak mówi
skill `migracja-bazy` i to jest twardy wymóg, nie zalecenie.

Zasady przekrojowe, obowiązujące każdą tabelę:

- Klucz główny: `uuid`, generowany w bazie przez `gen_random_uuid()`.
- Znaczniki czasu: **zawsze** `timestamptz`. Data kalendarzowa bez godziny
  (data wydarzenia, dzień dostępności) jako `date`. Polska ma zmianę czasu
  i mieszanie tych typów daje błąd raz na pół roku.
- Każda tabela ma `created_at` i `updated_at`.
- **Nic nie znika.** Zamiast `DELETE` jest zmiana `status` albo `archived_at`.
  Usunięcie konta z RODO to anonimizacja (`users.anonymized_at`), nie kaskada.
- Nazwy kolumn w bazie: `snake_case`. Drizzle robi to automatycznie (`casing`).

---

## Obszar: tożsamość

### `users`

Konto człowieka. Jedno konto może być klientem i jednocześnie właścicielem firmy,
dlatego rola nie jest tu jedynym wyznacznikiem uprawnień.

| Kolumna | Typ | Uwagi |
| --- | --- | --- |
| `id` | uuid PK | |
| `email` | text | unikalny, niepusty |
| `name` | text | |
| `phone` | text | null dopóki nie poda |
| `role` | enum `user_role` | `client`, `company_owner`, `moderator` |
| `status` | enum `user_status` | `active`, `suspended`, `anonymized` |
| `anonymized_at` | timestamptz | ustawione = konto wyczyszczone z danych osobowych |

Dodatkowo, wymagane przez better-auth: `email_verified` (boolean, domyślnie
fałsz) i `image`. Potwierdzanie adresu wejdzie razem z wysyłką poczty.

Hasła i sesje **nie są** przechowywane w tej tabeli. Obsługuje je `better-auth`
w tabelach opisanych niżej. Nie piszemy własnego haszowania ani obsługi sesji.

### `sessions`, `accounts`, `verifications`

Tabele better-auth, nazwane po naszemu w liczbie mnogiej. Kolumny narzuca
biblioteka i nie zmieniamy ich nazw.

| Tabela | Po co |
| --- | --- |
| `sessions` | aktywne sesje: `token` unikalny, `expires_at`, adres IP, przeglądarka |
| `accounts` | poświadczenia; przy logowaniu mailem `password` trzyma **skrót argon2id** |
| `verifications` | tokeny jednorazowe: reset hasła, w przyszłości potwierdzenie adresu |

Tożsamość człowieka żyje dalej w `users`. Nie zakładamy drugiej tabeli
użytkowników obok istniejącej: dwie tożsamości tego samego człowieka rozjeżdżają
się prędzej czy później, a rozjazd w tabeli kont kończy się utratą dostępu.

Parametry argon2id (19 MiB pamięci, dwa przebiegi, równoległość 1) siedzą
w `lib/auth/index.ts`. Pamięć jest tam ważniejsza od liczby przebiegów, bo to
ona psuje opłacalność łamania na kartach graficznych.

### `rate_limits`

Licznik prób w oknie czasowym, wspólny dla obu limitów logowania.

| Kolumna | Typ | Uwagi |
| --- | --- | --- |
| `key` | text | **UNIQUE**, np. `logowanie:ip:203.0.113.7`, `logowanie:konto:ktos@...` |
| `count` | integer | liczba prób w bieżącym oknie |
| `window_start` | timestamptz | początek okna, przesuwany przy pierwszej próbie po wygaśnięciu |

Dwa limity, bo chronią przed dwiema różnymi rzeczami. Limit po IP zatrzymuje
kogoś, kto próbuje wielu haseł z jednej maszyny. Limit po koncie zatrzymuje atak
rozproszony na jedno konto, gdzie każde żądanie idzie z innego adresu. Sam limit
po IP tego drugiego nie łapie.

Zliczanie dzieje się jedną instrukcją z `on conflict`, więc równoległe żądania
nie potrafią się nawzajem zgubić. Wierszy nie kasujemy: okno przesuwa się przez
nadpisanie `window_start`, a nie przez zniknięcie wiersza.

---

## Obszar: geografia

### `cities`

Miejscowości ze słownika. Powiat jest kolumną, nie osobną tabelą, bo do niczego
poza wyświetleniem i grupowaniem go nie potrzebujemy.

| Kolumna | Typ | Uwagi |
| --- | --- | --- |
| `id` | uuid PK | |
| `name` | text | np. „Żyrardów” |
| `slug` | text | unikalny, np. `zyrardow` |
| `powiat` | text | **kluczowe dla reguły „co kto widzi”** |
| `wojewodztwo` | text | |
| `point` | geography(Point,4326) | środek miejscowości |

Powiat jest tu, bo anonim i firma bez abonamentu widzą lokalizację zlecenia
**wyłącznie** z dokładnością do powiatu. To pole robi robotę biznesową.

Indeksy: GiST na `point`, GIN `pg_trgm` na `name` pod podpowiedzi w wyszukiwarce.

---

## Obszar: katalog

### `categories`

Rodzaj usługodawcy: sala, catering, fotograf, DJ, dekoracje, tort, transport.
Osobna tabela, bo do kategorii przypięta jest **cena planu** — nie ma jednego
cennika dla sali weselnej i dla DJ-a.

### `event_types`

Rodzaj okazji: wesele, komunia, chrzciny, urodziny, osiemnastka, stypa, event
firmowy, plener. Tabela, nie enum, bo decyzja 001 czyni z tego pierwszorzędny
wymiar produktu, a lista będzie rosła bez migracji schematu.

### `companies`

| Kolumna | Typ | Uwagi |
| --- | --- | --- |
| `id` | uuid PK | |
| `owner_user_id` | uuid FK → users | |
| `name` | text | |
| `slug` | text | unikalny |
| `city_id` | uuid FK → cities | |
| `point` | geography(Point,4326) | dokładna lokalizacja firmy, jawna |
| `description` | text | |
| `price_from` | integer | grosze; **wymagane do publikacji** |
| `capacity_min` / `capacity_max` | integer | null dla usług bez pojemności |
| `status` | enum `company_status` | `draft`, `active`, `visitcard`, `suspended` |

`visitcard` to stan po wygaśnięciu abonamentu: profil zostaje widoczny, ale
schodzi do wizytówki. Firma nie znika z katalogu — zgodnie z zakazem usuwania.

`price_from` jest `NOT NULL` dla statusu `active`, bo `docs/tokeny.md` zasada 2
mówi wprost: karta lokalu bez ceny nie przechodzi moderacji.

Indeksy wymagane: GiST na `point` (bez niego wyszukiwanie po promieniu zabije
bazę), `companies(city_id, status)` pod strony kategoria plus miasto, GIN
`pg_trgm` na `name`.

### `company_members`

Kto pracuje w której firmie. Osobna tabela, a nie kolumna w `users`, bo jeden
człowiek bywa w dwóch firmach: prowadzi salę i dorabia jako fotograf. Przy
kolumnie w `users` taki przypadek wymagałby drugiego konta, czyli drugiego hasła
i drugiej skrzynki na ten sam adres.

| Kolumna | Typ | Uwagi |
| --- | --- | --- |
| `company_id` | uuid FK → companies | |
| `user_id` | uuid FK → users | |
| `role` | enum `company_member_role` | `owner`, `member` |

Indeksy: unikalny `(company_id, user_id)` oraz `(user_id)` pod pytanie „do jakich
firm należy ten człowiek”, zadawane przy każdym żądaniu z sesją firmową.

`companies.owner_user_id` zostaje jako właściciel rozliczeniowy, ale **o dostępie
rozstrzyga ta tabela**, nie tamta kolumna i nie `users.role`.

#### Wybór firmy, gdy człowiek należy do kilku

Przełącznika firm w panelu jeszcze nie ma, więc `lib/auth/firma.ts` wybiera
za użytkownika, w tej kolejności: firma z aktywnym abonamentem, firma, w której
jest właścicielem, najstarsze członkostwo, identyfikator jako remis.

Pierwszy punkt nie jest kosmetyką. Bez niego człowiek zapisany dawniej do firmy
kolegi dostawał zajawkę zamiast pełnego opisu, mimo że jego druga firma ma
opłacony abonament. Płacił i nie widział, za co.

### `company_categories`

Tabela łącząca, klucz złożony `(company_id, category_id)`. Indeks
`(category_id, company_id)` pod listing kategorii — kolejność kolumn ma znaczenie.

Kolumna `archived_at`: zdjęcie kategorii z firmy ustawia tę datę, nie usuwa
wiersza. Przypisanie do kategorii jest daną biznesową, bo decyduje, gdzie firma
pojawia się w katalogu, więc obejmuje je zasada 5. Ponowne dodanie tej samej
kategorii zeruje datę (`on conflict do update`), a nie wstawia drugiego wiersza.

Podmiana zestawu kategorii dzieje się w jednej transakcji: najpierw archiwizacja
wszystkich, potem przywrócenie wybranych. Poza transakcją firma na moment
zniknęłaby z katalogu albo została w dwóch kategoriach naraz, a jedno i drugie
widać od razu w wyszukiwarce.

### `company_claims`

Wnioski o przejęcie profilu firmy.

| Kolumna | Typ | Uwagi |
| --- | --- | --- |
| `company_id` | uuid FK → companies | |
| `user_id` | uuid FK → users | |
| `status` | enum `claim_status` | `pending`, `approved`, `rejected` |
| `uzasadnienie` | text | czyta to człowiek przed decyzją |
| `rozpatrzono_o` | timestamptz | |

**Brak indeksu unikalnego na `(company_id, user_id)` jest zamierzony.** Dwa
zgłoszenia do tej samej firmy od różnych osób mają się zapisać, bo to sygnał
do sprawdzenia, a nie błąd. Odrzucony wnioskodawca też ma móc spróbować
ponownie, gdy dośle dowody.

Zgłoszenie **nie daje żadnego dostępu**. Dopiero zatwierdzenie przez
`scripts/przejecia.ts` zakłada członkostwo i wyprowadza firmę ze stanu `draft`,
wszystko w jednej transakcji. Do czasu weryfikacji po numerze NIP ręczne
zatwierdzanie jest jedyną rzeczą, która stoi między konkurencją zza rogu
a cudzym profilem.

### `availability`

`(company_id, date, status)`, unikalny indeks na `(company_id, date)`.
`date`, nie `timestamptz`: dostępność to dzień kalendarzowy.

---

## Obszar: abonament

### `plans`

| Kolumna | Typ | Uwagi |
| --- | --- | --- |
| `category_id` | uuid FK → categories | cena zależy od kategorii |
| `code` | enum `plan_code` | `start`, `pro` |
| `price_annual` | integer | grosze, rocznie |
| `bids_limit` | integer | null = bez limitu (`pro`) |

`bids_limit` w planie `start` jest źródłem kodu **429**. Piętnaście ofert
w okresie rozliczeniowym, szesnasta dostaje 429 i ekran podniesienia planu.

### `subscriptions`

| Kolumna | Typ | Uwagi |
| --- | --- | --- |
| `company_id` | uuid FK → companies | |
| `plan_id` | uuid FK → plans | |
| `status` | enum `subscription_status` | `active`, `expired`, `cancelled` |
| `starts_at` / `expires_at` | timestamptz | |

Abonament uznajemy za aktywny, gdy `status = 'active'` **i** `expires_at > now()`.
Oba warunki, zawsze.

Porównanie daty dzieje się **przy każdym żądaniu**, w `maAktywnyAbonament`,
a nie w zadaniu cyklicznym przestawiającym status. To jest świadoma decyzja:
zadanie cykliczne, które nie zadziała, zostawia firmę z dostępem, za który nie
płaci, i nikt się o tym nie dowie, dopóki ktoś nie porówna tabel ręcznie.
Porównanie daty przy żądaniu nie ma jak nie zadziałać.

`now()` liczy baza, nie Node, żeby moment wygaśnięcia nie zależał od tego,
który proces obsłużył żądanie.

Stan abonamentu jest celowo **oddzielony od płatności**. Warstwa uprawnień pyta
wyłącznie „aktywny czy nie”. Skąd ten stan się wziął, czy z przelewu, z okresu
próbnego, czy z ręcznego wpisu przez `scripts/abonament.ts`, jest jej obojętne.
Dzięki temu reguła „co kto widzi” nie czeka na operatora płatności.

### `payment_events`

Idempotencja webhooków. Sedno: `provider_event_id` ma **ograniczenie unikalności**.

| Kolumna | Typ | Uwagi |
| --- | --- | --- |
| `provider_event_id` | text | **UNIQUE**, identyfikator od operatora |
| `payload` | jsonb | surowe zdarzenie, do wglądu przy sporze |
| `processed_at` | timestamptz | |

Cała obsługa w jednej transakcji. Duplikat kończy się bez efektu i zwraca 200.
Trzy dostarczenia tego samego zdarzenia nie mogą dać trzech lat abonamentu.

---

## Obszar: giełda zleceń

To jest obszar, w którym mieszka cała wartość abonamentu. Każda kolumna tutaj
ma przypisany wiersz w tabeli widoczności w `docs/uprawnienia.md`.

### `requests`

| Kolumna | Typ | Widoczność |
| --- | --- | --- |
| `id` | uuid PK | |
| `author_user_id` | uuid FK → users | tylko autor |
| `event_type_id` | uuid FK → event_types | **wszyscy** |
| `event_date` | date | **wszyscy** |
| `guests` | integer | **wszyscy** |
| `city_id` | uuid FK → cities | dokładna: autor. Powiat: reszta |
| `point` | geography(Point,4326) | dokładna: autor. Promień: abonent |
| `description` | text | nie: anonim. 120 znaków: firma bez. Cały: abonent |
| `budget_min` / `budget_max` | integer | grosze; **tylko abonent i autor** |
| `status` | enum `request_status` | `open`, `closed`, `expired`, `archived` |
| `expires_at` | timestamptz | |

Liczby ofert **nie ma w tej tabeli jako kolumny licznika**. Jest wyliczana
zapytaniem i zwracana wyłącznie autorowi. Gdyby stała się kolumną, wyciekłaby
pierwszym `select *`.

### `bids`

| Kolumna | Typ | Uwagi |
| --- | --- | --- |
| `request_id` | uuid FK → requests | |
| `company_id` | uuid FK → companies | |
| `price` | integer | grosze |
| `message` | text | |
| `status` | enum `bid_status` | `sent`, `shortlisted`, `rejected`, `withdrawn` |

**Unikalny indeks `(request_id, company_id)`** — jedna firma, jedna oferta.
To ograniczenie w bazie jest źródłem kodu **409**. Nie sprawdzamy tego tylko
w kodzie aplikacji, bo dwa równoległe żądania przejdą taki warunek.

Wycofanie oferty to `status = 'withdrawn'`, nie usunięcie wiersza. Możliwe do
momentu, w którym klient doda ofertę do krótkiej listy: potem klient podjął już
decyzję i zaczął rozmowę, a znikająca oferta zostawiłaby go z rozmową bez treści.

Indeks `bids(company_id, created_at)` obsługuje liczenie ofert firmy w bieżącym
okresie abonamentowym. **Licznik wyliczamy z wierszy przy każdym żądaniu,
nie trzymamy go w kolumnie.** Kolumna `bids_used` rozjechałaby się
z rzeczywistością przy pierwszym wycofaniu oferty albo przerwanej transakcji.
Wiersze są prawdą, licznik byłby jej kopią.

Okres liczy się od `subscriptions.starts_at`, nie od stycznia. Odnowienie
abonamentu zeruje licznik, bo firma kupiła nowy okres. Oferty wycofane nie liczą
się do limitu: firma, która się rozmyśliła, nie powinna płacić za to miejscem
w planie.

Sprawdzenie limitu i zapis oferty dzieją się w jednej transakcji, z blokadą
wiersza subskrypcji (`select ... for update`). Bez niej dwie oferty złożone
w tej samej sekundzie przy stanie 14 z 15 obie przeszłyby sprawdzenie i obie
by się zapisały. To ta sama klasa błędu co przy idempotencji webhooków.

Maksymalnie **dziesięć** ofert na jedno zlecenie. Limit jest po stronie klienta,
nie firmy: tyle człowiek jest w stanie porównać.

### `shortlist`

Wpis powstaje, gdy **klient** doda ofertę do krótkiej listy. Dopiero istnienie
tego wiersza odsłania firmie dane kontaktowe klienta. Jest to działanie klienta,
nigdy firmy — i dlatego to osobna tabela, a nie flaga na `bids`, którą łatwo
ustawić niechcący w akcji po stronie firmy.

### `messages`

Rozmowa klient–firma w obrębie zlecenia. Kolumna `body` trzyma treść oryginalną,
`body_masked` treść z zamaskowanymi numerami telefonu, adresami e-mail i linkami.
Przed `shortlist` firma dostaje `body_masked`.

Maskujemy, nie blokujemy: wiadomość dochodzi, tylko bez danych kontaktowych,
z komunikatem wyjaśniającym dlaczego.

---

## Czego w tym modelu celowo nie ma

- **Żadnej tabeli płatności klienta.** Decyzja 002: nie trzymamy zadatku.
  Nie dodawaj jej, nawet jeśli wygląda na naturalne uzupełnienie.
- **Żadnego licznika ofert widocznego dla firmy.** Decyzja produktowa
  z `docs/uprawnienia.md`, nie przeoczenie.
- **Żadnej tabeli analityki ani zdarzeń śledzących.** CLAUDE.md zabrania.

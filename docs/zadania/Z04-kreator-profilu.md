# Z04. Kreator profilu firmy zapisuje do bazy

**Status:** do zrobienia

**Zadanie:** zalogowana firma buduje profil krok po kroku, może przerwać i wrócić, a na końcu wysyła go do zatwierdzenia.

**Rola:** firma.

**Reguła biznesowa:** profil w stanie szkicu widzi wyłącznie jego właściciel i moderator. Nikt inny nie dostaje go ani w katalogu, ani pod bezpośrednim adresem.

**Skille:** `realizacja-zadania`, `pionowy-plaster`, `migracja-bazy` jeśli brakuje kolumn.

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

Po zakończeniu odpowiedz na pytania kontrolne z `docs/zadania/README.md`.

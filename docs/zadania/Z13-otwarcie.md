# Z13. Otwarcie

**Status:** do zrobienia

**BLOKADA:** regulamin i polityka prywatności od prawnika, podpięta domena, co najmniej trzy zatwierdzone prawdziwe firmy.

**Skille:** `realizacja-zadania`, przy zmianie schematu `migracja-bazy`.

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

Po zakończeniu odpowiedz na pytania kontrolne z `docs/zadania/README.md`.

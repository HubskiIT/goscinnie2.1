# Z07. Zapytanie do firmy

**Status:** do zrobienia

**Zadanie:** klient wysyła zapytanie z profilu firmy, firma dostaje je e-mailem i widzi w panelu, a klient widzi swoje zapytania w `/moje`.

**Rola:** klient, firma.

**Reguła biznesowa:** zapytanie widzi wyłącznie jego autor i firma, do której trafiło.

**Skille:** `realizacja-zadania`, `pionowy-plaster`, `migracja-bazy`.

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

Po zakończeniu odpowiedz na pytania kontrolne z `docs/zadania/README.md`.

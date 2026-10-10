# Z05. Moderator zatwierdza firmy

**Status:** do zrobienia

**Zadanie:** właściciel serwisu widzi listę profili czekających na zatwierdzenie i jednym kliknięciem publikuje profil albo odsyła go z powodem.

**Rola:** moderator.

**Reguła biznesowa:** tylko konto z rolą `moderator` otwiera widok moderacji i wykonuje jego akcje. Każda inna rola dostaje odmowę, także przy bezpośrednim wywołaniu akcji.

**Skille:** `realizacja-zadania`, `pionowy-plaster`, `migracja-bazy` dla dziennika decyzji.

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

Po zakończeniu odpowiedz na pytania kontrolne z `docs/zadania/README.md`.

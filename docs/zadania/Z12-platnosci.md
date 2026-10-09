# Z12. Płatności

**Status:** do zrobienia

**BLOKADA:** konta Stripe i Przelewy24, regulamin z warunkami płatności. Musi być gotowe przed końcem pierwszego okresu próbnego.

**Zadanie:** firma opłaca wybrany plan i okres, a abonament aktywuje się po potwierdzeniu od operatora.

**Reguła biznesowa:** to samo zdarzenie od operatora dostarczone trzy razy przedłuża abonament dokładnie raz.

**Skille:** `realizacja-zadania`, `pionowy-plaster`, `migracja-bazy`.

**Przeczytaj najpierw:** sekcja „Webhooki płatności” w `CLAUDE.md`, tabela `payment_events`.

**Pokrój przez `/goal` przed startem.** To co najmniej trzy plastry: zamówienie i przekierowanie do operatora, webhook, stan abonamentu w panelu.

**Nie wchodzi:** faktury, zwroty, zmiana planu w trakcie okresu, kody rabatowe, automatyczne odnawianie.

---

Po zakończeniu odpowiedz na pytania kontrolne z `docs/zadania/README.md`.

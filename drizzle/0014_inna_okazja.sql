-- Okazja wpisana przez klienta własnymi słowami.
--
-- PO CO. Słownik okazji ma jedenaście pozycji i nie obejmuje wszystkiego,
-- po co ludzie wynajmują salę: chrzciny psa, zjazd rocznika, obrona pracy,
-- parapetówka. Dotąd taki klient wybierał najbliższą pozycję z listy albo
-- nie wystawiał zlecenia wcale. Pierwsze zaśmieca filtry firmom, drugie
-- kosztuje zlecenie.
--
-- DLACZEGO OSOBNA KOLUMNA, A NIE WIERSZ W `event_types` NA KAŻDY WPIS.
-- Gdyby każda wpisana nazwa zakładała wiersz słownika, po miesiącu byłoby
-- tam trzysta pozycji z literówkami i odmianami tego samego („urodziny 40”,
-- „40 urodziny”, „czterdziestka”), a filtr okazji w katalogu przestałby
-- cokolwiek znaczyć. Słownik zostaje zamknięty i pilnowany ręcznie.
--
-- `event_type_id` dalej jest `not null` i dalej wskazuje prawdziwy wiersz,
-- tyle że wiersz `inna`. Dzięki temu nie trzeba rozluźniać klucza obcego
-- ani dopisywać gałęzi „a jeśli okazji nie ma” do pięciu zapytań, które
-- dziś robią `inner join`.
--
-- SPÓJNOŚĆ MIĘDZY KOLUMNAMI pilnuje `utworzZlecenie`, nie baza. Warunek
-- „własna nazwa istnieje dokładnie wtedy, gdy okazja to `inna`” sięga przez
-- klucz obcy do drugiej tabeli, a tego CHECK w Postgresie nie potrafi;
-- wymagałby wyzwalacza. Wyzwalacz na jedną regułę przy jednej ścieżce
-- zapisu to więcej kodu w miejscu, w którym nikt go nie szuka, niż warta
-- jest ta gwarancja. CHECK niżej pilnuje tego, co da się sprawdzić na
-- miejscu: kształtu samej wartości.

ALTER TABLE "requests" ADD COLUMN "custom_event_name" text;--> statement-breakpoint

-- Pusty napis i napis z samych spacji to nie są nazwy okazji. Bez tego
-- warunku „nie podano” miałoby w bazie dwie postacie, NULL i '', a każde
-- pytanie o własną nazwę musiałoby sprawdzać obie.
ALTER TABLE "requests" ADD CONSTRAINT "requests_custom_event_name_sensowna"
  CHECK (
    "custom_event_name" IS NULL
    OR (
      btrim("custom_event_name") = "custom_event_name"
      AND char_length("custom_event_name") BETWEEN 3 AND 60
    )
  );--> statement-breakpoint

-- Wiersz słownika, na który wskazują zlecenia z własną nazwą.
--
-- Wstawiany migracją, a nie zasiewem, bo bez niego kolumna wyżej nie ma
-- jak zadziałać na bazie produkcyjnej: `utworzZlecenie` szuka okazji po
-- slugu i odmawia, gdy jej nie znajdzie. `on conflict do nothing` sprawia,
-- że powtórzone uruchomienie niczego nie psuje.
INSERT INTO "event_types" ("slug", "name")
VALUES ('inna', 'Inna okazja')
ON CONFLICT ("slug") DO NOTHING;

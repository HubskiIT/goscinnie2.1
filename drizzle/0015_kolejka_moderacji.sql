-- Kolejka moderacji: wpisy czekające na decyzję właściciela serwisu.
--
-- PO CO. Katalog i giełda przyjmują dziś wszystko, co ktoś wpisze, od razu
-- i bez spojrzenia. Przy kilkunastu wpisach to nie problem, przy kilkuset
-- jest nim pierwszego dnia: firma widmo, zlecenie z numerem telefonu
-- w opisie, impreza, której nie ma.
--
-- DLACZEGO OSOBNA TABELA, A NIE STATUS W KAŻDEJ Z TABEL. Pełne uzasadnienie
-- siedzi w lib/db/schema/moderacja.ts, w nagłówku tabeli. W skrócie trzy
-- rzeczy: `companies.status` ma już cztery znaczenia i żadne nie brzmi
-- „czeka na akceptację”, usuwanie wartości z typu wyliczeniowego przy
-- cofaniu jest nieproporcjonalnie drogie, a zmiana w opublikowanym wpisie
-- nie ma gdzie usiąść jako stan obiektu, bo obiekt jest opublikowany
-- i ma taki zostać.

CREATE TYPE "moderation_subject" AS ENUM ('company', 'company_change', 'event', 'request');--> statement-breakpoint
CREATE TYPE "moderation_status" AS ENUM ('pending', 'approved', 'rejected');--> statement-breakpoint

CREATE TABLE "moderation_submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subject_kind" "moderation_subject" NOT NULL,
  "subject_id" uuid NOT NULL,
  "status" "moderation_status" DEFAULT 'pending' NOT NULL,
  "decided_by_user_id" uuid,
  "decided_at" timestamp with time zone,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "moderation_submissions"
  ADD CONSTRAINT "moderation_submissions_decided_by_user_id_users_id_fk"
  FOREIGN KEY ("decided_by_user_id") REFERENCES "users"("id");--> statement-breakpoint

-- Rozstrzygnięcie ma datę, oczekiwanie jej nie ma.
--
-- Moderator może być pusty i to jest celowe: decyzję podejmuje zwykle
-- człowiek, ale wiersze uzupełnione przy wdrożeniu tej migracji nie mają
-- autora, bo nikt ich nie przeglądał. Pusty autor znaczy „zastane, nie
-- rozpatrzone”, a panel pokazuje to wprost, zamiast podpisywać cudzym
-- nazwiskiem decyzję, której nikt nie podjął.
ALTER TABLE "moderation_submissions"
  ADD CONSTRAINT "moderation_submissions_decyzja_ma_date"
  CHECK (
    ("status" = 'pending' AND "decided_at" IS NULL AND "decided_by_user_id" IS NULL)
    OR ("status" <> 'pending' AND "decided_at" IS NOT NULL)
  );--> statement-breakpoint

-- Powód należy do odmowy. Przy zgodzie nie ma czego uzasadniać, a pole
-- wypełnione przy `approved` znaczyłoby dwie różne rzeczy naraz.
ALTER TABLE "moderation_submissions"
  ADD CONSTRAINT "moderation_submissions_powod_tylko_przy_odmowie"
  CHECK ("reason" IS NULL OR "status" = 'rejected');--> statement-breakpoint

-- Jedno oczekujące zgłoszenie na przedmiot. Indeks jest CZĘŚCIOWY i to jest
-- sedno: rozstrzygnięcia mają się odkładać bez ograniczeń, bo firma
-- odrzucona zgłasza się ponownie, a opublikowana zgłasza kolejne zmiany
-- przez całe życie konta.
CREATE UNIQUE INDEX "moderation_submissions_jedno_oczekujace"
  ON "moderation_submissions" ("subject_kind", "subject_id")
  WHERE "status" = 'pending';--> statement-breakpoint

CREATE INDEX "moderation_submissions_status_created_at_idx"
  ON "moderation_submissions" ("status", "created_at");--> statement-breakpoint

CREATE INDEX "moderation_submissions_subject_idx"
  ON "moderation_submissions" ("subject_kind", "subject_id");--> statement-breakpoint

-- Firmy, które są w serwisie dzisiaj, zostają widoczne.
--
-- Od tej migracji widoczność profilu zależy od istnienia zaakceptowanego
-- zgłoszenia. Firma bez wiersza w tej tabeli jest nieprzejrzana, czyli
-- niewidoczna, więc bez uzupełnienia historii katalog opustoszałby
-- w chwili wdrożenia.
--
-- WSZYSTKIE FIRMY, NIE TYLKO `active`. Pierwsza wersja brała wyłącznie
-- aktywne i to był błąd: `visitcard` to firma po wygaśnięciu abonamentu,
-- której profil ma zostać widoczny w okrojonej formie, a `draft` to profil
-- zaimportowany, widoczny z wezwaniem do przejęcia. Obie zniknęłyby bez
-- śladu. `suspended` też dostaje wiersz, choć jest niewidoczna z innego
-- powodu: gdyby kiedyś wróciła, ma wrócić do stanu sprzed zawieszenia,
-- a nie do kolejki.
--
-- Wiersze dostają `approved` z datą migracji i bez moderatora. Pusty autor
-- jest tu informacją, nie brakiem: te wpisy istniały, zanim moderacja
-- powstała, i nikt ich nie przeglądał. Podstawienie w to miejsce pierwszego
-- lepszego moderatora byłoby wpisaniem do dziennika decyzji, której ten
-- człowiek nie podjął.

INSERT INTO "moderation_submissions" ("subject_kind", "subject_id", "status", "decided_at")
SELECT 'company', "id", 'approved', now()
FROM "companies";

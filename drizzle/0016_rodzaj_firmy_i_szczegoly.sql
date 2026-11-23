-- Rodzaj firmy i szczegóły, o które pyta kreator.
--
-- PO CO. Kreator zadawał lokalom i usługodawcom jedno i to samo: nazwa,
-- opis, cena od, pojemność. Pojemność przy DJ-u nie znaczy nic, a przy sali
-- brakowało wszystkiego, od czego gość faktycznie zależy: parkingu, noclegu,
-- własnego alkoholu, godziny, do której można grać. Gość dopytywał o to
-- telefonicznie, czyli dokładnie tak, jak przed wejściem na tę stronę.
--
-- RODZAJ FIRMY WCHODZI DO BAZY PO RAZ PIERWSZY. Kreator pytał o niego od
-- początku, ale odpowiedzi nigdzie nie zapisywał: rozróżnienie żyło
-- w content/, bo strona lokali przekazywała do zapytania listę slugów
-- z rodzaje-lokali.ts, a strona usługodawców listę z kategorie.ts.
-- To wystarcza, dopóki pytanie brzmi „pokaż mi sale”. Przestaje, gdy pyta
-- o to sama baza: kto może dodać imprezę, o co zapytać w kreatorze, który
-- zestaw filtrów pokazać.

CREATE TYPE "company_kind" AS ENUM ('venue', 'service');--> statement-breakpoint
CREATE TYPE "venue_kitchen" AS ENUM ('wlasna', 'obcy-catering', 'tylko-nasz');--> statement-breakpoint
CREATE TYPE "venue_alcohol" AS ENUM ('nie', 'tak-bez-oplaty', 'tak-z-korkowym');--> statement-breakpoint
CREATE TYPE "venue_parking" AS ENUM ('brak', 'bezplatny', 'platny', 'uliczny');--> statement-breakpoint
CREATE TYPE "venue_lodging" AS ENUM ('brak', 'na-miejscu', 'w-poblizu');--> statement-breakpoint
CREATE TYPE "venue_outdoor" AS ENUM ('brak', 'ogrod', 'taras', 'plener');--> statement-breakpoint
CREATE TYPE "venue_kids" AS ENUM ('brak', 'kacik', 'plac-zabaw');--> statement-breakpoint
CREATE TYPE "service_travel_cost" AS ENUM ('w-cenie', 'w-cenie-do-limitu', 'platny');--> statement-breakpoint
CREATE TYPE "service_deposit_kind" AS ENUM ('procent', 'kwota');--> statement-breakpoint

-- Nullowalne, bez wartości domyślnej. Wiersz firmy powstaje przy zakładaniu
-- konta, a rodzaj wiadomy jest dopiero krok dalej, przy wyborze kategorii.
-- Domyślne 'service' byłoby zdaniem nieodróżnialnym od prawdziwej odpowiedzi.
ALTER TABLE "companies" ADD COLUMN "kind" "company_kind";--> statement-breakpoint

CREATE TABLE "venue_details" (
  "company_id" uuid PRIMARY KEY NOT NULL,
  "seats_seated" integer,
  "seats_standing" integer,
  "min_guests" integer,
  "min_spend" integer,
  "exclusive" boolean,
  "kitchen" "venue_kitchen",
  "alcohol" "venue_alcohol",
  "corkage" integer,
  "parking" "venue_parking",
  "parking_spots" integer,
  "lodging" "venue_lodging",
  "lodging_rooms" integer,
  "music_until" time,
  "outdoor" "venue_outdoor",
  "kids" "venue_kids",
  "step_free_entrance" boolean,
  "accessible_toilet" boolean,
  "elevator" boolean,
  "air_conditioning" boolean,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "venue_details" ADD CONSTRAINT "venue_details_company_id_companies_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id");--> statement-breakpoint

-- Liczby nieujemne, bo sala na minus dwadzieścia osób nie istnieje, a ujemne
-- korkowe znaczyłoby, że lokal dopłaca do butelki.
ALTER TABLE "venue_details" ADD CONSTRAINT "venue_details_liczby_dodatnie" CHECK (
  ("seats_seated" IS NULL OR "seats_seated" > 0)
  AND ("seats_standing" IS NULL OR "seats_standing" > 0)
  AND ("min_guests" IS NULL OR "min_guests" > 0)
  AND ("min_spend" IS NULL OR "min_spend" >= 0)
  AND ("corkage" IS NULL OR "corkage" >= 0)
  AND ("parking_spots" IS NULL OR "parking_spots" >= 0)
  AND ("lodging_rooms" IS NULL OR "lodging_rooms" >= 0)
);--> statement-breakpoint

-- Korkowe ma sens wyłącznie przy alkoholu z korkowym. Kwota dopięta do „nie
-- wolno” albo do „bez opłaty” jest sprzeczna sama ze sobą i gość zobaczyłby
-- na profilu dwie różne odpowiedzi na to samo pytanie.
ALTER TABLE "venue_details" ADD CONSTRAINT "venue_details_korkowe_tylko_z_korkowym"
  CHECK ("corkage" IS NULL OR "alcohol" = 'tak-z-korkowym');--> statement-breakpoint

-- To samo z pokojami: liczba pokoi przy „brak noclegu” to pomyłka, nie dane.
ALTER TABLE "venue_details" ADD CONSTRAINT "venue_details_pokoje_tylko_na_miejscu"
  CHECK ("lodging_rooms" IS NULL OR "lodging" = 'na-miejscu');--> statement-breakpoint

-- I z miejscami parkingowymi przy braku parkingu.
ALTER TABLE "venue_details" ADD CONSTRAINT "venue_details_miejsca_tylko_z_parkingiem"
  CHECK ("parking_spots" IS NULL OR "parking" <> 'brak');--> statement-breakpoint

CREATE INDEX "venue_details_seats_seated_idx" ON "venue_details" ("seats_seated");--> statement-breakpoint
CREATE INDEX "venue_details_parking_idx" ON "venue_details" ("parking");--> statement-breakpoint
CREATE INDEX "venue_details_lodging_idx" ON "venue_details" ("lodging");--> statement-breakpoint
CREATE INDEX "venue_details_alcohol_idx" ON "venue_details" ("alcohol");--> statement-breakpoint
CREATE INDEX "venue_details_exclusive_idx" ON "venue_details" ("exclusive");--> statement-breakpoint

CREATE TABLE "service_details" (
  "company_id" uuid PRIMARY KEY NOT NULL,
  "travel_radius_km" integer,
  "travel_cost" "service_travel_cost",
  "travel_rate" integer,
  "base_hours" integer,
  "extra_hour_price" integer,
  "deposit_kind" "service_deposit_kind",
  "deposit_value" integer,
  "deposit_due_days" integer,
  "deposit_refundable" text,
  "booking_horizon_months" integer,
  "events_per_day" integer,
  "delivery_weeks" integer,
  "substitute" boolean,
  "vat_invoice" boolean,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "service_details" ADD CONSTRAINT "service_details_company_id_companies_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id");--> statement-breakpoint

ALTER TABLE "service_details" ADD CONSTRAINT "service_details_liczby_dodatnie" CHECK (
  ("travel_radius_km" IS NULL OR "travel_radius_km" > 0)
  AND ("travel_rate" IS NULL OR "travel_rate" >= 0)
  AND ("base_hours" IS NULL OR "base_hours" > 0)
  AND ("extra_hour_price" IS NULL OR "extra_hour_price" >= 0)
  AND ("deposit_due_days" IS NULL OR "deposit_due_days" >= 0)
  AND ("booking_horizon_months" IS NULL OR "booking_horizon_months" > 0)
  AND ("events_per_day" IS NULL OR "events_per_day" > 0)
  AND ("delivery_weeks" IS NULL OR "delivery_weeks" > 0)
);--> statement-breakpoint

-- Zaliczka w procentach mieści się w zakresie od 1 do 100. Bez tego warunku
-- „50” w polu kwotowym i „50” w polu procentowym są tym samym wierszem,
-- a znaczą pięćdziesiąt groszy i połowę ceny.
ALTER TABLE "service_details" ADD CONSTRAINT "service_details_zaliczka_sensowna" CHECK (
  "deposit_value" IS NULL
  OR ("deposit_kind" = 'procent' AND "deposit_value" BETWEEN 1 AND 100)
  OR ("deposit_kind" = 'kwota' AND "deposit_value" >= 0)
);--> statement-breakpoint

-- Stawka za kilometr należy do dojazdu płatnego.
ALTER TABLE "service_details" ADD CONSTRAINT "service_details_stawka_tylko_platny"
  CHECK ("travel_rate" IS NULL OR "travel_cost" = 'platny');--> statement-breakpoint

CREATE INDEX "service_details_travel_radius_km_idx" ON "service_details" ("travel_radius_km");--> statement-breakpoint
CREATE INDEX "service_details_vat_invoice_idx" ON "service_details" ("vat_invoice");--> statement-breakpoint

CREATE TABLE "service_included_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "position" integer NOT NULL,
  "label" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "service_included_items" ADD CONSTRAINT "service_included_items_company_id_companies_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id");--> statement-breakpoint

ALTER TABLE "service_included_items" ADD CONSTRAINT "service_included_items_etykieta_niepusta"
  CHECK (btrim("label") = "label" AND char_length("label") BETWEEN 2 AND 80);--> statement-breakpoint

CREATE INDEX "service_included_items_company_id_idx" ON "service_included_items" ("company_id");--> statement-breakpoint

-- Rodzaj dla firm, które już są w bazie.
--
-- Wyprowadzony z kategorii głównej: slugi lokali i slugi usługodawców są
-- rozłączne (content/rodzaje-lokali.ts kontra content/kategorie.ts), więc
-- przynależność rozstrzyga jednoznacznie. Lista slugów lokali jest tu
-- wpisana wprost, bo migracja ma dać ten sam wynik za rok, niezależnie
-- od tego, co w tym czasie dopisano do słownika.
--
-- Firma bez kategorii zostaje z pustym rodzajem. To jest poprawny wynik,
-- a nie luka: szkic porzucony przed wyborem kategorii nie jest ani lokalem,
-- ani usługodawcą, i zgadywanie za niego byłoby wpisaniem odpowiedzi,
-- której nikt nie udzielił.
UPDATE "companies" SET "kind" = 'venue'
WHERE "id" IN (
  SELECT cc."company_id"
  FROM "company_categories" cc
  JOIN "categories" c ON c."id" = cc."category_id"
  WHERE cc."archived_at" IS NULL
    AND c."slug" IN (
      'sala-weselna', 'sala-bankietowa', 'restauracja', 'dwor-palac', 'hotel',
      'dom-weselny', 'stodola', 'agroturystyka', 'ogrod-plener', 'klub',
      'sala-konferencyjna'
    )
);--> statement-breakpoint

UPDATE "companies" SET "kind" = 'service'
WHERE "kind" IS NULL
  AND "id" IN (
    SELECT cc."company_id"
    FROM "company_categories" cc
    WHERE cc."archived_at" IS NULL
  );

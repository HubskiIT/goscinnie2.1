-- Imprezy organizowane przez lokale.
--
-- PO CO. Ekrany imprez istniały od początku, ale czytały z content/, czyli
-- z pliku z przykładami. Nie było tabeli, nie było formularza i nie było
-- jak dodać ani jednej prawdziwej imprezy. „System dodawania imprez nie
-- działa” nie było usterką do naprawienia, tylko brakiem systemu.
--
-- TYLKO LOKAL DODAJE IMPREZĘ. Klucz obcy wskazuje na `companies`, gdzie
-- leżą lokale i usługodawcy razem, więc sam tego nie rozstrzygnie.
-- Pilnuje tego warstwa zapytań, sprawdzając `companies.kind`, który wszedł
-- migracją 0016. To dlatego rodzaj firmy musiał wejść przed imprezami.
--
-- MIEJSCOWOŚCI I PUNKTU TU NIE MA. Impreza odbywa się w lokalu, więc jej
-- miejsce to miejsce lokalu. Druga kopia współrzędnych rozjechałaby się
-- przy pierwszej przeprowadzce sali i wyszukiwanie po okolicy dawałoby dwie
-- różne odpowiedzi zależnie od tego, czy pytało o firmę, czy o jej imprezę.

CREATE TABLE "events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "event_type_id" uuid NOT NULL,
  "custom_event_name" text,
  "event_date" date NOT NULL,
  "starts_at" time NOT NULL,
  "ends_at" time,
  "ticket_price" integer,
  "description" text NOT NULL,
  "adults_only" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "events_slug_unique" UNIQUE("slug")
);--> statement-breakpoint

ALTER TABLE "events" ADD CONSTRAINT "events_company_id_companies_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id");--> statement-breakpoint

ALTER TABLE "events" ADD CONSTRAINT "events_event_type_id_event_types_id_fk"
  FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id");--> statement-breakpoint

-- Ta sama reguła kształtu co przy własnej okazji zlecenia, migracja 0014.
-- Zgodności z event_type_id nie da się tu zapisać, bo sięga przez klucz
-- obcy do drugiej tabeli; pilnuje jej warstwa zapytań.
ALTER TABLE "events" ADD CONSTRAINT "events_custom_event_name_sensowna" CHECK (
  "custom_event_name" IS NULL
  OR (
    btrim("custom_event_name") = "custom_event_name"
    AND char_length("custom_event_name") BETWEEN 3 AND 60
  )
);--> statement-breakpoint

-- Cena biletu nieujemna. Puste znaczy wstęp wolny, zero też, i to jest
-- w porządku: obie odpowiedzi wyświetlamy tak samo.
ALTER TABLE "events" ADD CONSTRAINT "events_cena_nieujemna"
  CHECK ("ticket_price" IS NULL OR "ticket_price" >= 0);--> statement-breakpoint

-- Koniec po początku, gdy koniec w ogóle podano.
--
-- Porównanie samych godzin, bez daty, więc impreza trwająca po północy
-- musi zostawić koniec pusty. To jest świadomy kompromis: doba hotelowa
-- w kolumnie `time` nie istnieje, a dokładanie drugiej daty po to, żeby
-- zapisać „do trzeciej nad ranem”, oznaczałoby drugie pole do pomylenia
-- przy każdej imprezie kończącej się przed północą, czyli przy większości.
ALTER TABLE "events" ADD CONSTRAINT "events_koniec_po_poczatku"
  CHECK ("ends_at" IS NULL OR "ends_at" > "starts_at");--> statement-breakpoint

CREATE INDEX "events_event_date_idx" ON "events" ("event_date");--> statement-breakpoint
CREATE INDEX "events_company_id_event_date_idx" ON "events" ("company_id", "event_date");

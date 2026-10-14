CREATE TABLE "company_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"path" text NOT NULL,
	"position" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_photos" ADD CONSTRAINT "company_photos_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_photos_company_position_idx" ON "company_photos" USING btree ("company_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "company_photos_company_position_uniq" ON "company_photos" USING btree ("company_id","position") WHERE "archived_at" is null;

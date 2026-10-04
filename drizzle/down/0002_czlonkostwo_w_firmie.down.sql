-- Cofnięcie migracji 0002 (członkostwo w firmie).
--
-- DROP jest tu dozwolony na tej samej zasadzie co w poprzednich cofnięciach:
-- usuwa wyłącznie to, co ta migracja utworzyła.
--
-- Uwaga: cofnięcie odtwarza strukturę, nie dane. Po jego wykonaniu znikają
-- powiązania ludzi z firmami. Właściciel rozliczeniowy zostaje, bo siedzi
-- w kolumnie companies.owner_user_id, której ta migracja nie tworzyła,
-- ale współpracownicy dopisani do firm będą do dodania od nowa.

DROP TABLE IF EXISTS "company_members";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."company_member_role";

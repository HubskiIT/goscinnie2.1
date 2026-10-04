-- Cofnięcie migracji 0004 (wnioski o przejęcie profilu).
--
-- DROP jest tu dozwolony na tej samej zasadzie co w poprzednich cofnięciach:
-- usuwa wyłącznie to, co ta migracja utworzyła.
--
-- Uwaga: cofnięcie odtwarza strukturę, nie dane. Po jego wykonaniu znikają
-- wszystkie wnioski, także rozpatrzone. Członkostwa założone przy zatwierdzeniu
-- zostają, bo mieszkają w company_members, której ta migracja nie tworzyła.
-- To znaczy, że po cofnięciu i ponownej migracji firmy przejęte pozostaną
-- przejęte, ale ślad po tym, kto i kiedy o nie wnioskował, przepadnie.

DROP TABLE IF EXISTS "company_claims";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."claim_status";

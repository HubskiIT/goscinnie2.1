CREATE UNIQUE INDEX "plans_category_code_uniq" ON "plans" USING btree ("category_id","code");

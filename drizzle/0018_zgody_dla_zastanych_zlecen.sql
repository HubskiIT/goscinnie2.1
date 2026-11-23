-- Zgody moderacji dla zleceń, które są na giełdzie dzisiaj.
--
-- PO CO OSOBNA MIGRACJA. Migracja 0015 założyła kolejkę i uzupełniła
-- historię dla firm, bo wtedy tylko firmy zależały od zgody. Zlecenia
-- dostały ten wymóg później, razem z czwartym rodzajem wpisu w kolejce,
-- i to była zmiana w kodzie, bez własnej migracji.
--
-- Bez tego wiersza każde zlecenie wystawione przed wdrożeniem staje się
-- niewidoczne w chwili, w której nowy kod rusza: giełda pustoszeje,
-- firmy z abonamentem nie mają czego oglądać, a klienci czekają na oferty,
-- które nie mają jak przyjść. Żadna z tych osób nie zrobiła nic, za co
-- miałaby zapłacić wdrożeniem.
--
-- WSZYSTKIE ZLECENIA, NIE TYLKO OTWARTE. Zamknięte i przeterminowane też
-- dostają wiersz, choć i tak nie wchodzą na giełdę z innego powodu.
-- Chodzi o to, żeby ich stan nie zależał od kolejności dwóch warunków:
-- gdyby zlecenie wróciło kiedyś do stanu otwartego, ma wrócić na giełdę,
-- a nie wpaść do kolejki sprzed roku.
--
-- `on conflict do nothing` sprawia, że ponowne uruchomienie niczego nie
-- psuje, a zlecenia zgłoszone już nową ścieżką nie dostają drugiego wpisu.
--
-- Data decyzji to moment migracji, moderator pusty: tych zleceń nikt nie
-- przeglądał i wpisanie w to miejsce czyjegoś nazwiska byłoby zapisaniem
-- w dzienniku decyzji, której ten człowiek nie podjął. Tak samo jak
-- przy firmach w migracji 0015.

INSERT INTO "moderation_submissions" ("subject_kind", "subject_id", "status", "decided_at")
SELECT 'request', "id", 'approved', now()
FROM "requests"
ON CONFLICT DO NOTHING;

-- Cofnięcie migracji 0006
--
-- Migracja w przód zdjęła `not null` z `cities.point`, żeby zmieściło się
-- 533 miejscowości, których PRNG nie ma na mapie. Cofnięcie musi to
-- ograniczenie przywrócić, a wiersze bez współrzędnych go nie spełniają.
--
-- DLACZEGO TO USUWA WIERSZE, SKORO ZASADA 5 ZABRANIA USUWANIA
--
-- Zasada 5 mówi o **kodzie aplikacji**: nic, co dotyczy firm, klientów,
-- zleceń, ofert, opinii ani rozliczeń, nie znika przez działanie serwisu.
-- Cofnięcie migracji nie jest działaniem serwisu, a `cities` to słownik,
-- nie czyjeś dane: odtwarza go `pnpm db:slowniki` z plików TERYT i PRNG.
-- Sąsiednie cofnięcia robią zresztą to samo i więcej — 0007 kasuje całą
-- tabelę, a to cofnięcie niżej zdejmuje trzy kolumny z danymi.
--
-- DLACZEGO POPRZEDNIA WERSJA BYŁA GORSZA
--
-- Odmawiała wykonania, dopóki w tabeli siedzi choć jeden taki wiersz, czyli
-- **zawsze po wypełnieniu słownika**. Łamało to zasadę 2, która wymaga od
-- każdej migracji działającego cofnięcia: to tutaj nie działało w zwykłym
-- stanie bazy. Skutek praktyczny: `pnpm test` nie dawał się uruchomić dwa
-- razy pod rząd, bo przygotowanie zestawu zaczyna od cofnięcia wszystkich
-- migracji, a awaria wyglądała na błąd testów, nie na błąd cofnięcia.
--
-- CZEGO NADAL NIE WOLNO
--
-- Jeśli na którejkolwiek z tych miejscowości stoi firma albo zlecenie, to
-- nie jest już słownik, tylko czyjeś dane. Wtedy cofnięcie odmawia i czeka
-- na decyzję człowieka, zamiast kasować wiersz razem z tym, co go wskazuje.

do $$
declare
  ile_firm bigint;
  ile_zlecen bigint;
begin
  select count(*) into ile_firm
  from companies c join cities m on m.id = c.city_id
  where m.point is null;

  select count(*) into ile_zlecen
  from requests z join cities m on m.id = z.city_id
  where m.point is null;

  if ile_firm > 0 or ile_zlecen > 0 then
    raise exception
      'Cofnięcie niemożliwe: na miejscowościach bez współrzędnych stoi % firm i % zleceń. Przenieś je do miejscowości ze współrzędnymi albo uzupełnij punkty.',
      ile_firm, ile_zlecen;
  end if;
end $$;

-- Wiersze słownikowe, których nie da się pogodzić z `not null`. Odtwarza je
-- `pnpm db:slowniki`, więc nie jest to utrata czegokolwiek niepowtarzalnego.
delete from cities where point is null;

drop index if exists cities_simc_unique_idx;
alter table cities drop column if exists rodzaj;
alter table cities drop column if exists gmina;
alter table cities drop column if exists simc;
alter table cities alter column point set not null;

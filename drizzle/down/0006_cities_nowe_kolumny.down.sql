-- Cofnięcie migracji 0006
-- Odmawia wykonania, jeśli w tabeli cities są wiersze bez współrzędnych.

-- Sprawdź czy są wiersze bez point
do $$
begin
  if exists (select 1 from cities where point is null) then
    raise exception 'Cofnięcie niemożliwe: tabela cities zawiera % wierszy bez współrzędnych. Cofnięcie wymaga ich uzupełnienia.',
                    (select count(*) from cities where point is null);
  end if;
end $$;

-- Bezpieczne cofnięcie
drop index if exists cities_simc_unique_idx;
alter table cities drop column if exists rodzaj;
alter table cities drop column if exists gmina;
alter table cities drop column if exists simc;
alter table cities alter column point set not null;

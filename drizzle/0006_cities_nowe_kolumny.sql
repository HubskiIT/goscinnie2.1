-- Migracja 0006: rozszerzenie tabeli cities o kolumny TERYT i nullable point
-- Decyzja właściciela z 9 października 2026: wchodzi 101 865 miejscowości,
-- włącznie z 533 bez współrzędnych w PRNG.

-- Krok 1: Dodaj nullable kolumny
alter table cities add column simc text;
alter table cities add column gmina text;
alter table cities add column rodzaj text;
alter table cities alter column point drop not null;

-- Krok 2: Unikalny indeks na simc
create unique index cities_simc_unique_idx on cities (simc);

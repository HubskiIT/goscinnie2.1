-- Migracja 0009: indeks trigramowy na nazwie miejscowości bez polskich znaków.
--
-- Po co: podpowiedzi miejscowości przeniosły się z content/miejscowosci.json.gz
-- do bazy, bo formularz potrzebuje `cities.id`, którego w pliku nie ma. Plik
-- szukał po nazwie pozbawionej znaków diakrytycznych i dopasowywał fragment
-- w środku, więc „lodz" znajdowało „Łódź", a „nwa" znajdowało „Nowa Wieś".
--
-- Istniejący cities_name_trgm_idx stoi na surowej kolumnie `name`, więc
-- „lodz" do „Łódź" przez niego nie trafi. Ten indeks stoi na tym samym
-- przekształceniu, które stosuje zapytanie, dzięki czemu dopasowanie fragmentu
-- w 101 865 wierszach nie schodzi do przeglądania całej tabeli przy każdym
-- naciśnięciu klawisza.
--
-- `translate` i `lower` są IMMUTABLE, więc wolno ich użyć w indeksie.
-- Odwzorowanie znaków jest dokładnie tym, co robi bezZnakow() w
-- content/miejscowosci.ts: ź i ż schodzą oba do z, ó do o, ł do l.

create index cities_nazwa_bez_znakow_trgm_idx
  on cities
  using gin (translate(lower(name), 'ąćęłńóśźż', 'acelnoszz') gin_trgm_ops);

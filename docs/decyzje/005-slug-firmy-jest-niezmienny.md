# 005. Slug firmy powstaje raz i się nie zmienia

**Data:** 2026-09-24
**Status:** przyjęte

## Decyzja

`companies.slug` powstaje przy utworzeniu firmy i **nie zmienia się
automatycznie przy zmianie nazwy**. Adres profilu to `/f/<slug>` i ma być
stabilny przez całe życie firmy.

Jeśli kiedyś trzeba będzie go zmienić ręcznie, na przykład przy rebrandingu
albo literówce w imporcie, stary adres **musi przekierowywać** na nowy kodem
301, a nie przestać działać.

## Dlaczego

Adres profilu jest tym, co zbiera pozycję w wyszukiwarce, linki z zewnątrz
i wpisy w katalogach. Zmiana slugów po roku działania kosztuje połowę ruchu
na kilka miesięcy, bo wyszukiwarka musi przeindeksować wszystko od nowa,
a linki z zewnątrz nikt za nas nie poprawi.

Automatyczne przeliczanie sluga przy każdej zmianie nazwy wygląda niewinnie:
firma poprawia literówkę w nazwie i traci adres, pod którym jest w Google.
Robi to przez formularz w panelu, bez świadomości konsekwencji, i nikt tego
nie zauważy przez miesiąc.

## Konsekwencje

1. Nazwa i slug to dwa niezależne pola. Zmiana nazwy nie rusza sluga.
2. Slug importowany z danych zewnętrznych zostaje taki, jaki wszedł, nawet
   jeśli nie jest ładny. Ładniejszy adres nie jest wart utraty pozycji.
3. Przy ręcznej zmianie sluga potrzebna będzie tabela przekierowań
   (stary slug, nowy slug, data) i obsługa 301 w trasie `/f/<slug>`.
   Nie budujemy jej teraz, bo nie ma jeszcze czego przekierowywać, ale
   **usunięcie starego sluga bez przekierowania jest błędem**, nie skrótem.
4. Duplikat nazwy nie jest problemem, duplikat sluga owszem: chroni przed tym
   ograniczenie unikalności na kolumnie.

## Czego nie robić

Nie dodawać „odśwież slug z nazwy" jako przycisku ani jako efektu ubocznego
zapisu profilu. Jeśli ktoś naprawdę potrzebuje zmiany, robi się ją świadomie,
razem z przekierowaniem.

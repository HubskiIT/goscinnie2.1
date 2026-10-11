# 010. Darmowy start: rejestracja, logowanie i ogłoszenia bez płatności

**Data:** 2026-10-11
**Status:** przyjęte

## Decyzja

Na starcie serwis jest w całości darmowy dla firm. Ekrany płatności są ukryte,
weryfikacja zostaje.

## Co to znaczy w kodzie

1. `PLATNOSCI_WLACZONE = false` w `lib/serwis.ts`. Stała, nie zmienna
   środowiskowa: włączenie płatności ma przejść przez commit i przegląd.
2. `/cennik` daje 404, `/panel/abonament` i `/platnosc/sukces` wracają do panelu.
   Odnośniki do cennika w nagłówku, stopce i na ekranach prowadzą do `/dla-firm`.
3. Publikacja profilu zakłada abonament z datą `DARMOWY_DOSTEP_DO`. Kolumna
   `expires_at` nie przyjmuje pustej wartości, a reguła „w katalogu jest firma
   z trwającym abonamentem” zostaje ta sama przed i po włączeniu płatności.
4. Weryfikacja zostaje: kod z maila przed pierwszym krokiem kreatora, NIP
   i telefon w kroku czwartym. NIP i telefon leżą w `company_verification`,
   nigdy na profilu.

## Katalog czyta z bazy

Firma opublikowana przez kreator trafia do `/lokale`, `/uslugodawcy` i pod
`/f/<slug>`, obok przykładowych ogłoszeń z `content/`. Warunek widoczności:
stan `active` i abonament, który jeszcze trwa (`lib/db/queries/katalog.ts`).
Szkic z kreatora nie jest widoczny nigdzie, także pod bezpośrednim adresem.

## Kreator służy też do poprawek

Opublikowana firma wraca do kreatora z panelu. Ostatni krok to wtedy „Zapisz
zmiany”: nie zakłada drugiego abonamentu i nie zmienia adresu profilu
(decyzja 005).

## Przed włączeniem płatności

1. Zdecydować, do kiedy firmy z darmowego okresu zachowują dostęp, i ustawić
   to migracją danych dla ich abonamentów.
2. Zmienić `PLATNOSCI_WLACZONE` na `true` i przejrzeć ekrany cennika
   (`CennikScreen`, `ZamowienieAbonamentuScreen`), bo od 11 października
   nikt ich nie oglądał.

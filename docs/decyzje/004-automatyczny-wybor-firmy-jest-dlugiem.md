# 004. Automatyczny wybór firmy jest świadomym długiem

**Data:** 2026-09-23
**Status:** przyjęte jako tymczasowe, z warunkiem wyjścia

## Decyzja

Gdy użytkownik należy do kilku firm, system wybiera za niego jedną i nie pyta.
Kolejność w `lib/auth/firma.ts`: firma z aktywnym abonamentem, firma, w której
jest właścicielem, najstarsze członkostwo, identyfikator jako rozstrzygnięcie
remisu.

To jest rozwiązanie tymczasowe. Docelowo potrzebny jest **jawny przełącznik
kontekstu w interfejsie**, tak jak przy przestrzeniach roboczych: użytkownik
widzi, w czyim imieniu działa, i zmienia to sam.

## Dlaczego na razie tak

Przełącznik to element interfejsu w każdym widoku panelu, stan przechowywany
między żądaniami i decyzja, co się dzieje z zakładkami otwartymi w dwóch
kontekstach naraz. To osobny plaster, a bez niego reguła „co kto widzi” i tak
musi na coś wskazać.

## Dlaczego to jest dług, a nie rozwiązanie

Automatyczny wybór myli w obie strony:

1. Człowiek prowadzący dwie firmy widzi zlecenia w kontekście jednej z nich
   i nie wie, której. Oferta złożona „nie z tej firmy” to błąd, którego nie da
   się cofnąć bez wsparcia.
2. Pierwszeństwo firmy z abonamentem jest tu regułą naprawczą, nie zamierzoną.
   Powstała po tym, jak właściciel firmy z opłaconym abonamentem dostał zajawkę,
   bo system wybrał jego drugą firmę. Reguła naprawcza dobrana pod jeden objaw
   zwykle ma drugi objaw, którego jeszcze nie znamy.

## Warunek wyjścia

**Przełącznik wchodzi, gdy pojawi się pierwszy realny użytkownik z dwiema
firmami.** Nie wcześniej, bo do tego czasu nikt na tym nie traci, i nie później,
bo od tego momentu traci każdy taki użytkownik.

Zapytanie sprawdzające, czy ten moment nadszedł:

```sql
select user_id, count(*) as ile
from company_members
group by user_id
having count(*) > 1;
```

## Czego nie robić w międzyczasie

Nie rozbudowywać kolejności wyboru o kolejne kryteria. Każde następne
„a jeszcze gdy…” to kolejna reguła naprawcza pod kolejny objaw i kolejna rzecz
do usunięcia przy wdrażaniu przełącznika.

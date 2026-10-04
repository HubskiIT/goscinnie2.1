# 003. Zaufany nagłówek z adresem IP zależy od wyboru hostingu

**Data:** 2026-09-23
**Status:** rozstrzygnięte 2026-09-24, po wyborze Vercela

## Rzecz do rozstrzygnięcia

Limit prób logowania po adresie IP (`lib/auth/limity.ts`) odczytuje adres
z nagłówka `x-forwarded-for`. Ten nagłówek wstawia klient żądania i da się go
dopisać ręcznie. Aplikacja bez odwrotnego proxy, albo z proxy, które nagłówka
nie nadpisuje, przyjmie każdą wartość, jaką atakujący wpisze.

Skutek jest taki, że atakujący daje nowy adres przy każdej próbie, każda próba
zakłada nowy licznik i limit po IP przestaje cokolwiek znaczyć.

## Zasada, która obowiązuje niezależnie od dostawcy

**Nigdy nie ufaj surowemu `x-forwarded-for`. Zawsze nagłówkowi, który wstawia
sam dostawca** i którego nie da się podrobić z zewnątrz, bo dostawca nadpisuje
go na swoim brzegu.

Przykładowo: Cloudflare wstawia `cf-connecting-ip`, Vercel `x-vercel-forwarded-for`,
Fly.io `fly-client-ip`. Nazwa jest za każdym razem inna, więc tej decyzji nie da
się podjąć przed wyborem dostawcy.

## Rozstrzygnięcie

Hostingiem jest Vercel, więc zaufanym nagłówkiem jest **`x-vercel-forwarded-for`**.
Vercel nadpisuje go na swoim brzegu, więc klient nie jest w stanie go podrobić.

`adresIp` w `lib/auth/limity.ts` czyta wyłącznie jego. Surowy `x-forwarded-for`
jest czytany **tylko poza produkcją**, do pracy lokalnej i testów, gdzie i tak
nie ma czego chronić.

Żądanie bez nagłówka dostawcy dostaje wspólny licznik pod kluczem `nieznany`.
Jest to celowo gorsze dla takiego żądania niż osobny licznik: lepszy jeden
wspólny licznik niż licznik, który atakujący resetuje sobie sam.

## Co zrobić przy zmianie dostawcy

1. Ustalić, który nagłówek nowy dostawca gwarantuje i nadpisuje na brzegu.
2. Podmienić stałą `NAGLOWEK_ZAUFANY` w `lib/auth/limity.ts`.
3. Nigdy nie wracać do surowego `x-forwarded-for` na produkcji.

## Rzecz, która nie zależy od tej decyzji

Limit po koncie działa niezależnie od adresu i to on chroni przed atakiem
rozproszonym. Nawet przy całkowicie nieskutecznym limicie po IP konto ma
własny licznik pięciu prób w oknie piętnastu minut. Dlatego ten punkt jest
otwarty, a nie blokujący.

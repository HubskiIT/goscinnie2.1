# 008. Co trzeba zmienić przy podpięciu goscinnie.pl

**Data:** 2026-09-24
**Status:** lista kontrolna, do wykonania przy zakupie domeny

Dwie rzeczy, o których za miesiąc nikt nie będzie pamiętał, a obie psują się
po cichu: nie wywalają błędu, tylko przestają działać poprawnie.

## 1. BETTER_AUTH_URL musi wskazywać dokładnie na adres, pod którym stoi serwis

Zmienna steruje domeną, na której ustawiane jest ciasteczko sesji. Przy
niezgodności **logowanie psuje się bez żadnego komunikatu**: ciasteczko ląduje
na innej domenie niż ta, z której przyszło żądanie, przeglądarka go nie odsyła,
a użytkownik po zalogowaniu wraca na formularz logowania. Wygląda to jak złe
hasło, a nie jak błąd konfiguracji, więc zgłoszenie brzmi „nie mogę się
zalogować" i szuka się nie tam, gdzie trzeba.

Kolejność przy podpięciu domeny:

1. Podepnij `goscinnie.pl` do projektu na Vercelu i poczekaj na certyfikat.
2. Zmień `BETTER_AUTH_URL` na `https://goscinnie.pl`, **bez ukośnika na końcu**.
3. Wdróż ponownie, bo zmienna czytana jest przy budowaniu i przy starcie.
4. **Sprawdź rejestracją**, nie odczytem zmiennej. Załóż konto i potwierdź,
   że kończy się zalogowaniem, a nie powrotem do formularza.

Przekierowanie z `www` na wersję bez `www` jest już w `vercel.json`.

## 2. Adres kontaktowy w stopce

`KONTAKT_EMAIL` w `lib/serwis.ts`, jedna stała, jedna linia do podmiany.
Dopóki skrzynka pod domeną nie działa, w stopce ma stać adres, który **odbiera
pocztę**. Strona z kontaktem, który nie odpowiada, jest gorsza niż strona bez
kontaktu: pierwsza wygląda na firmę, która ignoruje, druga na firmę, która
dopiero zaczyna.

## Czego przy tej okazji NIE zmieniać

`INDEKSOWANIE` zostaje puste. Podpięcie domeny nie jest powodem do wpuszczenia
robotów, a pokusa będzie, bo „skoro już mamy prawdziwy adres". Katalog ma być
najpierw zapełniony, patrz decyzja 007.

Slugi firm zostają takie, jakie są. Zmiana domeny nie jest powodem do zmiany
adresów profili, patrz decyzja 005.

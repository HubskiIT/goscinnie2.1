# 011. Wysyłkę kodów odbieramy better-auth

**Data:** 2026-10-13
**Status:** przyjęte

## Problem

Rejestracja na produkcji kończyła się ekranem „sprawdź skrzynkę", a kod nigdy
nie przychodził. W logach serwera stało `Resend API zwróciło 403`, ale człowiek
przed formularzem nie dowiadywał się o niczym. To samo dotyczyło przycisku
„wyślij kod ponownie", który odpowiadał „kod właśnie poleciał" także wtedy,
gdy nic nie poleciało, oraz resetu hasła.

Ustalenie przyczyny zajęło pół dnia i sprowadzało się do wyciągnięcia jednej
linii z logów Vercela.

## Dlaczego tak było

**better-auth połyka każdy błąd wysyłki i nie da się tego wyłączyć.**

`node_modules/better-auth/dist/context/create-context.mjs:215-225`,
funkcja `runInBackgroundOrAwait`:

```js
async runInBackgroundOrAwait(promise) {
    try {
        if (options.advanced?.backgroundTasks?.handler) { … }
        else await promise;
    } catch (e) {
        logger.error("Failed to run background task:", e);
    }
}
```

Bez `advanced.backgroundTasks.handler` wysyłka jest **oczekiwana**, czyli
synchroniczna wobec żądania — ale wyjątek zostaje zamieniony na wpis w logu
i nic nie wraca w górę. Nazwa opcji myli: „background" dotyczy tylko tego,
czy jest handler; połknięcie błędu zachodzi w obu wariantach.

Przy rejestracji ta warstwa występuje **trzykrotnie**: `api/routes/sign-up.mjs:252`
→ `plugins/email-otp/index.mjs:26` → `plugins/email-otp/routes.mjs:107`.
Reset hasła przechodzi przez nią tak samo (`api/routes/password.mjs:82`).

Przeszukane typy: jedyna pokrewna opcja to `advanced.backgroundTasks.handler`,
która przyjmuje wyłącznie handler i której ustawienie **pogarsza** sprawę, bo
wysyłka przestaje być oczekiwana. Nie ma `onError` ani przełącznika propagacji.
Żaden endpoint wysyłający nie przepuszcza błędu: `auth.api.sendVerificationOTP`
zwraca `{success:true}` przy padniętym Resend.

## Decyzja

Bierzemy od biblioteki to, co robi dobrze — generowanie kodu, zapis skrótu,
datę wygaśnięcia, liczbę prób i późniejsze sprawdzenie — przez endpoint
`auth.api.createVerificationOTP` (`plugins/email-otp/routes.mjs:121-144`),
który **nic nie wysyła** i zwraca kod w jawnej postaci. Wysyłkę robimy sami
w `lib/konto/kody.ts`, więc błąd jest nasz i wraca do akcji serwerowej.

Trzy przełączniki w `OPCJE_WERYFIKACJI` (`lib/auth/index.ts`) gaszą trzy drogi,
którymi biblioteka wysyłała sama. Każdy ma własny test czytający tę stałą,
bo dwa z nich bronią tej samej ścieżki w koniunkcji i test na skutek padałby
dopiero po zdjęciu obu.

`requireEmailVerification` **zostaje włączone**: na nim stoi blokada logowania
niepotwierdzonych kont, a `sign-in.mjs:337` rzuca `EMAIL_NOT_VERIFIED` także
bez żadnej funkcji wysyłającej.

## Reguła, na której stoi obsługa błędów

**Komunikat wolno uzależnić wyłącznie od faktów niezależnych od wpisanego adresu.**

Podział błędów na konfiguracyjne i adresowe sam nie wystarcza. Przy resecie
hasła zdradza nie treść błędu, tylko **samo jego pojawienie się**: do próby
wysyłki dochodzi wyłącznie dla kont istniejących, więc „nie udało się wysłać"
znaczy „to konto istnieje". Formularz stałby się sprawdzarką adresów, czyli
złamałby przypadek 20 z `docs/uprawnienia.md`.

Stąd kolejność kroków w `lib/konto/kody.ts`, która jest regułą bezpieczeństwa,
nie stylem:

1. `pobierzNadawce()` **przed** zajrzeniem do bazy. Awaria konfiguracji wychodzi
   wtedy tak samo dla adresu istniejącego i nieistniejącego, więc wolno ją
   pokazać. Skutek uboczny i pożądany: przy zepsutej konfiguracji nie zostają
   w bazie kody, których nikt nie dostanie.
2. sprawdzenie konta,
3. utworzenie kodu i wysyłka. Awarie wykryte tutaj idą **wyłącznie do logu**.

Przy rejestracji ograniczenia nie ma: serwer właśnie utworzył konto na ten
adres, więc nie ma czego ukrywać. Ekran ponownego wysłania kodu podlega
regule resetu, bo adres bierze się tam z adresu strony, który każdy podmieni.

`tests/reset-hasla.test.ts` ma test, który pada dokładnie po przestawieniu
kroku 1 za krok 2.

## Dlaczego `sendVerificationOTP` został, a `sendResetPassword` wyleciał

`sendVerificationOTP` **jest wymagane przez typ wtyczki**, więc nie da się go
usunąć. Zostawiliśmy je jako kanarek: w środku jest `console.error`, nie
wysyłka. To nie jest siatka bezpieczeństwa — każde jego wywołanie idzie przez
warstwę połykającą błędy, więc jego awaria byłaby niewidoczna z definicji.
Siatka, której pęknięcia nikt nie zobaczy, nie jest siatką. Jedyne, co z tego
miejsca da się wycisnąć, to ślad w logach, gdy aktualizacja biblioteki znów
je zawoła.

`sendResetPassword` **usunęliśmy**, i to świadomie. Zostawione byłoby drugimi
drzwiami: żywym endpointem ustawiającym hasło linkiem, przez tę samą warstwę,
prowadzącym do ekranu przerobionego na kody. Dwie drogi do ustawienia hasła,
z których jedna jest nieutrzymywana i niewidoczna w testach, są gorsze niż
jedna. Bez tej funkcji `/request-password-reset` odmawia kodem
`RESET_PASSWORD_DISABLED`, czyli stara droga zamyka się głośno.

## Co jeszcze wynikło przy okazji

**Reset hasła ustawia `emailVerified`.** `resetPasswordEmailOTP` robi to sam
(`routes.mjs:601`). Jest to w porządku: kod przyszedł na ten adres, więc
dowodzi dostępu do skrzynki dokładnie tak samo jak kod potwierdzający.

**`auth.api` omija limiter better-auth.** `auth.api` to `getEndpoints`
(`auth/base.mjs:21`), a limiter siedzi w `router` (`api/index.mjs:165`).
Dlatego gałąź `kodHttp(blad) === 429` w akcji ponownego wysłania nigdy nie
miała jak się odpalić i tylko wyglądała na zabezpieczenie. Zastąpił ją własny
limiter na istniejącej tabeli `rate_limits`.

**`createVerificationOTP` nie sprawdza, czy konto istnieje** — inaczej niż
`sendVerificationOTP` (`routes.mjs:102-105`). Bez naszego sprawdzenia dowolny
wpisany adres zostawiałby wiersz w `verification` i dostawał od nas maila.

## Po aktualizacji better-auth

Sprawdź ponownie numery linii z tego dokumentu. Jeśli `runInBackgroundOrAwait`
zacznie przepuszczać błędy, część tej konstrukcji przestanie być potrzebna —
ale dopóki nie przepuszcza, trzy przełączniki i własna wysyłka zostają.
Testy w `tests/wysylka-kodu.test.ts` zauważą, gdyby biblioteka zaczęła wysyłać
sama.

## Diagnostyka

`pnpm poczta:sprawdz` odpytuje Resend o stan domeny nadawcy i mówi wprost,
czy da się wysłać pocztę do obcego człowieka, czy tylko na adres właściciela
konta. Kończy się kodem 1, gdy nie da się wcale.

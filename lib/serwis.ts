/**
 * Stałe opisujące sam serwis. Jedno miejsce, bo te teksty pojawiają się
 * na każdej stronie i w metadanych, a rozjechane brzmią jak dwa różne serwisy.
 */

export const NAZWA = "Gościnnie";

/**
 * Zdanie, które ma odpowiedzieć komuś, kto trafił tu z linku w SMS-ie
 * i nie wie, czyja to strona.
 *
 * Celowo NIE obiecuje ruchu ani zapytań od klientów. Dziś nie mamy ani jednego
 * zlecenia od prawdziwego klienta, a zdanie obiecujące ruch, którego nie ma,
 * wraca jako pretensja przy pierwszej rozmowie. Słabsza obietnica, ale taka,
 * której dotrzymamy.
 *
 * Wzmianka o okolicy Wrocławia tłumaczy przy okazji, dlaczego profil jest pusty:
 * katalog dopiero powstaje, a nie jest zaniedbany.
 */
export const CZYM_JESTESMY =
  "Katalog lokali i usługodawców na wesela, komunie, chrzciny i imprezy firmowe. " +
  "Budujemy go teraz w okolicy Wrocławia.";

/**
 * Wersja na wąski ekran, jedna linia.
 *
 * Na telefonie pełne zdanie zajmuje trzy linie i spycha nazwę firmy poniżej
 * zagięcia. Właściciel sali, który otworzył link z SMS-a, widziałby wtedy
 * najpierw reklamę obcego serwisu, a dopiero po przewinięciu własny szyld.
 * To jest dokładne odwrócenie tego, po co ta strona istnieje.
 *
 * Krótsza wersja nie obiecuje więcej niż pełna, tylko mówi mniej.
 */
export const CZYM_JESTESMY_KROTKO = "Katalog lokali i usługodawców na każdą okazję";

/**
 * Adres kontaktowy w stopce.
 *
 * JEDNA STAŁA, JEDNA LINIA DO PODMIANY. Tak ma zostać.
 *
 * Dopóki nie ma domeny, ma tu stać adres, który **naprawdę odbiera pocztę**.
 * Adres firmowy pod nieistniejącą domeną szkodzi bardziej niż zwykły: wygląda
 * poważnie i milczy, więc odbiorca uznaje, że firma go ignoruje, a nie że
 * dopiero zaczyna.
 *
 * Po kupieniu goscinnie.pl podmień to na adres w domenie. Lista pozostałych
 * rzeczy do zmiany przy tej okazji: docs/decyzje/008.
 *
 * DO USTAWIENIA: czeka na adres od Huberta. Do tego czasu nie wysyłaj linków
 * do profili osobom z zewnątrz.
 */
export const KONTAKT_EMAIL = "kontakt@goscinnie.pl";

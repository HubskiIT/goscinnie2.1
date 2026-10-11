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

/**
 * Płatności. Na starcie serwis jest w całości darmowy dla firm.
 *
 * Przy `false`:
 * 1. Cennik, wybór planu i ekrany płatności nie są nigdzie podlinkowane,
 *    a ich adresy kończą się stroną 404 albo powrotem do panelu.
 * 2. Publikacja profilu daje dostęp do `DARMOWY_DOSTEP_DO`, bez pytania o plan.
 *
 * Weryfikacja zostaje włączona niezależnie od tego przełącznika: potwierdzenie
 * adresu e-mail kodem i NIP z telefonem w kreatorze.
 *
 * Przełącznik jest stałą w kodzie, a nie zmienną środowiskową, celowo.
 * Włączenie płatności zmienia to, co firmy widzą i za co płacą, więc ma przejść
 * przez commit i przegląd, a nie przez kliknięcie w panelu hostingu.
 */
export const PLATNOSCI_WLACZONE = false;

/**
 * Do kiedy sięga darmowy dostęp nadawany przy publikacji, gdy płatności są
 * wyłączone.
 *
 * To nie jest obietnica dla firm ani data zakończenia darmowego okresu. To
 * górna granica zapisana w abonamencie, bo kolumna `expires_at` nie przyjmuje
 * pustej wartości. Przed włączeniem płatności trzeba świadomie zdecydować, do
 * kiedy firmy z darmowego okresu zachowują dostęp, i ustawić to migracją
 * danych dla wszystkich abonamentów z tego okresu naraz.
 */
export const DARMOWY_DOSTEP_DO = new Date("2027-12-31T23:59:59+01:00");

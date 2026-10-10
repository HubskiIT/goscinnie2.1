/**
 * Adres, pod którym stoi aplikacja.
 *
 * Dlaczego to ma własny plik zamiast jednej linii w sitemapie: wartość
 * wpisuje człowiek ręcznie w panelu Vercela, a `new URL(sciezka, adres)`
 * wymaga adresu **z protokołem**. Wpisanie „moja-domena.vercel.app” zamiast
 * „https://moja-domena.vercel.app” kończyło się `TypeError: Invalid URL`
 * w trakcie prerenderowania i **wywracało całe wdrożenie**, z komunikatem
 * wskazującym na kod sitemapy, a nie na zmienną, która była tu winna.
 *
 * Literówka w zmiennej środowiskowej nie ma prawa kosztować wdrożenia, więc
 * brakujący protokół uzupełniamy, zamiast się o niego wykładać.
 */

/** Adres używany, gdy zmiennej nie ma. Praca lokalna ma działać bez konfiguracji. */
const LOKALNY = "http://localhost:3000";

/**
 * Adres aplikacji, zawsze z protokołem i zawsze parsowalny przez `new URL`.
 *
 * Kolejność: `APP_URL`, potem adres wdrożenia od Vercela, na końcu localhost.
 * `VERCEL_URL` Vercel podaje **bez protokołu**, co jest dokładnie tym
 * przypadkiem, który ta funkcja obsługuje.
 */
/**
 * Zmienne środowiskowe, z których ta funkcja czyta.
 *
 * Zapis przez `Record`, a nie `{ APP_URL?: string }`, bo typ z samymi polami
 * opcjonalnymi jest w TypeScripcie „słaby" i `process.env` do niego nie pasuje.
 */
export type SrodowiskoAdresu = Readonly<Record<string, string | undefined>>;

export function adresAplikacji(srodowisko: SrodowiskoAdresu = process.env): string {
  const zmienna = srodowisko.APP_URL?.trim() || srodowisko.VERCEL_URL?.trim() || LOKALNY;

  const zProtokolem = zProtokolemNaPoczatku(zmienna);

  try {
    // Normalizacja przez URL: ucina ścieżkę i porządkuje zapis, żeby
    // „https://domena.pl/” i „https://domena.pl” dawały ten sam wynik.
    return new URL(zProtokolem).origin;
  } catch {
    /*
     * Wartość jest tak zepsuta, że nie da się jej uratować: spacja w środku,
     * sam protokół, pusty ciąg po przycięciu. Schodzimy na localhost zamiast
     * rzucać, bo błąd tutaj zatrzymuje budowanie, a jedyne, co z tego wynika,
     * to zły adres w sitemapie. Komunikat zostaje w logach wdrożenia.
     */
    console.warn(
      `APP_URL ma wartość, której nie da się odczytać jako adresu: ${JSON.stringify(zmienna)}. ` +
        `Sitemapa użyje ${LOKALNY}. Poprawny zapis to https://twoja-domena.pl`,
    );
    return LOKALNY;
  }
}

/** Dokłada `https://`, gdy adres nie ma własnego protokołu. */
function zProtokolemNaPoczatku(adres: string): string {
  // Protokół w rozumieniu URL: litera, potem litery, cyfry, plus, kropka, minus.
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(adres) ? adres : `https://${adres}`;
}

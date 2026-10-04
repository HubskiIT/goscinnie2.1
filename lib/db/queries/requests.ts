/**
 * Zapytania o zlecenia. Cały SQL dotyczący `requests` mieszka tutaj.
 *
 * Rzecz najważniejsza: dla widza, który nie ma prawa do opisu i budżetu,
 * te kolumny **nie trafiają do `select`**. Nie pobieramy ich i potem filtrujemy,
 * bo dane pobrane raz mają zwyczaj wyciekać przez logi, cache i pomyłkę
 * w mapowaniu. Czego nie pobrano, tego nie da się zgubić.
 *
 * KONWENCJA MODUŁU: każda eksportowana funkcja przyjmuje widza jako pierwszy
 * argument i odmawia, zanim dotknie pozostałych. Pilnuje tego
 * tests/konwencja-zapytan.test.ts, wyliczając eksporty tego pliku.
 */
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cities } from "@/lib/db/schema/geografia";
import { bids, requests } from "@/lib/db/schema/gielda";
import { eventTypes } from "@/lib/db/schema/katalog";
import { users } from "@/lib/db/schema/tozsamosc";
import { type Widz, widocznoscZlecenia } from "@/lib/permissions";

/** Zlecenie w wersji dla widza bez prawa do opisu i budżetu. */
export type ZlecenieJawne = {
  id: string;
  rodzajOkazji: string;
  dataWydarzenia: string;
  liczbaOsob: number;
  powiat: string;
  wojewodztwo: string;
  status: string;
};

/**
 * Zlecenie w wersji dla autora: pola jawne plus opis, budżet, miasto,
 * własne dane kontaktowe i liczba ofert.
 *
 * Liczba ofert jest tu, bo autor jest jedynym widzem, który ma do niej prawo.
 * Nie przenoś jej do typu jawnego ani do kolumny licznika w tabeli.
 */
export type ZlecenieAutora = ZlecenieJawne & {
  opis: string;
  budzetMin: number | null;
  budzetMax: number | null;
  miasto: string;
  kontaktEmail: string;
  kontaktTelefon: string | null;
  liczbaOfert: number;
};

export type ParametryListy = {
  limit: number;
  offset: number;
};

/** Zlecenie dla firmy bez abonamentu: pola jawne plus zajawka opisu. */
export type ZlecenieZZajawka = ZlecenieJawne & { opisZajawka: string };

/** Zlecenie dla firmy z abonamentem: pełny opis i budżet, bez liczby ofert. */
export type ZlecenieZAbonamentem = ZlecenieJawne & {
  opis: string;
  budzetMin: number | null;
  budzetMax: number | null;
};

/**
 * Lista zleceń w zakresie zależnym od widza.
 *
 * Suma rozłączna, a nie jeden typ z polami opcjonalnymi. Przy polach
 * opcjonalnych „opisu nie ma” i „opis jest pusty” wyglądają tak samo,
 * a to jest różnica między brakiem uprawnienia a brakiem treści.
 */
export type ListaDlaWidza =
  | { zakres: "jawny"; zlecenia: ZlecenieJawne[] }
  | { zakres: "zajawka"; zlecenia: ZlecenieZZajawka[] }
  | { zakres: "pelny"; zlecenia: ZlecenieZAbonamentem[] };

/** Wynik zapytania o pojedyncze zlecenie: zakres mówi, co dostał pytający. */
export type ZlecenieDlaWidza =
  | { zakres: "autor"; zlecenie: ZlecenieAutora }
  | { zakres: "jawny"; zlecenie: ZlecenieJawne | null };

/**
 * Sprawdza, że widz faktycznie nie ma prawa do opisu ani budżetu.
 *
 * Wywoływane przed każdym zapytaniem „jawnym”. Gdyby ktoś kiedyś podał tu widza
 * z szerszymi uprawnieniami, dostanie hałaśliwy błąd zamiast po cichu okrojonych
 * danych. Ten kierunek pomyłki jest tańszy: brak danych widać od razu,
 * nadmiar danych widać dopiero po wycieku.
 */
function upewnijSieZeWidzJawny(widz: Widz, funkcja: string): void {
  // Rzuca dla każdej gałęzi, której jeszcze nie zaimplementowano. Domyślna odmowa.
  const widocznosc = widocznoscZlecenia(widz);

  if (widocznosc.opis.rodzaj !== "brak" || widocznosc.budzet) {
    throw new Error(
      `${funkcja}: ten widz ma prawo do opisu albo budżetu, a to zapytanie ich ` +
        "nie pobiera. Użyj zapytania przeznaczonego dla tego widza zamiast rozszerzać to.",
    );
  }
}

/**
 * Publiczna lista zleceń. Zwraca wyłącznie pola jawne dla wszystkich.
 * Lokalizacja z dokładnością do powiatu, zgodnie z tabelą w docs/uprawnienia.md.
 *
 * Lista jest identyczna dla anonima i dla zalogowanego klienta. Samo zalogowanie
 * niczego nie odsłania. Autorstwo rozstrzyga się przy pojedynczym zleceniu.
 */
export async function pobierzListeZlecen(
  widz: Widz,
  parametry: ParametryListy,
): Promise<ZlecenieJawne[]> {
  upewnijSieZeWidzJawny(widz, "pobierzListeZlecen");

  return (
    db
      .select({
        id: requests.id,
        rodzajOkazji: eventTypes.name,
        dataWydarzenia: requests.eventDate,
        liczbaOsob: requests.guests,
        // Powiat, nie nazwa miasta i nie współrzędne. Anonim nie pozna adresu.
        powiat: cities.powiat,
        wojewodztwo: cities.wojewodztwo,
        status: requests.status,
      })
      .from(requests)
      .innerJoin(eventTypes, eq(requests.eventTypeId, eventTypes.id))
      .innerJoin(cities, eq(requests.cityId, cities.id))
      // Publiczna lista pokazuje wyłącznie zlecenia otwarte i jeszcze nieprzeterminowane.
      .where(and(eq(requests.status, "open"), sql`${requests.expiresAt} > now()`))
      .orderBy(desc(requests.createdAt))
      .limit(parametry.limit)
      .offset(parametry.offset)
  );
}

/** Wspólne warunki listy publicznej: otwarte i jeszcze nieprzeterminowane. */
function warunkiListyPublicznej() {
  return and(eq(requests.status, "open"), sql`${requests.expiresAt} > now()`);
}

/**
 * Lista zleceń dla firmy bez abonamentu.
 *
 * Zajawkę wycina **baza**, funkcją `left`. Cały opis nigdy nie opuszcza
 * Postgresa, więc nie ma go jak zgubić po drodze w logu, w cache ani
 * w pomyłce przy mapowaniu. Obcięcie w JavaScripcie oznaczałoby, że pełna
 * treść była już w pamięci procesu, a to jest dokładnie to, czego unikamy.
 */
async function listaZZajawka(znakow: number, parametry: ParametryListy) {
  return db
    .select({
      id: requests.id,
      rodzajOkazji: eventTypes.name,
      dataWydarzenia: requests.eventDate,
      liczbaOsob: requests.guests,
      powiat: cities.powiat,
      wojewodztwo: cities.wojewodztwo,
      status: requests.status,
      opisZajawka: sql<string>`left(${requests.description}, ${znakow})`,
    })
    .from(requests)
    .innerJoin(eventTypes, eq(requests.eventTypeId, eventTypes.id))
    .innerJoin(cities, eq(requests.cityId, cities.id))
    .where(warunkiListyPublicznej())
    .orderBy(desc(requests.createdAt))
    .limit(parametry.limit)
    .offset(parametry.offset);
}

/** Lista zleceń dla firmy z abonamentem: pełny opis i budżet. */
async function listaPelna(parametry: ParametryListy) {
  return db
    .select({
      id: requests.id,
      rodzajOkazji: eventTypes.name,
      dataWydarzenia: requests.eventDate,
      liczbaOsob: requests.guests,
      powiat: cities.powiat,
      wojewodztwo: cities.wojewodztwo,
      status: requests.status,
      opis: requests.description,
      budzetMin: requests.budgetMin,
      budzetMax: requests.budgetMax,
    })
    .from(requests)
    .innerJoin(eventTypes, eq(requests.eventTypeId, eventTypes.id))
    .innerJoin(cities, eq(requests.cityId, cities.id))
    .where(warunkiListyPublicznej())
    .orderBy(desc(requests.createdAt))
    .limit(parametry.limit)
    .offset(parametry.offset);
}

/**
 * Jedno wejście dla listy zleceń. Zakres wynika z reguły uprawnień,
 * a nie z tego, co wywołujący uzna za potrzebne.
 *
 * Endpoint nie wybiera zapytania sam, więc nie może wybrać źle. Dodanie
 * nowego widza bez zapytania kończy się tu hałaśliwym błędem, nie cichym
 * pokazaniem za dużo.
 */
export async function pobierzListeDlaWidza(
  widz: Widz,
  parametry: ParametryListy,
): Promise<ListaDlaWidza> {
  // Rzuca dla gałęzi bez implementacji. Domyślna odmowa przed dotknięciem bazy.
  const widocznosc = widocznoscZlecenia(widz);

  if (widocznosc.opis.rodzaj === "brak") {
    return { zakres: "jawny", zlecenia: await pobierzListeZlecen(widz, parametry) };
  }

  if (widocznosc.opis.rodzaj === "zajawka") {
    // Liczba znaków bierze się z reguły, nie ze stałej wpisanej tutaj.
    // Zmiana zajawki ma być zmianą w jednym pliku.
    return { zakres: "zajawka", zlecenia: await listaZZajawka(widocznosc.opis.znakow, parametry) };
  }

  if (!widocznosc.budzet) {
    throw new Error(
      "pobierzListeDlaWidza: widz ma prawo do całego opisu, ale nie do budżetu. " +
        "Taki zakres nie ma napisanego zapytania. Dopisz je zamiast zwracać bliższy.",
    );
  }

  return { zakres: "pelny", zlecenia: await listaPelna(parametry) };
}

/**
 * Pojedyncze zlecenie w wersji jawnej. `null`, gdy nie ma takiego zlecenia
 * albo nie jest publicznie widoczne.
 *
 * Zlecenie wygasłe zwracamy jako `null`, a nie jako „istnieje, ale zamknięte”.
 * Inaczej samo rozróżnienie 404 od 200 stałoby się kanałem informacji o tym,
 * czy dane zlecenie w ogóle istnieje.
 */
export async function pobierzZlecenie(widz: Widz, id: string): Promise<ZlecenieJawne | null> {
  upewnijSieZeWidzJawny(widz, "pobierzZlecenie");

  const wiersze = await db
    .select({
      id: requests.id,
      rodzajOkazji: eventTypes.name,
      dataWydarzenia: requests.eventDate,
      liczbaOsob: requests.guests,
      powiat: cities.powiat,
      wojewodztwo: cities.wojewodztwo,
      status: requests.status,
    })
    .from(requests)
    .innerJoin(eventTypes, eq(requests.eventTypeId, eventTypes.id))
    .innerJoin(cities, eq(requests.cityId, cities.id))
    .where(
      and(eq(requests.id, id), eq(requests.status, "open"), sql`${requests.expiresAt} > now()`),
    )
    .limit(1);

  return wiersze[0] ?? null;
}

/**
 * Zlecenie w pełnym zakresie, wyłącznie dla jego autora.
 *
 * Zakres bierze się z `lib/permissions.ts`, nie z porównania identyfikatorów
 * w tym pliku. Porównanie w `where` jest drugą barierą, nie pierwszą: gdyby
 * ktoś kiedyś obszedł sprawdzenie wyżej, baza i tak nic nie odda.
 *
 * Autor widzi też własne zlecenie zamknięte i wygasłe. To jego zlecenie
 * i historia własnych zapytań nie jest przed nim ukrywana.
 */
export async function pobierzWlasneZlecenie(
  widz: Widz,
  id: string,
): Promise<ZlecenieAutora | null> {
  // Rzuca dla firmy i moderatora. Domyślna odmowa działa także tutaj.
  const widocznosc = widocznoscZlecenia(widz);

  if (widocznosc.opis.rodzaj !== "caly" || !widocznosc.budzet) {
    // Anonim i zalogowany klient, który nie jest autorem. Odpowiedzią jest
    // brak zlecenia, a nie okrojone dane: to zapytanie nie ma trybu „trochę”.
    return null;
  }

  if (widz.rodzaj !== "autor") {
    throw new Error(
      "pobierzWlasneZlecenie: widz ma prawo do pełnego zakresu, ale nie jest autorem. " +
        "To znaczy, że w lib/permissions.ts pojawiła się gałąź, dla której ta funkcja " +
        "nie ma napisanego zapytania.",
    );
  }

  const wiersze = await db
    .select({
      id: requests.id,
      rodzajOkazji: eventTypes.name,
      dataWydarzenia: requests.eventDate,
      liczbaOsob: requests.guests,
      powiat: cities.powiat,
      wojewodztwo: cities.wojewodztwo,
      status: requests.status,
      opis: requests.description,
      budzetMin: requests.budgetMin,
      budzetMax: requests.budgetMax,
      miasto: cities.name,
      kontaktEmail: users.email,
      kontaktTelefon: users.phone,
    })
    .from(requests)
    .innerJoin(eventTypes, eq(requests.eventTypeId, eventTypes.id))
    .innerJoin(cities, eq(requests.cityId, cities.id))
    .innerJoin(users, eq(requests.authorUserId, users.id))
    .where(and(eq(requests.id, id), eq(requests.authorUserId, widz.userId)))
    .limit(1);

  const zlecenie = wiersze[0];
  if (!zlecenie) return null;

  const [licznik] = await db
    .select({ ile: count() })
    .from(bids)
    .where(eq(bids.requestId, zlecenie.id));

  return { ...zlecenie, liczbaOfert: licznik?.ile ?? 0 };
}

/**
 * Identyfikator autora zlecenia. `null`, gdy zlecenia nie ma.
 *
 * Służy wyłącznie do ustalenia, czy pytający jest autorem, i nigdy nie trafia
 * do odpowiedzi API. Widza przyjmuje zgodnie z konwencją modułu, ale nie używa
 * go do filtrowania: potrzebny jest tu wyłącznie po to, żeby gałąź bez
 * implementacji odmówiła, zanim funkcja dotknie bazy.
 */
export async function autorZlecenia(widz: Widz, id: string): Promise<string | null> {
  // Domyślna odmowa przed dotknięciem bazy.
  widocznoscZlecenia(widz);

  const wiersze = await db
    .select({ authorUserId: requests.authorUserId })
    .from(requests)
    .where(eq(requests.id, id))
    .limit(1);

  return wiersze[0]?.authorUserId ?? null;
}

/**
 * Jedno wejście dla endpointu szczegółów zlecenia.
 *
 * Endpoint nie zgaduje, którego zapytania użyć, więc nie może się w tym pomylić.
 * Funkcja `podnies` przychodzi z lib/auth/widz.ts i jest jedynym miejscem,
 * w którym klient staje się autorem.
 */
export async function pobierzZlecenieDlaWidza(
  widz: Widz,
  id: string,
  podnies: (widz: Widz, autorUserId: string) => Widz,
): Promise<ZlecenieDlaWidza> {
  const autorUserId = await autorZlecenia(widz, id);

  if (autorUserId) {
    const widzWKontekscie = podnies(widz, autorUserId);
    if (widzWKontekscie.rodzaj === "autor") {
      const wlasne = await pobierzWlasneZlecenie(widzWKontekscie, id);
      if (wlasne) return { zakres: "autor", zlecenie: wlasne };
    }
  }

  return { zakres: "jawny", zlecenie: await pobierzZlecenie(widz, id) };
}

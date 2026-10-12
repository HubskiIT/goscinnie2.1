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
import {
  mozeDodacZlecenie,
  type PowodOdmowy,
  upewnijSieZeGalazUprawnienIstnieje,
  type Widz,
  widocznoscZlecenia,
} from "@/lib/permissions";

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

/**
 * Jak długo zlecenie wisi na giełdzie, licząc od wystawienia.
 *
 * Miesiąc, bo po tym czasie nikt już go nie obsłuży, a wiszące w nieskończoność
 * zlecenia zamieniają giełdę w archiwum, po którym firmy przestają zaglądać.
 */
export const WAZNOSC_ZLECENIA_DNI = 30;

/** Powody odmowy przy wystawianiu zlecenia. */
export type OdmowaZlecenia = PowodOdmowy | "miejscowosc-bez-wspolrzednych" | "nieznana-okazja";

/** Wejście do `utworzZlecenie`. Kwoty już w groszach, bo przeliczył je Zod. */
export type DaneNowegoZlecenia = {
  okazja: string;
  dataWydarzenia: string;
  liczbaOsob: number;
  cityId: string;
  opis: string;
  budzetMin: number | null;
  budzetMax: number | null;
};

/**
 * Wystawienie zlecenia przez klienta.
 *
 * Trzy rzeczy, których ta funkcja **nie bierze z wejścia**, i to jest sedno:
 *
 * 1. **autora** — wyłącznie z widza. Identyfikator przysłany formularzem jest
 *    danymi, nie tożsamością. Gdyby autor pochodził z wejścia, każdy mógłby
 *    wystawić zlecenie w cudzym imieniu i czytać oferty złożone komuś innemu.
 * 2. **współrzędnych** — wyłącznie z wiersza miejscowości, podzapytaniem.
 *    Punkt z przeglądarki znaczyłby, że zlecenie da się postawić gdziekolwiek.
 * 3. **daty wygaśnięcia** — liczy ją baza. Wszystkie odczyty porównują
 *    z `now()` bazy, więc policzenie tego w Node wprowadziłoby drugi zegar.
 */
export async function utworzZlecenie(
  widz: Widz,
  dane: DaneNowegoZlecenia,
): Promise<{ ok: true; dane: { id: string } } | { ok: false; powod: OdmowaZlecenia }> {
  const rozstrzygniecie = mozeDodacZlecenie(widz);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };

  /*
   * Zawężenie typu: TypeScript nie wie, że `mozeDodacZlecenie` odrzuciło już
   * anonima, a `widz.userId` istnieje dopiero po tym warunku.
   *
   * Przy okazji jest to siatka pod regułą uprawnień i to sprawdzone, nie
   * deklarowane: po przepuszczeniu anonima w `mozeDodacZlecenie` test
   * „anonim dostaje odmowę i nie powstaje żaden wiersz” dalej przechodzi,
   * bo zatrzymuje go ten warunek.
   *
   * Czego ta linia NIE jest: samodzielnie sprawdzalną barierą. Zdjęta sama,
   * przy działającej regule uprawnień, jest nieosiągalna i żaden test tego
   * nie zauważy. Nie dopisuj tu więcej takich warunków w przekonaniu, że
   * każdy coś chroni.
   */
  if (widz.rodzaj === "anonim") return { ok: false, powod: "brak-dostepu" };

  const [okazja] = await db
    .select({ id: eventTypes.id })
    .from(eventTypes)
    .where(eq(eventTypes.slug, dane.okazja))
    .limit(1);

  // Okazja spoza słownika to odmowa, nie zlecenie z przypadkową okazją.
  if (!okazja) return { ok: false, powod: "nieznana-okazja" };

  const [miejscowosc] = await db
    .select({ id: cities.id, maPunkt: sql<boolean>`${cities.point} is not null` })
    .from(cities)
    .where(eq(cities.id, dane.cityId))
    .limit(1);

  if (!miejscowosc) return { ok: false, powod: "brak-dostepu" };

  /*
   * 533 miejscowości z PRNG nie mają współrzędnych. Zlecenia bez punktu nie
   * znajdzie żadne wyszukiwanie po promieniu, a punkt zerowy wysyła je na
   * Zatokę Gwinejską i do wyników każdego promienia liczonego od zera.
   * To samo uzasadnienie co przy lokalizacji firmy w kreatorze.
   */
  if (!miejscowosc.maPunkt) return { ok: false, powod: "miejscowosc-bez-wspolrzednych" };

  const [wstawione] = await db
    .insert(requests)
    .values({
      authorUserId: widz.userId,
      eventTypeId: okazja.id,
      eventDate: dane.dataWydarzenia,
      guests: dane.liczbaOsob,
      cityId: miejscowosc.id,
      point: sql`(select ${cities.point} from ${cities} where ${cities.id} = ${dane.cityId})`,
      description: dane.opis,
      budgetMin: dane.budzetMin,
      budgetMax: dane.budzetMax,
      /*
       * Dwa warunki naraz: zlecenie nie wisi dłużej niż miesiąc i nie wisi
       * po dacie wydarzenia. `least` bierze wcześniejszy z nich.
       */
      expiresAt: sql`least(
        (${dane.dataWydarzenia}::date + interval '1 day')::timestamptz,
        now() + make_interval(days => ${WAZNOSC_ZLECENIA_DNI})
      )`,
    })
    .returning({ id: requests.id });

  if (!wstawione) return { ok: false, powod: "brak-dostepu" };

  return { ok: true, dane: { id: wstawione.id } };
}

/**
 * Zlecenia, których autorem jest pytający.
 *
 * Zakres autorski, czyli z opisem, budżetem i liczbą ofert: autor jest
 * jedynym widzem, który ma prawo do tej liczby.
 *
 * Dwie bariery, obie potrzebne i obie sprawdzane osobno:
 * `upewnijSieZeGalazUprawnienIstnieje` odrzuca gałąź, której nie napisano,
 * a `where` na `authorUserId` pilnuje, żeby nie wpadło tu cudze zlecenie,
 * nawet gdyby pierwsza kiedyś puściła.
 *
 * Zlecenia zamknięte i wygasłe też wracają: dla autora to jego historia,
 * a nie śmieci do ukrycia.
 */
export async function pobierzMojeZlecenia(widz: Widz): Promise<ZlecenieAutora[]> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "pobierzMojeZlecenia");

  // Anonim nie ma własnych zleceń. Pusta lista, nie wyjątek: ekran panelu
  // i tak odsyła niezalogowanego do logowania.
  if (widz.rodzaj === "anonim") return [];

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
      liczbaOfert: sql<number>`(select count(*)::int from ${bids} where ${bids.requestId} = ${requests.id})`,
    })
    .from(requests)
    .innerJoin(eventTypes, eq(requests.eventTypeId, eventTypes.id))
    .innerJoin(cities, eq(requests.cityId, cities.id))
    .innerJoin(users, eq(requests.authorUserId, users.id))
    .where(eq(requests.authorUserId, widz.userId))
    .orderBy(desc(requests.createdAt));

  return wiersze;
}

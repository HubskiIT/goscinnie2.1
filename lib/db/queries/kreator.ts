/**
 * Zapytania kreatora zakładania firmy. Cały SQL kolejnych kroków mieszka tutaj.
 *
 * KONWENCJA MODUŁU: każda eksportowana funkcja przyjmuje widza jako pierwszy
 * argument i odmawia, zanim dotknie pozostałych. Pilnuje tego
 * tests/konwencja-zapytan.test.ts.
 *
 * Kreator różni się od edycji profilu jedną rzeczą: na początku firmy jeszcze
 * nie ma, więc nie ma też członkostwa, z którego bierze się prawo do zapisu.
 * Dlatego pierwszy krok sprawdza wyłącznie, czy pyta zalogowany człowiek,
 * a każdy następny — czy jest członkiem **tej** firmy, przez
 * `mozeEdytowacProfil` z lib/permissions.ts. Innej drogi do zapisu nie ma.
 */
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { plans, subscriptions } from "@/lib/db/schema/abonament";
import { cities } from "@/lib/db/schema/geografia";
import {
  categories,
  companies,
  companyCategories,
  companyMembers,
  companyVerification,
} from "@/lib/db/schema/katalog";
import {
  mozeEdytowacProfil,
  type PowodOdmowy,
  upewnijSieZeGalazUprawnienIstnieje,
  type Widz,
} from "@/lib/permissions";

export type Odmowa = { ok: false; powod: PowodOdmowy };
export type Wynik<T> = { ok: true; dane: T } | Odmowa;

/**
 * Stan szkicu, na którym stoi kreator. Czytany przy wejściu na stronę, żeby
 * odświeżenie przeglądarki nie zaczynało zakładania firmy od nowa.
 */
export type SzkicFirmy = {
  id: string;
  nazwa: string;
  slug: string;
  opis: string;
  cenaOd: number | null;
  pojemnoscMin: number | null;
  pojemnoscMax: number | null;
  status: "draft" | "active" | "visitcard" | "suspended";
  /** Slug kategorii, `null` gdy jeszcze żadnej nie wybrano. */
  kategoria: string | null;
  /** `null`, dopóki krok lokalizacji nie zapisał prawdziwej miejscowości. */
  miejscowosc: string | null;
  /** Identyfikator miejscowości. Znaczy coś tylko przy `maWspolrzedne`. */
  cityId: string;
  maWspolrzedne: boolean;
  maNip: boolean;
};

/**
 * Slug nadawany firmie, dopóki nie znamy jej nazwy.
 *
 * `companies.slug` jest `not null unique`, a nazwa pojawia się dopiero w kroku
 * trzecim, więc pierwszy krok musi czymś to pole wypełnić. Prefiks jest
 * rozpoznawalny, żeby dało się odróżnić szkic bez nazwy od firmy, która
 * nazywa się tak naprawdę.
 */
const PREFIKS_SLUGU_SZKICU = "szkic-";

/**
 * Punkt, którym wypełniamy `companies.point` w szkicu bez lokalizacji.
 *
 * Kolumna jest `not null` i ma indeks GiST, bo bez niego wyszukiwanie po
 * promieniu zabija bazę. Szkic nie zna jeszcze miejscowości, więc czymś ją
 * wypełnić trzeba. Ta stała jest **jedynym** miejscem, które o tym wie:
 * `pobierzSzkicFirmy` po niej rozpoznaje brak lokalizacji, a krok lokalizacji
 * ją nadpisuje. Szkic i tak nie wchodzi do wyników wyszukiwania, bo te
 * filtrują po statusie.
 */
const PUNKT_ZEROWY = sql`st_geogfromtext('SRID=4326;POINT(0 0)')`;

/** Ile razy próbujemy doczepić licznik do zajętego sluga, zanim się poddamy. */
const PROB_UNIKALNEGO_SLUGU = 50;

/**
 * Czy ten człowiek należy do tej firmy. Jedyne źródło prawa do zapisu
 * w kolejnych krokach kreatora.
 */
async function czyNalezy(userId: string, companyId: string): Promise<boolean> {
  const [wiersz] = await db
    .select({ id: companyMembers.id })
    .from(companyMembers)
    .where(and(eq(companyMembers.userId, userId), eq(companyMembers.companyId, companyId)))
    .limit(1);

  return Boolean(wiersz);
}

/** Identyfikator użytkownika z widza. `null` dla anonima. */
function userIdWidza(widz: Widz): string | null {
  return widz.rodzaj === "anonim" ? null : widz.userId;
}

/**
 * Wspólny początek każdego kroku poza pierwszym: znajdź firmę i sprawdź,
 * czy pytający ma prawo ją zmieniać.
 *
 * Firma nieistniejąca i firma cudza dają tę samą odmowę. Rozróżnienie
 * powiedziałoby pytającemu, że pod tym identyfikatorem coś jest, a tego
 * nie musi wiedzieć nikt poza jej członkami.
 */
async function firmaDoZapisu(
  widz: Widz,
  companyId: string,
): Promise<Wynik<{ id: string; name: string; slug: string }>> {
  const [firma] = await db
    .select({ id: companies.id, name: companies.name, slug: companies.slug })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (!firma) return { ok: false, powod: "brak-dostepu" };

  const userId = userIdWidza(widz);
  const czlonek = userId ? await czyNalezy(userId, firma.id) : false;

  const rozstrzygniecie = mozeEdytowacProfil(widz, czlonek);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };

  return { ok: true, dane: firma };
}

/**
 * Szkic firmy, do którego należy ten człowiek. `null`, gdy jeszcze żadnej
 * nie zakładał.
 *
 * Stąd kreator wie, na którym kroku wznowić po odświeżeniu strony. Bez tego
 * odświeżenie między krokami zaczynało zakładanie od nowa i zostawiało
 * w bazie drugi szkic.
 */
export async function pobierzSzkicFirmy(widz: Widz): Promise<SzkicFirmy | null> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "pobierzSzkicFirmy");

  const userId = userIdWidza(widz);
  if (!userId) return null;

  const [firma] = await db
    .select({
      id: companies.id,
      nazwa: companies.name,
      slug: companies.slug,
      opis: companies.description,
      cenaOd: companies.priceFrom,
      pojemnoscMin: companies.capacityMin,
      pojemnoscMax: companies.capacityMax,
      status: companies.status,
      miejscowosc: cities.name,
      cityId: companies.cityId,
      /*
       * Czy firma stoi już na mapie, czy nadal na zerowym południku.
       *
       * Szkic zakładany w kroku pierwszym nie zna jeszcze miejscowości,
       * a kolumna jest `not null`, więc dostaje punkt zerowy. Ten warunek
       * odróżnia „nie podano lokalizacji” od „podano”, bez wystawiania
       * współrzędnych na zewnątrz.
       */
      maWspolrzedne: sql<boolean>`${companies.point} is distinct from ${PUNKT_ZEROWY}`,
      maNip: sql<boolean>`${companyVerification.id} is not null`,
      kategoria: categories.slug,
    })
    .from(companies)
    .innerJoin(companyMembers, eq(companyMembers.companyId, companies.id))
    .leftJoin(cities, eq(cities.id, companies.cityId))
    .leftJoin(companyVerification, eq(companyVerification.companyId, companies.id))
    .leftJoin(
      companyCategories,
      and(eq(companyCategories.companyId, companies.id), isNull(companyCategories.archivedAt)),
    )
    .leftJoin(categories, eq(categories.id, companyCategories.categoryId))
    /*
     * Szkic albo profil już opublikowany. Ten sam kreator służy do pierwszej
     * publikacji i do późniejszych poprawek, więc opublikowana firma też musi
     * się tu znaleźć. Szkic ma pierwszeństwo: kto zaczął nową firmę, wraca do
     * niej, a nie do starej.
     */
    .where(and(eq(companyMembers.userId, userId), inArray(companies.status, ["draft", "active"])))
    .orderBy(sql`${companies.status} = 'draft' desc`, asc(companies.createdAt))
    .limit(1);

  if (!firma) return null;

  return {
    ...firma,
    // Miejscowość szkicu bez lokalizacji nic nie znaczy: wskazuje wiersz,
    // który krok pierwszy wybrał tylko po to, żeby wypełnić `not null`.
    miejscowosc: firma.maWspolrzedne ? firma.miejscowosc : null,
  };
}

export type NowySzkic = { companyId: string };

/**
 * Krok pierwszy: szkic firmy z wybraną kategorią.
 *
 * Wywołany drugi raz **nie zakłada drugiej firmy**, tylko podmienia kategorię
 * w istniejącym szkicu. Bez tego cofnięcie się w kreatorze i ponowne kliknięcie
 * „Dalej” zostawiało w bazie dwa szkice, z których jeden nigdy nie dostawał
 * ani nazwy, ani lokalizacji.
 *
 * `slugKategorii` jest slugiem ze słownika, nie identyfikatorem: formularz
 * nie ma skąd znać UUID-ów, a `categories.slug` jest unikalny.
 */
export async function zapiszKategorieSzkicu(
  widz: Widz,
  slugKategorii: string,
): Promise<Wynik<NowySzkic>> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "zapiszKategorieSzkicu");

  const userId = userIdWidza(widz);
  // Szkic zakłada tylko zalogowany człowiek. Anonim nie ma na co go zapisać.
  if (!userId) return { ok: false, powod: "brak-dostepu" };

  const [kategoria] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slugKategorii))
    .limit(1);

  // Kategoria spoza słownika: odmowa, a nie szkic bez kategorii. Firma bez
  // kategorii nie pojawia się w katalogu, więc cicha zgoda byłaby gorsza.
  if (!kategoria) return { ok: false, powod: "brak-dostepu" };

  const istniejacy = await pobierzSzkicFirmy(widz);

  if (istniejacy) {
    const dostep = await firmaDoZapisu(widz, istniejacy.id);
    if (!dostep.ok) return dostep;

    await podmienKategorie(istniejacy.id, kategoria.id);
    return { ok: true, dane: { companyId: istniejacy.id } };
  }

  /*
   * Zastępcza miejscowość wypełnia `city_id`, bo kolumna jest `not null`,
   * a prawdziwej miejscowości nie znamy aż do kroku trzeciego. Sam wiersz nic
   * nie znaczy i nie jest nigdzie pokazywany: `pobierzSzkicFirmy` zwraca
   * `miejscowosc: null`, dopóki `point` stoi na punkcie zerowym.
   *
   * Wybór jest **deterministyczny i tylko spośród miejscowości ze
   * współrzędnymi**, a nie „pierwsza z tabeli”. Sortowanie po `id` brało
   * losowy UUID, więc szkic trafiał raz tu, raz tam, a co jakiś czas na jedną
   * z 533 miejscowości bez współrzędnych. To ostatnie wiązało szkic z wierszem,
   * którego nie da się potem usunąć ani wypełnić, i objawiało się awarią
   * w zupełnie innym miejscu, raz na kilka uruchomień.
   */
  const [jakakolwiekMiejscowosc] = await db
    .select({ id: cities.id })
    .from(cities)
    .where(sql`${cities.point} is not null`)
    .orderBy(cities.slug)
    .limit(1);

  if (!jakakolwiekMiejscowosc) {
    throw new Error(
      "Tabela cities jest pusta, więc nie ma czym wypełnić city_id szkicu. " +
        "Uruchom pnpm db:slowniki.",
    );
  }

  return await db.transaction(async (tx) => {
    const [firma] = await tx
      .insert(companies)
      .values({
        ownerUserId: userId,
        name: "",
        slug: `${PREFIKS_SLUGU_SZKICU}${crypto.randomUUID()}`,
        cityId: jakakolwiekMiejscowosc.id,
        point: sql`${PUNKT_ZEROWY}`,
        status: "draft",
      })
      .returning({ id: companies.id });

    if (!firma) throw new Error("zapiszKategorieSzkicu: zapis firmy nie zwrócił wiersza.");

    await tx.insert(companyMembers).values({
      companyId: firma.id,
      userId,
      role: "owner",
    });

    await tx
      .insert(companyCategories)
      .values({ companyId: firma.id, categoryId: kategoria.id })
      .onConflictDoUpdate({
        target: [companyCategories.companyId, companyCategories.categoryId],
        set: { archivedAt: null },
      });

    return { ok: true, dane: { companyId: firma.id } };
  });
}

/**
 * Podmiana jednej kategorii szkicu na inną, bez usuwania wierszy.
 *
 * Zasada 5 zabrania twardego usuwania danych biznesowych, a przypisanie do
 * kategorii nią jest: decyduje o tym, gdzie firma pojawia się w katalogu.
 * Zdjęcie kategorii to ustawienie `archived_at`, więc powrót do wcześniej
 * wybranej kategorii zeruje tę datę zamiast wstawiać drugi wiersz.
 */
async function podmienKategorie(companyId: string, categoryId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const teraz = new Date();

    await tx
      .update(companyCategories)
      .set({ archivedAt: teraz })
      .where(and(eq(companyCategories.companyId, companyId), isNull(companyCategories.archivedAt)));

    await tx
      .insert(companyCategories)
      .values({ companyId, categoryId })
      .onConflictDoUpdate({
        target: [companyCategories.companyId, companyCategories.categoryId],
        set: { archivedAt: null },
      });
  });
}

export type DaneOpisu = {
  nazwa: string;
  opis: string;
  /** W groszach. `null` znaczy „do uzupełnienia”, nie „za darmo”. */
  cenaOd: number | null;
  pojemnoscMin: number | null;
  pojemnoscMax: number | null;
};

/**
 * Krok drugi: nazwa, opis, cena i pojemność. Tu też nadajemy slug, bo tu
 * po raz pierwszy znamy nazwę.
 *
 * Slug zmieniamy **wyłącznie**, dopóki firma go nie ma na serio. Decyzja 005
 * mówi, że slug jest niezmienny, bo jego zmiana kosztuje połowę ruchu na kilka
 * miesięcy. Szkic jeszcze nie ma ruchu, więc dopóki slug zaczyna się od
 * prefiksu szkicu, wolno go ustalić. Potem już nie.
 */
export async function zapiszOpisSzkicu(
  widz: Widz,
  companyId: string,
  dane: DaneOpisu,
): Promise<Wynik<{ slug: string }>> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "zapiszOpisSzkicu");

  const dostep = await firmaDoZapisu(widz, companyId);
  if (!dostep.ok) return dostep;

  const slug = dostep.dane.slug.startsWith(PREFIKS_SLUGU_SZKICU)
    ? await wolnySlug(dane.nazwa, companyId)
    : dostep.dane.slug;

  await db
    .update(companies)
    .set({
      name: dane.nazwa,
      slug,
      description: dane.opis,
      priceFrom: dane.cenaOd,
      capacityMin: dane.pojemnoscMin,
      capacityMax: dane.pojemnoscMax,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, companyId));

  return { ok: true, dane: { slug } };
}

/**
 * Lokalizacja: miejscowość ze słownika i współrzędne z jej wiersza.
 *
 * Współrzędne bierzemy z `cities.point`, a nie z formularza. Przeglądarka nie
 * ma skąd znać położenia sali, a punkt przysłany z klienta byłby polem, które
 * da się ustawić dowolnie i tym samym wejść w wyniki wyszukiwania po promieniu
 * dla cudzego miasta.
 */
export type OdmowaLokalizacji = PowodOdmowy | "miejscowosc-bez-wspolrzednych";

export async function zapiszLokalizacjeSzkicu(
  widz: Widz,
  companyId: string,
  cityId: string,
): Promise<{ ok: true } | { ok: false; powod: OdmowaLokalizacji }> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "zapiszLokalizacjeSzkicu");

  const dostep = await firmaDoZapisu(widz, companyId);
  if (!dostep.ok) return dostep;

  const [miejscowosc] = await db
    .select({ id: cities.id, maPunkt: sql<boolean>`${cities.point} is not null` })
    .from(cities)
    .where(eq(cities.id, cityId))
    .limit(1);

  if (!miejscowosc) return { ok: false, powod: "brak-dostepu" };

  /*
   * 533 miejscowości w PRNG nie mają współrzędnych. Firma bez współrzędnych
   * nie da się znaleźć po promieniu, a wpisanie jej punktu zerowego wysyła ją
   * na środek Atlantyku i do wyników dla każdego promienia liczonego od
   * Zatoki Gwinejskiej. Lepsza jawna odmowa z prośbą o najbliższą większą
   * miejscowość niż firma, której nikt nie znajdzie.
   */
  if (!miejscowosc.maPunkt) {
    return { ok: false, powod: "miejscowosc-bez-wspolrzednych" };
  }

  await db
    .update(companies)
    .set({
      cityId: miejscowosc.id,
      point: sql`(select ${cities.point} from ${cities} where ${cities.id} = ${cityId})`,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, companyId));

  return { ok: true };
}

export type DaneWeryfikacji = { nip: string; telefon: string };

/**
 * NIP i telefon. Powtórne przejście kroku nadpisuje poprzednie zgłoszenie,
 * a nie dokłada drugiego wiersza: `company_id` jest unikalny.
 *
 * `verified_at` zostaje nietknięte przy nadpisaniu, bo o weryfikacji
 * rozstrzyga moderacja, nie ten formularz.
 */
export async function zapiszWeryfikacjeSzkicu(
  widz: Widz,
  companyId: string,
  dane: DaneWeryfikacji,
): Promise<Wynik<null>> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "zapiszWeryfikacjeSzkicu");

  const dostep = await firmaDoZapisu(widz, companyId);
  if (!dostep.ok) return dostep;

  await db
    .insert(companyVerification)
    .values({ companyId, nip: dane.nip, telefon: dane.telefon })
    .onConflictDoUpdate({
      target: companyVerification.companyId,
      set: { nip: dane.nip, telefon: dane.telefon, updatedAt: new Date() },
    });

  return { ok: true, dane: null };
}

/** Czego brakuje, żeby szkic dał się opublikować. Pusta lista znaczy „gotowy”. */
export type Braki = Array<"kategoria" | "nazwa" | "opis" | "lokalizacja" | "nip">;

export type GotowoscSzkicu = { companyId: string; braki: Braki; kategoria: string | null };

/**
 * Czy szkic ma komplet danych do publikacji.
 *
 * Sprawdzane po stronie serwera, a nie przez to, że kreator przeprowadził
 * człowieka przez wszystkie kroki. Kroki da się pominąć, wchodząc wprost
 * na `?krok=5`, a firma bez lokalizacji albo bez kategorii nie pojawi się
 * ani w wyszukiwaniu, ani w katalogu.
 */
export async function sprawdzGotowoscSzkicu(widz: Widz): Promise<Wynik<GotowoscSzkicu>> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "sprawdzGotowoscSzkicu");

  const szkic = await pobierzSzkicFirmy(widz);
  if (!szkic) return { ok: false, powod: "brak-dostepu" };

  const braki: Braki = [];
  if (!szkic.kategoria) braki.push("kategoria");
  if (!szkic.nazwa.trim()) braki.push("nazwa");
  if (!szkic.opis.trim()) braki.push("opis");
  if (!szkic.maWspolrzedne) braki.push("lokalizacja");
  if (!szkic.maNip) braki.push("nip");

  return { ok: true, dane: { companyId: szkic.id, braki, kategoria: szkic.kategoria } };
}

/**
 * Publikacja szkicu: status na `active` i abonament na podany okres.
 *
 * Plan bierzemy z kategorii firmy, bo `plans.category_id` jest `not null`:
 * nie ma jednego cennika dla sali i dla DJ-a. Wcześniejsza wersja wpisywała
 * tu zerowy UUID, co kończyło się naruszeniem klucza obcego przy każdej
 * próbie publikacji.
 *
 * Wszystko w jednej transakcji: firma `active` bez abonamentu to firma
 * z dostępem, za który nikt nie zapłacił.
 */
export async function opublikujSzkic(
  widz: Widz,
  companyId: string,
  wygasaO: Date,
): Promise<Wynik<null>> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "opublikujSzkic");

  const dostep = await firmaDoZapisu(widz, companyId);
  if (!dostep.ok) return dostep;

  /*
   * Profil już opublikowany: ostatni krok kreatora jest wtedy zapisaniem
   * poprawek, a nie publikacją. Drugi abonament dla tej samej firmy przy
   * każdej poprawce opisu byłby śmieciem w rozliczeniach, a przy włączonych
   * płatnościach przedłużałby dostęp za darmo.
   */
  const [obecny] = await db
    .select({ status: companies.status })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  if (obecny?.status === "active") return { ok: true, dane: null };

  const [plan] = await db
    .select({ id: plans.id })
    .from(companyCategories)
    .innerJoin(plans, eq(plans.categoryId, companyCategories.categoryId))
    .where(
      and(
        eq(companyCategories.companyId, companyId),
        isNull(companyCategories.archivedAt),
        eq(plans.code, "start"),
      ),
    )
    .limit(1);

  /*
   * Brak planu dla kategorii to niekompletny cennik, czyli błąd po naszej
   * stronie, a nie stan, w którym firma ma cokolwiek do zrobienia. Dlatego
   * wyjątek, nie `brak-abonamentu`: ten powód daje 402 i ekran sprzedażowy,
   * a wystawienie go tutaj kazałoby firmie kupować plan, którego nie ma
   * w cenniku, i ukryłoby prawdziwą przyczynę.
   */
  if (!plan) {
    throw new Error(
      `Brak planu „start” dla kategorii firmy ${companyId}. ` +
        "Cennik jest niekompletny: uruchom pnpm db:slowniki.",
    );
  }

  await db.transaction(async (tx) => {
    await tx
      .update(companies)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(companies.id, companyId));

    await tx.insert(subscriptions).values({
      companyId,
      planId: plan.id,
      status: "active",
      expiresAt: wygasaO,
    });
  });

  return { ok: true, dane: null };
}

/**
 * Slug z nazwy, wolny w tabeli.
 *
 * `companies.slug` jest unikalny, a „Dwór Pod Lipami” zakłada w Polsce więcej
 * niż jedna firma. Bez licznika druga rejestracja o tej samej nazwie kończyła
 * się naruszeniem ograniczenia unikalności, czyli pięćsetką na ostatnim kroku
 * kreatora.
 *
 * Sprawdzenie i zapis nie są jedną operacją, więc dwie rejestracje w tej samej
 * sekundzie nadal mogą trafić w ten sam slug. Wtedy zapis padnie na
 * ograniczeniu, co jest poprawnym zachowaniem: baza pilnuje unikalności,
 * a ta funkcja tylko nie marnuje jej czasu na oczywiste kolizje.
 */
async function wolnySlug(nazwa: string, pomijanaFirma: string): Promise<string> {
  const podstawa = doSlugu(nazwa) || "firma";

  const kandydaci = [
    podstawa,
    ...Array.from({ length: PROB_UNIKALNEGO_SLUGU }, (_, i) => `${podstawa}-${i + 2}`),
  ];

  const zajete = await db
    .select({ slug: companies.slug })
    .from(companies)
    .where(inArray(companies.slug, kandydaci));

  // Własny slug nie jest kolizją: ponowne przejście kroku ma dać ten sam adres.
  const [wlasny] = await db
    .select({ slug: companies.slug })
    .from(companies)
    .where(eq(companies.id, pomijanaFirma))
    .limit(1);

  const zajeteSlugi = new Set(zajete.map((w) => w.slug));
  if (wlasny) zajeteSlugi.delete(wlasny.slug);

  const wolny = kandydaci.find((kandydat) => !zajeteSlugi.has(kandydat));

  /*
   * Pięćdziesiąt zajętych wariantów tej samej nazwy to nie zbieg okoliczności,
   * tylko ktoś, kto zakłada firmy skryptem. Losowy przyrostek zamiast błędu
   * przepuściłby to dalej i zostawił katalog pełen „dwor-pod-lipami-51”.
   */
  if (!wolny) {
    throw new Error(
      `Nie ma wolnego sluga dla nazwy „${nazwa}” po ${PROB_UNIKALNEGO_SLUGU} próbach.`,
    );
  }

  return wolny;
}

/** Polskie znaki na łacińskie, resztę na kreski. Bez zewnętrznej biblioteki. */
function doSlugu(nazwa: string): string {
  return (
    nazwa
      .toLowerCase()
      .normalize("NFD")
      // Znaki diakrytyczne jako osobne punkty kodowe po rozkładzie NFD.
      .replace(/[̀-ͯ]/g, "")
      // „ł” nie ma rozkładu NFD, więc nie zdejmuje jej powyższy krok.
      .replace(/ł/g, "l")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

/**
 * Zapytania o oferty. Cały SQL dotyczący `bids` i `shortlist` mieszka tutaj.
 *
 * KONWENCJA MODUŁU: każda eksportowana funkcja przyjmuje widza jako pierwszy
 * argument i odmawia, zanim dotknie pozostałych. Pilnuje tego
 * tests/konwencja-zapytan.test.ts.
 *
 * DWIE RZECZY, KTÓRE ŁATWO ZEPSUĆ W TYM PLIKU
 *
 * 1. Licznik ofert wyliczamy z wierszy, nie trzymamy go w kolumnie. Kolumna
 *    `bids_used` rozjechałaby się z rzeczywistością przy pierwszym wycofaniu
 *    oferty albo przerwanej transakcji. Wiersze są prawdą, licznik byłby kopią.
 * 2. Sprawdzenie limitu i zapis oferty dzieją się w jednej transakcji, z blokadą
 *    wiersza subskrypcji. Bez blokady dwie oferty złożone w tej samej sekundzie
 *    przy stanie 14 z 15 obie przejdą sprawdzenie i obie się zapiszą.
 */
import { and, count, countDistinct, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { plans, subscriptions } from "@/lib/db/schema/abonament";
import { bids, requests, shortlist } from "@/lib/db/schema/gielda";
import { companies } from "@/lib/db/schema/katalog";
import {
  MAKS_OFERT_NA_ZLECENIE,
  mozeWycofacOferte,
  mozeZarzadzacKrotkaLista,
  mozeZlozycOferte,
  type PowodOdmowy,
  type Widz,
  zakresOfert,
} from "@/lib/permissions";

export type DaneOferty = {
  requestId: string;
  cena: number;
  wiadomosc: string;
};

export type OfertaFirmy = {
  id: string;
  cena: number;
  wiadomosc: string;
  status: string;
  utworzona: Date;
};

export type OfertaDlaAutora = OfertaFirmy & {
  nazwaFirmy: string;
  naKrotkiejLiscie: boolean;
};

export type Odmowa = { ok: false; powod: PowodOdmowy };
export type Wynik<T> = { ok: true; dane: T } | Odmowa;

/** Wykonawca zapytań: połączenie albo transakcja. */
type Wykonawca = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Statusy ofert, które zajmują miejsce na zleceniu i w limicie planu. */
const STATUSY_LICZACE_SIE = ["sent", "shortlisted", "rejected"] as const;
/** Statusy ofert zajmujących miejsce na zleceniu. Odrzucona zwalnia miejsce. */
const STATUSY_ZAJMUJACE_MIEJSCE = ["sent", "shortlisted"] as const;

/**
 * Czy zlecenie przyjmuje oferty.
 *
 * Trzy przyczyny odmowy (pełne, zamknięte, wygasłe) zwijamy do jednej wartości
 * logicznej **tutaj**, a nie u wywołującego. Dzięki temu ani reguła uprawnień,
 * ani endpoint nie mają czym rozróżnić przyczyny, więc nie da się jej ujawnić
 * nawet przez pomyłkę. Nie ujawnisz informacji, której nie posiadasz.
 *
 * Zlecenie nieistniejące też zwraca `false`, z tego samego powodu.
 */
async function czyPrzyjmujeOferty(wykonawca: Wykonawca, requestId: string): Promise<boolean> {
  const [zlecenie] = await wykonawca
    .select({ status: requests.status, wygasa: requests.expiresAt })
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);

  if (!zlecenie) return false;

  const [licznik] = await wykonawca
    .select({ ile: count() })
    .from(bids)
    .where(
      and(eq(bids.requestId, requestId), inArray(bids.status, [...STATUSY_ZAJMUJACE_MIEJSCE])),
    );

  const otwarte = zlecenie.status === "open" && zlecenie.wygasa > new Date();
  return otwarte && (licznik?.ile ?? 0) < MAKS_OFERT_NA_ZLECENIE;
}

/**
 * Na ilu **zleceniach** firma ma ofertę w bieżącym okresie abonamentowym.
 *
 * Liczymy zlecenia, nie wiersze. Firma kupiła piętnaście zleceń, nie piętnaście
 * kliknięć: wycofanie oferty i złożenie jej ponownie na tym samym zleceniu ma
 * zająć jedno miejsce w planie, nie dwa.
 *
 * UWAGA NA RÓWNOŚĆ, KTÓRA NIE JEST WIECZNA. Dziś `count(distinct request_id)`
 * i `count(*)` dają to samo, ale **wyłącznie dopóki trzyma indeks unikalny
 * `bids(request_id, company_id)`**. Gdyby ktoś go zdjął albo wrócił do
 * wstawiania nowego wiersza przy ponownym złożeniu, obie liczby rozjechałyby się
 * po cichu i firma płaciłaby miejscem w planie za własne rozmyślenie się.
 *
 * Samego sposobu liczenia nie da się dziś odizolować testem, bo obie wersje
 * zachowują się identycznie. Da się za to przetestować ten indeks i robi to
 * tests/indeksy.test.ts. To on jest tu prawdziwą barierą.
 *
 * Okres liczy się od `starts_at` bieżącej subskrypcji, nie od stycznia i nie od
 * początku istnienia firmy. Odnowienie zeruje licznik, bo firma kupiła nowy okres.
 *
 * Wycofane oferty nie liczą się do limitu: firma, która się rozmyśliła, nie
 * powinna za to płacić miejscem w planie.
 */
async function policzOfertyWOkresie(
  wykonawca: Wykonawca,
  companyId: string,
  poczatekOkresu: Date,
): Promise<number> {
  const [licznik] = await wykonawca
    .select({ ile: countDistinct(bids.requestId) })
    .from(bids)
    .where(
      and(
        eq(bids.companyId, companyId),
        gte(bids.createdAt, poczatekOkresu),
        inArray(bids.status, [...STATUSY_LICZACE_SIE]),
      ),
    );

  return licznik?.ile ?? 0;
}

/**
 * Złożenie oferty.
 *
 * Całość w jednej transakcji: blokada wiersza subskrypcji, policzenie ofert
 * w okresie, sprawdzenie reguły, zapis. Blokada jest tym, co odróżnia kod
 * działający w testach od kodu, który przepuszcza szesnastą ofertę na produkcji,
 * gdy dwa żądania trafią w tę samą sekundę.
 */
export async function zlozOferte(widz: Widz, dane: DaneOferty): Promise<Wynik<OfertaFirmy>> {
  // Anonim, klient i autor odpadają bez dotykania bazy. Moderator rzuca.
  if (widz.rodzaj !== "firma") {
    const rozstrzygniecie = mozeZlozycOferte(widz, {
      requestId: dane.requestId,
      jestJuzOferta: false,
      przyjmujeOferty: false,
      ofertWOkresie: 0,
      limitPlanu: null,
    });
    if (rozstrzygniecie.wolno) {
      throw new Error("zlozOferte: widz spoza firm nie może mieć zgody na złożenie oferty.");
    }
    return { ok: false, powod: rozstrzygniecie.powod };
  }

  const companyId = widz.companyId;

  return db.transaction(async (tx) => {
    // Blokada wiersza subskrypcji. Dwa równoległe żądania tej samej firmy
    // ustawiają się tutaj w kolejkę, więc drugie policzy limit już po zapisie
    // pierwszego. To samo zabezpieczenie co przy idempotencji webhooków:
    // rzadkie, niewidoczne w testach, kosztujące pieniądze.
    const [abonament] = await tx
      .select({
        id: subscriptions.id,
        startsAt: subscriptions.startsAt,
        limitPlanu: plans.bidsLimit,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(plans.id, subscriptions.planId))
      .where(
        and(
          eq(subscriptions.companyId, companyId),
          eq(subscriptions.status, "active"),
          sql`${subscriptions.expiresAt} > now()`,
        ),
      )
      .limit(1)
      .for("update");

    // Transakcja jest ostatnim słowem w sprawie abonamentu. Widz mógł zostać
    // rozpoznany sekundę wcześniej, a abonament mógł w międzyczasie wygasnąć.
    if (!abonament) {
      return { ok: false, powod: "brak-abonamentu" } satisfies Odmowa;
    }

    const [istniejaca] = await tx
      .select({ id: bids.id, status: bids.status })
      .from(bids)
      .where(and(eq(bids.requestId, dane.requestId), eq(bids.companyId, companyId)))
      .limit(1);

    // Wycofana oferta nie blokuje złożenia nowej. Firma, która raz się rozmyśli
    // i traci zlecenie na zawsze, to mechanizm wrogi wobec strony, która płaci,
    // a nadużyć nie ma tu czym: firma nie widzi cen konkurencji, więc nie ma
    // na co reagować kolejną wersją oferty.
    const wycofana = istniejaca?.status === "withdrawn";

    const rozstrzygniecie = mozeZlozycOferte(widz, {
      requestId: dane.requestId,
      jestJuzOferta: Boolean(istniejaca) && !wycofana,
      przyjmujeOferty: await czyPrzyjmujeOferty(tx, dane.requestId),
      ofertWOkresie: await policzOfertyWOkresie(tx, companyId, abonament.startsAt),
      limitPlanu: abonament.limitPlanu,
    });

    if (!rozstrzygniecie.wolno) {
      return { ok: false, powod: rozstrzygniecie.powod } satisfies Odmowa;
    }

    const kolumnyWyniku = {
      id: bids.id,
      cena: bids.price,
      wiadomosc: bids.message,
      status: bids.status,
      utworzona: bids.createdAt,
    };

    // Ponowne złożenie aktualizuje wycofany wiersz zamiast wstawiać nowy.
    // Indeks unikalny (request_id, company_id) zostaje i dalej pilnuje zasady
    // „jedna firma, jedna oferta na zlecenie”.
    const [zapisana] = istniejaca
      ? await tx
          .update(bids)
          .set({
            price: dane.cena,
            message: dane.wiadomosc,
            status: "sent",
            updatedAt: new Date(),
          })
          .where(eq(bids.id, istniejaca.id))
          .returning(kolumnyWyniku)
      : await tx
          .insert(bids)
          .values({
            requestId: dane.requestId,
            companyId,
            price: dane.cena,
            message: dane.wiadomosc,
          })
          .returning(kolumnyWyniku);

    if (!zapisana) throw new Error("zlozOferte: zapis oferty nie zwrócił wiersza.");
    return { ok: true, dane: zapisana };
  });
}

/**
 * Wycofanie oferty. Zmiana statusu na `withdrawn`, nigdy usunięcie wiersza.
 *
 * Możliwe do momentu, w którym klient doda ofertę do krótkiej listy. Potem nie:
 * klient podjął już decyzję i zaczął rozmowę, a znikająca oferta zostawiłaby go
 * z rozmową bez treści.
 */
export async function wycofajOferte(widz: Widz, bidId: string): Promise<Wynik<null>> {
  const [oferta] = await db
    .select({ id: bids.id, companyId: bids.companyId })
    .from(bids)
    .where(eq(bids.id, bidId))
    .limit(1);

  const [naLiscie] = oferta
    ? await db
        .select({ id: shortlist.id })
        .from(shortlist)
        .where(eq(shortlist.bidId, bidId))
        .limit(1)
    : [];

  const rozstrzygniecie = mozeWycofacOferte(widz, {
    // Oferta nieistniejąca i cudza dają tę samą odmowę, więc identyfikatorów
    // nie da się przez tę ścieżkę wyliczać.
    wlasna: Boolean(oferta) && widz.rodzaj === "firma" && oferta?.companyId === widz.companyId,
    naKrotkiejLiscie: Boolean(naLiscie),
  });

  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };

  await db
    .update(bids)
    .set({ status: "withdrawn", updatedAt: new Date() })
    .where(eq(bids.id, bidId));

  return { ok: true, dane: null };
}

export type ListaOfert =
  | { zakres: "wszystkie"; oferty: OfertaDlaAutora[] }
  | { zakres: "wlasna"; oferty: OfertaFirmy[] };

/**
 * Oferty na zleceniu.
 *
 * Autor widzi wszystkie, z nazwą firmy i ceną. Firma widzi wyłącznie własną
 * i nie dowiaduje się nawet, ile jest pozostałych: zapytanie nie pobiera
 * cudzych wierszy, więc nie ma czego policzyć.
 */
export async function pobierzOfertyZlecenia(
  widz: Widz,
  requestId: string,
): Promise<Wynik<ListaOfert>> {
  const rozstrzygniecie = zakresOfert(widz);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };

  const zakres = rozstrzygniecie.zakres;
  if (!zakres) throw new Error("pobierzOfertyZlecenia: zgoda bez określonego zakresu.");

  if (zakres.rodzaj === "wlasna") {
    const oferty = await db
      .select({
        id: bids.id,
        cena: bids.price,
        wiadomosc: bids.message,
        status: bids.status,
        utworzona: bids.createdAt,
      })
      .from(bids)
      .where(and(eq(bids.requestId, requestId), eq(bids.companyId, zakres.companyId)));

    return { ok: true, dane: { zakres: "wlasna", oferty } };
  }

  // Autor. Sprawdzenie autorstwa jest w klauzuli `where`, nie tylko w regule
  // wyżej: gdyby ktoś kiedyś obszedł regułę, baza i tak nic nie odda.
  if (widz.rodzaj !== "autor") {
    throw new Error("pobierzOfertyZlecenia: zakres „wszystkie” dla widza, który nie jest autorem.");
  }

  const wiersze = await db
    .select({
      id: bids.id,
      cena: bids.price,
      wiadomosc: bids.message,
      status: bids.status,
      utworzona: bids.createdAt,
      nazwaFirmy: companies.name,
      naKrotkiejLiscie: sql<boolean>`${shortlist.id} is not null`,
    })
    .from(bids)
    .innerJoin(requests, eq(requests.id, bids.requestId))
    .innerJoin(companies, eq(companies.id, bids.companyId))
    .leftJoin(shortlist, eq(shortlist.bidId, bids.id))
    .where(and(eq(bids.requestId, requestId), eq(requests.authorUserId, widz.userId)))
    .orderBy(desc(bids.createdAt));

  return { ok: true, dane: { zakres: "wszystkie", oferty: wiersze } };
}

/**
 * Dodanie oferty do krótkiej listy. To jest moment, w którym firma dostaje
 * dane kontaktowe klienta.
 *
 * Wyłącznie autor zlecenia. Odblokowanie dotyczy **tej jednej oferty**, więc
 * pozostałe firmy na tym samym zleceniu nadal nie mają kontaktu.
 */
export async function dodajDoKrotkiejListy(widz: Widz, bidId: string): Promise<Wynik<null>> {
  const rozstrzygniecie = mozeZarzadzacKrotkaLista(widz);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };
  if (widz.rodzaj !== "autor") throw new Error("dodajDoKrotkiejListy: zgoda dla nie-autora.");

  const autorUserId = widz.userId;

  return db.transaction(async (tx) => {
    // Autorstwo sprawdzamy w zapytaniu, nie przez porównanie w kodzie nad nim.
    const [oferta] = await tx
      .select({ id: bids.id, requestId: bids.requestId, status: bids.status })
      .from(bids)
      .innerJoin(requests, eq(requests.id, bids.requestId))
      .where(and(eq(bids.id, bidId), eq(requests.authorUserId, autorUserId)))
      .limit(1);

    // Cudza oferta i oferta nieistniejąca: ta sama odmowa.
    if (!oferta) return { ok: false, powod: "brak-dostepu" } satisfies Odmowa;
    if (oferta.status === "withdrawn") {
      return { ok: false, powod: "brak-dostepu" } satisfies Odmowa;
    }

    const [juz] = await tx
      .select({ id: shortlist.id })
      .from(shortlist)
      .where(eq(shortlist.bidId, bidId))
      .limit(1);

    if (!juz) {
      await tx.insert(shortlist).values({ requestId: oferta.requestId, bidId });
      await tx
        .update(bids)
        .set({ status: "shortlisted", updatedAt: new Date() })
        .where(eq(bids.id, bidId));
    }

    return { ok: true, dane: null };
  });
}

/**
 * Do którego zlecenia należy ta oferta. `null`, gdy oferty nie ma.
 *
 * Potrzebne, bo autorem jest się względem zlecenia, a nie względem oferty:
 * żeby ustalić, czy pytający jest autorem, trzeba najpierw wiedzieć, czego
 * ta oferta dotyczy. Sam identyfikator zlecenia nie jest treścią chronioną,
 * a wywołujący i tak zaraz dostanie odmowę, jeśli nie jest autorem.
 */
export async function zlecenieOferty(widz: Widz, bidId: string): Promise<string | null> {
  // Domyślna odmowa przed dotknięciem bazy: rzuca dla gałęzi bez implementacji.
  zakresOfert(widz);

  const [oferta] = await db
    .select({ requestId: bids.requestId })
    .from(bids)
    .where(eq(bids.id, bidId))
    .limit(1);

  return oferta?.requestId ?? null;
}

/**
 * Czy ta firma ma odblokowany kontakt na tym zleceniu.
 *
 * Warunkiem jest wpis w `shortlist` wskazujący **jej** ofertę. Wpis dotyczący
 * oferty innej firmy niczego jej nie odblokowuje, także na przyszłość.
 */
export async function czyKontaktOdblokowany(
  widz: Widz,
  requestId: string,
): Promise<Wynik<boolean>> {
  const rozstrzygniecie = zakresOfert(widz);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };

  if (widz.rodzaj !== "firma") {
    // Autor zawsze widzi własny kontakt, więc pytanie nie ma dla niego sensu.
    return { ok: true, dane: widz.rodzaj === "autor" };
  }

  const [wpis] = await db
    .select({ id: shortlist.id })
    .from(shortlist)
    .innerJoin(bids, eq(bids.id, shortlist.bidId))
    .where(
      and(
        eq(shortlist.requestId, requestId),
        // Kluczowy warunek: shortlist musi wskazywać ofertę TEJ firmy.
        eq(bids.companyId, widz.companyId),
      ),
    )
    .limit(1);

  return { ok: true, dane: Boolean(wpis) };
}

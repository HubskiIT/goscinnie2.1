/**
 * Składanie ofert. Przypadki 2, 4, 6, 7 i 8 z docs/uprawnienia.md.
 *
 * Najważniejszy blok w tym pliku to nie kody odpowiedzi, tylko
 * „odmowa nie zdradza liczby ofert”. Firma nie widzi, ile ofert ma zlecenie,
 * i nie może się tego dowiedzieć przez próbowanie. Komunikat rozróżniający
 * zlecenie pełne od zamkniętego oddawałby tę liczbę na raty.
 *
 * Testy pracują na firmach i zleceniach z zasiewu.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { POST as dodajDoKrotkiejListyEndpoint } from "@/app/api/oferty/[id]/krotka-lista/route";
import { DELETE as wycofajEndpoint } from "@/app/api/oferty/[id]/route";
import {
  GET as pobierzOfertyEndpoint,
  POST as zlozOferteEndpoint,
} from "@/app/api/zlecenia/[id]/oferty/route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { czyKontaktOdblokowany } from "@/lib/db/queries/bids";
import { bids, requests, shortlist } from "@/lib/db/schema/gielda";
import { companies, companyMembers } from "@/lib/db/schema/katalog";
import { rateLimits } from "@/lib/db/schema/sesje";
import { users } from "@/lib/db/schema/tozsamosc";
import { MAKS_OFERT_NA_ZLECENIE } from "@/lib/permissions";

const HASLO = "goscinnie-lokalnie-2026";

/**
 * Ceny rozróżnialne co do firmy. Bez tego test „firma nie widzi cen
 * konkurencji” nie miałby czego szukać: gdyby wszystkie oferty miały tę samą
 * kwotę, brak cudzej ceny w odpowiedzi byłby prawdą także przy pełnym wycieku.
 */
const CENA_Z_ABONAMENTEM = 555_000;
const CENA_PRZY_LIMICIE = 611_100;
const CENA_NA_LIMICIE = 622_200;

type Sesja = { ciasteczko: string; userId: string };

async function zalogujCzlonkaFirmy(slug: string): Promise<Sesja> {
  const [wiersz] = await db
    .select({ email: users.email })
    .from(companies)
    .innerJoin(companyMembers, eq(companyMembers.companyId, companies.id))
    .innerJoin(users, eq(users.id, companyMembers.userId))
    .where(eq(companies.slug, slug))
    .limit(1);

  if (!wiersz) throw new Error(`Zasiew nie ma członka firmy ${slug}.`);
  return zaloguj(wiersz.email);
}

async function zaloguj(email: string): Promise<Sesja> {
  // Limity prób logowania obowiązują też testy. Przesuwamy okno w przeszłość
  // zamiast kasować wiersz: tak wygasa okno naprawdę.
  const godzineTemu = new Date(Date.now() - 60 * 60 * 1000);
  await db
    .update(rateLimits)
    .set({ windowStart: godzineTemu })
    .where(eq(rateLimits.key, `logowanie:konto:${email.toLowerCase()}`));

  const odpowiedz = await auth.api.signInEmail({
    body: { email, password: HASLO },
    returnHeaders: true,
    headers: new Headers({ "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200)}` }),
  });

  const ciasteczko = odpowiedz.headers.get("set-cookie");
  if (!ciasteczko) throw new Error(`Logowanie ${email} nie zwróciło ciasteczka.`);
  return { ciasteczko, userId: odpowiedz.response.user.id };
}

function zadanie(sciezka: string, sesja: Sesja | null, cialo?: unknown): Request {
  const naglowki = new Headers({ "content-type": "application/json" });
  if (sesja) naglowki.set("cookie", sesja.ciasteczko);
  return new Request(`http://localhost:3000${sciezka}`, {
    method: cialo === undefined ? "GET" : "POST",
    headers: naglowki,
    ...(cialo === undefined ? {} : { body: JSON.stringify(cialo) }),
  });
}

async function zlozOferte(requestId: string, sesja: Sesja | null, cena = CENA_Z_ABONAMENTEM) {
  const odpowiedz = await zlozOferteEndpoint(
    zadanie(`/api/zlecenia/${requestId}/oferty`, sesja, {
      cena,
      wiadomosc: "Mamy wolny termin, salę na sto osób i własną kuchnię.",
    }),
    { params: Promise.resolve({ id: requestId }) },
  );
  return { status: odpowiedz.status, tekst: await odpowiedz.text() };
}

/**
 * Identyfikator zlecenia o zadanej liczbie ofert zajmujących miejsce.
 *
 * Sortowanie po identyfikatorze, bo bez niego baza zwracała wiersze w dowolnej
 * kolejności i test raz brał jedno zlecenie, raz inne. Przy zleceniu zamykanym
 * w tym samym pliku potrafiło to trafić w to samo zlecenie, na którym testy
 * składały oferty, i cały plik sypał się w losowych miejscach.
 */
async function zlecenieZLiczbaOfert(ile: number, pomin: string[] = []): Promise<string> {
  const wszystkie = await db
    .select({ id: requests.id })
    .from(requests)
    .where(eq(requests.status, "open"))
    .orderBy(requests.id);

  for (const zlecenie of wszystkie) {
    if (pomin.includes(zlecenie.id)) continue;
    const istniejace = await db
      .select({ id: bids.id })
      .from(bids)
      .where(and(eq(bids.requestId, zlecenie.id), inArray(bids.status, ["sent", "shortlisted"])));
    if (istniejace.length === ile) return zlecenie.id;
  }

  throw new Error(`Zasiew nie ma otwartego zlecenia z ${ile} ofertami.`);
}

/**
 * Ustawia firmie dokładnie tyle ofert liczących się do limitu, ile trzeba,
 * wycofując nadmiarowe.
 *
 * Bez tego zestaw przechodził za pierwszym uruchomieniem po `pnpm db:reset`
 * i wykładał się za drugim, bo oferty złożone przez same testy zostawały
 * w bazie. Test zależny od tego, czy ktoś przed chwilą zresetował bazę,
 * jest testem, któremu nie można ufać.
 */
async function ustawLiczbeOfert(slug: string, ile: number): Promise<void> {
  const [firma] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!firma) throw new Error(`Zasiew nie ma firmy ${slug}.`);

  // Najpierw przywracamy oferty wycofane przez poprzednie przebiegi, potem
  // przycinamy do żądanej liczby. Samo przycinanie wystarczyłoby tylko raz:
  // przy drugim uruchomieniu firma miałaby już za mało ofert.
  await db
    .update(bids)
    .set({ status: "sent" })
    .where(and(eq(bids.companyId, firma.id), eq(bids.status, "withdrawn")));

  const liczace = await db
    .select({ id: bids.id })
    .from(bids)
    .where(
      and(eq(bids.companyId, firma.id), inArray(bids.status, ["sent", "shortlisted", "rejected"])),
    )
    .orderBy(bids.createdAt);

  if (liczace.length < ile) {
    throw new Error(
      `Firma ${slug} ma ${liczace.length} ofert, a scenariusz wymaga ${ile}. ` +
        "Uzupełnij zasiew zamiast dopisywać oferty w teście.",
    );
  }

  for (const nadmiarowa of liczace.slice(ile)) {
    await db.update(bids).set({ status: "withdrawn" }).where(eq(bids.id, nadmiarowa.id));
  }
}

let zAbonamentem: Sesja;
let bezAbonamentu: Sesja;
let przyLimicie: Sesja;
let naLimicie: Sesja;

let zlecenieWolne: string;
let zleceniePelne: string;
let zlecenieZamkniete: string;

beforeAll(async () => {
  zAbonamentem = await zalogujCzlonkaFirmy("firma-1");
  // firma-7, nie firma-4: właściciel firmy-4 należy też do firmy-1 z abonamentem,
  // więc kontekst rozwiązałby się na tę drugą i test sprawdzałby co innego,
  // niż ma w nazwie.
  bezAbonamentu = await zalogujCzlonkaFirmy("firma-7");
  przyLimicie = await zalogujCzlonkaFirmy("firma-5");
  naLimicie = await zalogujCzlonkaFirmy("firma-6");

  // Stan wyjściowy ustawiamy jawnie, żeby zestaw dawał ten sam wynik przy
  // drugim i dziesiątym uruchomieniu bez resetu bazy.
  await ustawLiczbeOfert("firma-5", 14);
  await ustawLiczbeOfert("firma-6", 15);

  zleceniePelne = await zlecenieZLiczbaOfert(MAKS_OFERT_NA_ZLECENIE);
  zlecenieWolne = await zlecenieZLiczbaOfert(0);

  // Zlecenie zamknięte, do porównania odpowiedzi z pełnym. Musi być inne
  // niż dwa powyższe, inaczej test zamyka zlecenie, na którym sam składa oferty.
  zlecenieZamkniete = await zlecenieZLiczbaOfert(0, [zlecenieWolne, zleceniePelne]);
  await db.update(requests).set({ status: "closed" }).where(eq(requests.id, zlecenieZamkniete));
});

/** Przypadek 2 z docs/uprawnienia.md. */
describe("przypadek 2: firma bez subskrypcji dostaje 402", () => {
  it("402, nie 403 i nie 500", async () => {
    const { status, tekst } = await zlozOferte(zlecenieWolne, bezAbonamentu);
    expect(status).toBe(402);
    expect(JSON.parse(tekst).powod).toBe("brak-abonamentu");
  });

  it("oferta nie zapisuje się mimo odmowy", async () => {
    const [firma] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, "firma-7"))
      .limit(1);

    const zapisane = await db
      .select({ id: bids.id })
      .from(bids)
      .where(and(eq(bids.requestId, zlecenieWolne), eq(bids.companyId, firma?.id ?? "")));

    expect(zapisane).toHaveLength(0);
  });

  it("anonim też nie złoży oferty", async () => {
    const { status } = await zlozOferte(zlecenieWolne, null);
    expect(status).toBe(403);
  });
});

describe("firma z abonamentem składa ofertę", () => {
  it("201 i oferta w odpowiedzi", async () => {
    const { status, tekst } = await zlozOferte(zlecenieWolne, zAbonamentem);
    expect(status).toBe(201);
    const dane = JSON.parse(tekst);
    expect(dane.oferta.id).toBeTruthy();
    expect(dane.oferta.cena).toBe(555000);
  });

  /** Przypadek 6 z docs/uprawnienia.md. */
  it("przypadek 6: druga oferta tej samej firmy daje 409", async () => {
    const { status, tekst } = await zlozOferte(zlecenieWolne, zAbonamentem);
    expect(status).toBe(409);
    expect(JSON.parse(tekst).powod).toBe("oferta-juz-zlozona");
  });

  it("w bazie została dokładnie jedna oferta tej firmy na tym zleceniu", async () => {
    const [firma] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, "firma-1"))
      .limit(1);

    const zapisane = await db
      .select({ id: bids.id })
      .from(bids)
      .where(and(eq(bids.requestId, zlecenieWolne), eq(bids.companyId, firma?.id ?? "")));

    expect(zapisane).toHaveLength(1);
  });
});

/** Przypadek 7 z docs/uprawnienia.md. */
describe("przypadek 7: limit ofert w planie Start", () => {
  it("firma z czternastoma ofertami składa piętnastą: 201", async () => {
    const { status } = await zlozOferte(zlecenieWolne, przyLimicie, CENA_PRZY_LIMICIE);
    expect(status).toBe(201);
  });

  it("firma z piętnastoma ofertami dostaje 429", async () => {
    const { status, tekst } = await zlozOferte(zlecenieWolne, naLimicie, CENA_NA_LIMICIE);
    expect(status).toBe(429);
    expect(JSON.parse(tekst).powod).toBe("limit-planu-wyczerpany");
  });

  it("wycofanie oferty zwalnia miejsce w limicie", async () => {
    // Firma, która się rozmyśliła, nie powinna płacić za to miejscem w planie.
    const [firma] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, "firma-6"))
      .limit(1);

    const [dowolna] = await db
      .select({ id: bids.id })
      .from(bids)
      .where(and(eq(bids.companyId, firma?.id ?? ""), eq(bids.status, "sent")))
      .limit(1);

    expect(dowolna).toBeDefined();
    if (!dowolna) return;

    const odpowiedz = await wycofajEndpoint(zadanie(`/api/oferty/${dowolna.id}`, naLimicie), {
      params: Promise.resolve({ id: dowolna.id }),
    });
    expect(odpowiedz.status).toBe(200);

    const { status } = await zlozOferte(zlecenieWolne, naLimicie, CENA_NA_LIMICIE);
    expect(status).toBe(201);
  });
});

/**
 * Wycofanie i ponowne złożenie oferty na tym samym zleceniu, jedno po drugim.
 *
 * Poprzednio oba kroki były testowane osobno i dlatego przeszedł błąd, przez
 * który firma po wycofaniu oferty nie mogła już złożyć nowej: wiersz zostawał,
 * a indeks unikalny odbijał ponowne żądanie. Formularz obiecywał firmie coś,
 * czego system nie robił.
 */
describe("wycofanie i ponowne złożenie oferty na tym samym zleceniu", () => {
  it("po wycofaniu da się złożyć nową ofertę", async () => {
    const wolne = await zlecenieZLiczbaOfert(0, [zlecenieWolne, zleceniePelne, zlecenieZamkniete]);

    const pierwsza = await zlozOferte(wolne, zAbonamentem, 700_000);
    expect(pierwsza.status).toBe(201);
    const idOferty = JSON.parse(pierwsza.tekst).oferta.id;

    const wycofanie = await wycofajEndpoint(zadanie(`/api/oferty/${idOferty}`, zAbonamentem), {
      params: Promise.resolve({ id: idOferty }),
    });
    expect(wycofanie.status).toBe(200);

    const druga = await zlozOferte(wolne, zAbonamentem, 680_000);
    expect(druga.status).toBe(201);
    expect(JSON.parse(druga.tekst).oferta.cena).toBe(680_000);
  });

  it("w bazie jest jeden wiersz na parę zlecenie i firma, nie dwa", async () => {
    // Indeks unikalny zostaje. Ponowne złożenie aktualizuje wycofany wiersz,
    // a nie dokłada drugiego.
    const [firma] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, "firma-1"))
      .limit(1);

    const wiersze = await db
      .select({ requestId: bids.requestId })
      .from(bids)
      .where(eq(bids.companyId, firma?.id ?? ""));

    expect(wiersze.length).toBe(new Set(wiersze.map((w) => w.requestId)).size);
  });

  it("licznik planu nie rośnie dwa razy za to samo zlecenie", async () => {
    // Firma kupiła piętnaście zleceń, nie piętnaście kliknięć.
    const [firma] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, "firma-1"))
      .limit(1);
    if (!firma) throw new Error("Brak firmy-1.");

    const policz = async () => {
      const wiersze = await db
        .select({ requestId: bids.requestId })
        .from(bids)
        .where(
          and(
            eq(bids.companyId, firma.id),
            inArray(bids.status, ["sent", "shortlisted", "rejected"]),
          ),
        );
      return new Set(wiersze.map((w) => w.requestId)).size;
    };

    const wolne = await zlecenieZLiczbaOfert(0, [zlecenieWolne, zleceniePelne, zlecenieZamkniete]);
    const przed = await policz();

    expect((await zlozOferte(wolne, zAbonamentem, 660_000)).status).toBe(201);
    expect(await policz()).toBe(przed + 1);

    const [oferta] = await db
      .select({ id: bids.id })
      .from(bids)
      .where(and(eq(bids.companyId, firma.id), eq(bids.requestId, wolne)))
      .limit(1);
    if (!oferta) throw new Error("Brak właśnie złożonej oferty.");

    await wycofajEndpoint(zadanie(`/api/oferty/${oferta.id}`, zAbonamentem), {
      params: Promise.resolve({ id: oferta.id }),
    });
    expect(await policz()).toBe(przed);

    expect((await zlozOferte(wolne, zAbonamentem, 650_000)).status).toBe(201);
    // Sedno: po wycofaniu i ponownym złożeniu licznik wraca do tej samej
    // wartości, a nie rośnie o dwa.
    expect(await policz()).toBe(przed + 1);
  });
});

/**
 * Punkt (b) z rozpisu: wyścig przy limicie planu.
 *
 * Dwie oferty złożone w tej samej chwili przy stanie 14 z 15 obie przeszłyby
 * sprawdzenie, gdyby sprawdzenie i zapis nie siedziały w jednej transakcji
 * z blokadą wiersza subskrypcji. Ta sama klasa błędu co przy idempotencji
 * webhooków: rzadka, niewidoczna w zwykłych testach, kosztująca pieniądze.
 */
describe("wyścig przy limicie planu", () => {
  it("dwie równoległe oferty przy jednym wolnym miejscu dają jedno 201 i jedno 429", async () => {
    // Stan ustawiamy jawnie, zamiast liczyć na to, co zostawiły wcześniejsze
    // testy. Scenariusz wyścigu ma sens wyłącznie przy dokładnie jednym wolnym
    // miejscu, więc ta liczba nie może zależeć od kolejności testów.
    const [firma] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, "firma-5"))
      .limit(1);
    if (!firma) throw new Error("Brak firmy-5.");

    const liczace = await db
      .select({ id: bids.id })
      .from(bids)
      .where(
        and(
          eq(bids.companyId, firma.id),
          inArray(bids.status, ["sent", "shortlisted", "rejected"]),
        ),
      );

    // Wycofujemy nadmiar, aż zostanie czternaście ofert liczących się do limitu.
    for (const nadmiarowa of liczace.slice(14)) {
      await db.update(bids).set({ status: "withdrawn" }).where(eq(bids.id, nadmiarowa.id));
    }

    // firma-5 ma teraz czternaście ofert i limit piętnaście, czyli dokładnie
    // jedno wolne miejsce. Strzelamy dwa razy naraz.
    // Dwa zlecenia, na których ta firma jeszcze nie ma oferty. Inaczej jedno
    // z żądań odbiłoby się o duplikat (409) i wyścigu nie byłoby widać.
    const jejZlecenia = await db
      .select({ requestId: bids.requestId })
      .from(bids)
      .where(eq(bids.companyId, firma.id));
    const zajete = new Set(jejZlecenia.map((w) => w.requestId));

    const otwarte = await db
      .select({ id: requests.id })
      .from(requests)
      .where(eq(requests.status, "open"))
      .orderBy(desc(requests.id));

    const dwaZlecenia = otwarte.filter((z) => !zajete.has(z.id)).slice(0, 2);

    expect(dwaZlecenia).toHaveLength(2);
    const [pierwsze, drugie] = dwaZlecenia;
    if (!pierwsze || !drugie) return;

    const [a, b] = await Promise.all([
      zlozOferte(pierwsze.id, przyLimicie, CENA_PRZY_LIMICIE),
      zlozOferte(drugie.id, przyLimicie, CENA_PRZY_LIMICIE),
    ]);

    const kody = [a.status, b.status].sort();
    expect(kody).toEqual([201, 429]);
  });

  it("w bazie jest dokładnie piętnaście ofert tej firmy, nie szesnaście", async () => {
    const [firma] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, "firma-5"))
      .limit(1);

    const zapisane = await db
      .select({ id: bids.id })
      .from(bids)
      .where(
        and(
          eq(bids.companyId, firma?.id ?? ""),
          inArray(bids.status, ["sent", "shortlisted", "rejected"]),
        ),
      );

    // To jest właściwe sprawdzenie. Kody odpowiedzi mogłyby być poprawne,
    // a i tak zapisałoby się szesnaście wierszy.
    expect(zapisane).toHaveLength(15);
  });
});

/**
 * Punkt (c) z rozpisu: komunikat błędu jako wyciek anonimowości.
 *
 * To jest najważniejszy blok w tym pliku. Firma nie widzi liczby ofert,
 * więc odmowa dla zlecenia pełnego musi wyglądać identycznie jak odmowa
 * dla zamkniętego. Inaczej wystarczy próbować, aż odpowiedź się zmieni,
 * i już się wie, że zlecenie ma dokładnie dziesięć ofert.
 */
describe("odmowa nie zdradza liczby ofert", () => {
  it("odpowiedź dla zlecenia pełnego i zamkniętego jest identyczna co do bajtu", async () => {
    const pelne = await zlozOferte(zleceniePelne, zAbonamentem);
    const zamkniete = await zlozOferte(zlecenieZamkniete, zAbonamentem);

    expect(pelne.status).toBe(zamkniete.status);
    expect(pelne.tekst).toBe(zamkniete.tekst);
  });

  it("obie odpowiedzi to 409 bez pola powod", async () => {
    const { status, tekst } = await zlozOferte(zleceniePelne, zAbonamentem);
    expect(status).toBe(409);

    const dane = JSON.parse(tekst);
    // Pole `powod` jest tu kanałem informacji, więc go nie ma.
    expect(Object.keys(dane)).not.toContain("powod");
    expect(dane.blad).not.toContain("10");
    expect(dane.blad).not.toContain("dziesięć");
  });

  it("odpowiedź nie zawiera żadnej liczby", async () => {
    const { tekst } = await zlozOferte(zleceniePelne, zAbonamentem);
    expect(tekst).not.toMatch(/\d/);
  });

  it("zlecenie nieistniejące daje tę samą odpowiedź co pełne", async () => {
    const nieistniejace = "00000000-0000-4000-8000-000000000000";
    const brak = await zlozOferte(nieistniejace, zAbonamentem);
    const pelne = await zlozOferte(zleceniePelne, zAbonamentem);

    expect(brak.status).toBe(pelne.status);
    expect(brak.tekst).toBe(pelne.tekst);
  });
});

/** Przypadek 4 z docs/uprawnienia.md. */
describe("przypadek 4: firma nie widzi ofert konkurencji", () => {
  it("firma dostaje wyłącznie własną ofertę", async () => {
    const odpowiedz = await pobierzOfertyEndpoint(
      zadanie(`/api/zlecenia/${zlecenieWolne}/oferty`, zAbonamentem),
      { params: Promise.resolve({ id: zlecenieWolne }) },
    );

    expect(odpowiedz.status).toBe(200);
    const dane = await odpowiedz.json();
    expect(dane.zakres).toBe("wlasna");
    expect(dane.oferty).toHaveLength(1);
  });

  it("odpowiedź dla firmy nie zawiera nazw ani cen innych firm", async () => {
    // Instancja pozytywna: na tym zleceniu są oferty co najmniej dwóch firm.
    const wszystkie = await db
      .select({ cena: bids.price })
      .from(bids)
      .where(eq(bids.requestId, zlecenieWolne));
    expect(wszystkie.length).toBeGreaterThan(1);

    const odpowiedz = await pobierzOfertyEndpoint(
      zadanie(`/api/zlecenia/${zlecenieWolne}/oferty`, zAbonamentem),
      { params: Promise.resolve({ id: zlecenieWolne }) },
    );
    const tekst = await odpowiedz.text();

    expect(tekst).not.toContain("nazwaFirmy");
    // Ceny konkurencji: żadna cena poza własną nie może się pojawić.
    const cudze = wszystkie.map((w) => w.cena).filter((cena) => cena !== CENA_Z_ABONAMENTEM);
    expect(cudze.length).toBeGreaterThan(0);
    for (const cena of cudze) {
      expect(tekst).not.toContain(String(cena));
    }
  });

  it("firma nie pozna liczby ofert z długości odpowiedzi", async () => {
    // Na zleceniu pełnym firma bez własnej oferty dostaje pustą listę,
    // tak samo jak na zleceniu bez żadnej oferty.
    const naPelnym = await pobierzOfertyEndpoint(
      zadanie(`/api/zlecenia/${zleceniePelne}/oferty`, zAbonamentem),
      { params: Promise.resolve({ id: zleceniePelne }) },
    );
    const dane = await naPelnym.json();
    expect(dane.oferty).toHaveLength(0);
  });
});

/** Przypadek 8 z docs/uprawnienia.md, wraz z punktem (d) z rozpisu. */
describe("przypadek 8: kontakt odblokowuje krótka lista, i to jednej firmie", () => {
  let autorSesja: Sesja;
  let ofertaPierwszej: string;
  let ofertaDrugiej: string;

  beforeAll(async () => {
    const [zlecenie] = await db
      .select({ id: requests.id, autor: requests.authorUserId })
      .from(requests)
      .where(eq(requests.id, zlecenieWolne))
      .limit(1);
    if (!zlecenie) throw new Error("Brak zlecenia do testu krótkiej listy.");

    const [autorUzytkownik] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, zlecenie.autor))
      .limit(1);
    if (!autorUzytkownik) throw new Error("Brak autora zlecenia.");

    autorSesja = await zaloguj(autorUzytkownik.email);

    // Dwie firmy z ofertami na tym samym zleceniu: firma-1 i firma-5.
    const dwie = await db
      .select({ id: bids.id, companyId: bids.companyId })
      .from(bids)
      .innerJoin(companies, eq(companies.id, bids.companyId))
      .where(
        and(eq(bids.requestId, zlecenieWolne), inArray(companies.slug, ["firma-1", "firma-5"])),
      );

    expect(dwie.length).toBe(2);
    ofertaPierwszej = dwie[0]?.id ?? "";
    ofertaDrugiej = dwie[1]?.id ?? "";
  });

  it("firma nie może sama dodać się do krótkiej listy", async () => {
    const odpowiedz = await dodajDoKrotkiejListyEndpoint(
      zadanie(`/api/oferty/${ofertaPierwszej}/krotka-lista`, zAbonamentem, {}),
      { params: Promise.resolve({ id: ofertaPierwszej }) },
    );
    expect(odpowiedz.status).toBe(403);
  });

  it("autor dodaje jedną ofertę do krótkiej listy", async () => {
    const odpowiedz = await dodajDoKrotkiejListyEndpoint(
      zadanie(`/api/oferty/${ofertaPierwszej}/krotka-lista`, autorSesja, {}),
      { params: Promise.resolve({ id: ofertaPierwszej }) },
    );
    expect(odpowiedz.status).toBe(200);

    const wpisy = await db
      .select({ id: shortlist.id })
      .from(shortlist)
      .where(eq(shortlist.bidId, ofertaPierwszej));
    expect(wpisy).toHaveLength(1);
  });

  it("odblokowanie dotyczy wyłącznie tej jednej firmy", async () => {
    // Punkt (d) z rozpisu. Druga firma na tym samym zleceniu nadal bez kontaktu.
    const wpisyDrugiej = await db
      .select({ id: shortlist.id })
      .from(shortlist)
      .where(eq(shortlist.bidId, ofertaDrugiej));

    expect(wpisyDrugiej).toHaveLength(0);
  });

  it("kontakt ma odblokowany tylko firma z krótkiej listy, druga nie", async () => {
    // Punkt (d) sprawdzony tam, gdzie naprawdę zapada decyzja, czyli
    // w funkcji rozstrzygającej, a nie tylko przez policzenie wierszy.
    const [firmaZListy] = await db
      .select({ companyId: bids.companyId })
      .from(bids)
      .where(eq(bids.id, ofertaPierwszej))
      .limit(1);
    const [firmaBezListy] = await db
      .select({ companyId: bids.companyId })
      .from(bids)
      .where(eq(bids.id, ofertaDrugiej))
      .limit(1);

    expect(firmaZListy).toBeDefined();
    expect(firmaBezListy).toBeDefined();
    if (!firmaZListy || !firmaBezListy) return;

    const naLiscie = await czyKontaktOdblokowany(
      { rodzaj: "firma", userId: "x", companyId: firmaZListy.companyId, abonament: true },
      zlecenieWolne,
    );
    const pozaLista = await czyKontaktOdblokowany(
      { rodzaj: "firma", userId: "y", companyId: firmaBezListy.companyId, abonament: true },
      zlecenieWolne,
    );

    expect(naLiscie.ok && naLiscie.dane).toBe(true);
    expect(pozaLista.ok && pozaLista.dane).toBe(false);
  });

  it("oferty na krótkiej liście nie da się już wycofać", async () => {
    const odpowiedz = await wycofajEndpoint(
      zadanie(`/api/oferty/${ofertaPierwszej}`, zAbonamentem),
      {
        params: Promise.resolve({ id: ofertaPierwszej }),
      },
    );
    expect(odpowiedz.status).toBe(403);
  });
});

describe("autor widzi wszystkie oferty ze swojego zlecenia", () => {
  it("zakres wszystkie, z nazwami firm", async () => {
    const [zlecenie] = await db
      .select({ id: requests.id, autor: requests.authorUserId })
      .from(requests)
      .where(eq(requests.id, zlecenieWolne))
      .limit(1);
    if (!zlecenie) throw new Error("Brak zlecenia.");

    const [autorUzytkownik] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, zlecenie.autor))
      .limit(1);
    if (!autorUzytkownik) throw new Error("Brak autora.");

    const sesja = await zaloguj(autorUzytkownik.email);
    const odpowiedz = await pobierzOfertyEndpoint(
      zadanie(`/api/zlecenia/${zlecenieWolne}/oferty`, sesja),
      { params: Promise.resolve({ id: zlecenieWolne }) },
    );

    expect(odpowiedz.status).toBe(200);
    const dane = await odpowiedz.json();
    expect(dane.zakres).toBe("wszystkie");
    expect(dane.oferty.length).toBeGreaterThan(1);
    expect(dane.oferty[0]).toHaveProperty("nazwaFirmy");
  });
});

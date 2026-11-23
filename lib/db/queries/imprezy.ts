/**
 * Imprezy organizowane przez lokale.
 *
 * Cały SQL imprez mieszka tutaj, zgodnie z zasadą 3. Każda funkcja
 * przyjmuje widza jako pierwszy argument i odmawia, zanim dotknie
 * pozostałych; pilnuje tego tests/konwencja-zapytan.test.ts.
 *
 * DWIE BARIERY STOJĄ MIĘDZY IMPREZĄ A GOŚCIEM i obie są konieczne:
 *
 *   1. Impreza przeszła moderację. Ta sama kolejka co firmy, rodzaj
 *      zgłoszenia `event`.
 *   2. Lokal, który ją organizuje, jest widoczny w katalogu. Impreza
 *      zawieszonej sali nie ma się gdzie odbyć, a wpis o niej prowadziłby
 *      pod profil zwracający 404.
 *
 * Druga bariera bywa pomijana jako „przecież moderacja to złapie” i to
 * jest błąd: moderacja ocenia imprezę w chwili zgłoszenia, a zawieszenie
 * lokalu przychodzi później.
 */
import { and, asc, eq, exists, gte, lte, sql } from "drizzle-orm";
import { OKAZJA_INNA } from "@/content/okazje";
import { db } from "@/lib/db";
import type { Wynik } from "@/lib/db/queries/wynik";
import { subscriptions } from "@/lib/db/schema/abonament";
import { cities } from "@/lib/db/schema/geografia";
import { events } from "@/lib/db/schema/imprezy";
import { companies, companyMembers, eventTypes } from "@/lib/db/schema/katalog";
import { moderationSubmissions } from "@/lib/db/schema/moderacja";
import {
  mozeEdytowacProfil,
  upewnijSieZeGalazUprawnienIstnieje,
  type Widz,
} from "@/lib/permissions";

/** Impreza w zapowiedziach, gotowa do pokazania. */
export type ImprezaPubliczna = {
  slug: string;
  nazwa: string;
  okazja: string;
  data: string;
  godzinaOd: string;
  godzinaDo: string | null;
  /** `null` znaczy wstęp wolny. */
  cenaBiletuGrosze: number | null;
  opis: string;
  dlaDoroslych: boolean;
  lokal: { slug: string; nazwa: string; miejscowosc: string; powiat: string };
};

export type KryteriaImprez = {
  okazja: string | null;
  miejscowosc: string | null;
  od: string | null;
  do: string | null;
};

/**
 * Warunek „impreza jest widoczna”: przeszła moderację, a jej lokal jest
 * w katalogu. Jedno miejsce na obie bariery, bo rozpisane po zapytaniach
 * zostaną pominięte w którymś z nich.
 */
function jestWidoczna() {
  return and(
    exists(
      db
        .select({ jeden: sql`1` })
        .from(moderationSubmissions)
        .where(
          and(
            eq(moderationSubmissions.subjectKind, "event"),
            eq(moderationSubmissions.subjectId, events.id),
            eq(moderationSubmissions.status, "approved"),
          ),
        ),
    ),
    eq(companies.status, "active"),
    exists(
      db
        .select({ jeden: sql`1` })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.companyId, companies.id),
            eq(subscriptions.status, "active"),
            // Czas liczy baza, nie Node. Tak samo jak w katalogu.
            sql`${subscriptions.expiresAt} > now()`,
          ),
        ),
    ),
    exists(
      db
        .select({ jeden: sql`1` })
        .from(moderationSubmissions)
        .where(
          and(
            eq(moderationSubmissions.subjectKind, "company"),
            eq(moderationSubmissions.subjectId, companies.id),
            eq(moderationSubmissions.status, "approved"),
          ),
        ),
    ),
  );
}

/** Nazwa okazji: własna wygrywa ze słownikową, jak przy zleceniach. */
const nazwaOkazji = sql<string>`coalesce(${events.customEventName}, ${eventTypes.name})`;

/**
 * Zapowiedziane imprezy, od najbliższej.
 *
 * Imprezy z przeszłości nie wchodzą: zapowiedź wczorajszej imprezy nie jest
 * zapowiedzią. Granicą jest dzisiejsza data liczona przez bazę, nie przez
 * Node, żeby nie było dwóch zegarów.
 */
export async function pobierzImprezy(
  widz: Widz,
  kryteria: KryteriaImprez,
): Promise<ImprezaPubliczna[]> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "pobierzImprezy");

  const warunki = [jestWidoczna(), sql`${events.eventDate} >= current_date`];

  if (kryteria.okazja !== null) warunki.push(eq(eventTypes.slug, kryteria.okazja));
  if (kryteria.od !== null) warunki.push(gte(events.eventDate, kryteria.od));
  if (kryteria.do !== null) warunki.push(lte(events.eventDate, kryteria.do));
  if (kryteria.miejscowosc !== null) {
    warunki.push(eq(cities.slug, kryteria.miejscowosc));
  }

  const wiersze = await db
    .select({
      slug: events.slug,
      nazwa: events.name,
      okazja: nazwaOkazji,
      data: events.eventDate,
      godzinaOd: events.startsAt,
      godzinaDo: events.endsAt,
      cenaBiletuGrosze: events.ticketPrice,
      opis: events.description,
      dlaDoroslych: events.adultsOnly,
      lokalSlug: companies.slug,
      lokalNazwa: companies.name,
      miejscowosc: cities.name,
      powiat: cities.powiat,
    })
    .from(events)
    .innerJoin(companies, eq(companies.id, events.companyId))
    .innerJoin(cities, eq(cities.id, companies.cityId))
    .innerJoin(eventTypes, eq(eventTypes.id, events.eventTypeId))
    .where(and(...warunki))
    .orderBy(asc(events.eventDate), asc(events.startsAt));

  return wiersze.map(doImprezy);
}

/** Jedna impreza po slugu. `null`, gdy jej nie ma albo nie jest widoczna. */
export async function pobierzImpreze(widz: Widz, slug: string): Promise<ImprezaPubliczna | null> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "pobierzImpreze");

  const [wiersz] = await db
    .select({
      slug: events.slug,
      nazwa: events.name,
      okazja: nazwaOkazji,
      data: events.eventDate,
      godzinaOd: events.startsAt,
      godzinaDo: events.endsAt,
      cenaBiletuGrosze: events.ticketPrice,
      opis: events.description,
      dlaDoroslych: events.adultsOnly,
      lokalSlug: companies.slug,
      lokalNazwa: companies.name,
      miejscowosc: cities.name,
      powiat: cities.powiat,
    })
    .from(events)
    .innerJoin(companies, eq(companies.id, events.companyId))
    .innerJoin(cities, eq(cities.id, companies.cityId))
    .innerJoin(eventTypes, eq(eventTypes.id, events.eventTypeId))
    /*
     * Bez warunku na datę, w przeciwieństwie do listy. Impreza, która się
     * odbyła, zostaje pod swoim adresem: link z zaproszenia albo z mediów
     * społecznościowych ma prowadzić do opisu, a nie do 404. Z zapowiedzi
     * znika, bo zapowiedź dotyczy przyszłości.
     */
    .where(and(eq(events.slug, slug), jestWidoczna()))
    .limit(1);

  return wiersz ? doImprezy(wiersz) : null;
}

/** Imprezy tego lokalu, do panelu firmy. Także te czekające na akceptację. */
export async function pobierzImprezyFirmy(
  widz: Widz,
  companyId: string,
): Promise<Wynik<ImprezaWPanelu[]>> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "pobierzImprezyFirmy");

  const dostep = await czlonekLokalu(widz, companyId);
  /*
   * „Nie lokal” zwijamy tu do braku dostępu, bo panel pyta o imprezy
   * firmy, która ich mieć nie może, i odpowiedź „to nie lokal” nic mu
   * nie daje. Przy dodawaniu imprezy rozróżnienie ma sens i tam zostaje.
   */
  if (!dostep.ok) return { ok: false, powod: "brak-dostepu" };

  const wiersze = await db
    .select({
      id: events.id,
      slug: events.slug,
      nazwa: events.name,
      okazja: nazwaOkazji,
      data: events.eventDate,
      godzinaOd: events.startsAt,
      /*
       * Stan moderacji liczony podzapytaniem, a nie złączeniem: zgłoszeń
       * na jedną imprezę bywa kilka, bo odrzucona wraca poprawiona.
       * Złączenie zwielokrotniłoby wiersz imprezy.
       */
      zaakceptowana: sql<boolean>`exists (
        select 1 from ${moderationSubmissions}
        where ${moderationSubmissions.subjectKind} = 'event'
          and ${moderationSubmissions.subjectId} = ${events.id}
          and ${moderationSubmissions.status} = 'approved'
      )`,
    })
    .from(events)
    .innerJoin(eventTypes, eq(eventTypes.id, events.eventTypeId))
    .where(eq(events.companyId, companyId))
    .orderBy(asc(events.eventDate));

  return { ok: true, dane: wiersze };
}

export type ImprezaWPanelu = {
  id: string;
  slug: string;
  nazwa: string;
  okazja: string;
  data: string;
  godzinaOd: string;
  zaakceptowana: boolean;
};

export type OdmowaImprezy =
  | "brak-dostepu"
  | "nieznana-okazja"
  | "niezgodna-wlasna-okazja"
  | "nie-lokal";

export type DaneImprezy = {
  nazwa: string;
  okazja: string;
  innaOkazja: string | null;
  data: string;
  godzinaOd: string;
  godzinaDo: string | null;
  cenaBiletu: number | null;
  opis: string;
  dlaDoroslych: boolean;
};

/**
 * Dodanie imprezy przez lokal.
 *
 * Firmy nie bierzemy z wejścia: przychodzi z członkostwa zalogowanego
 * człowieka. Identyfikator przysłany formularzem pozwoliłby dopisać
 * imprezę do cudzej sali.
 */
export async function utworzImpreze(
  widz: Widz,
  companyId: string,
  dane: DaneImprezy,
): Promise<{ ok: true; dane: { id: string; slug: string } } | { ok: false; powod: OdmowaImprezy }> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "utworzImpreze");

  const dostep = await czlonekLokalu(widz, companyId);
  if (!dostep.ok)
    return { ok: false, powod: dostep.powod === "nie-lokal" ? "nie-lokal" : "brak-dostepu" };

  const [okazja] = await db
    .select({ id: eventTypes.id })
    .from(eventTypes)
    .where(eq(eventTypes.slug, dane.okazja))
    .limit(1);

  if (!okazja) return { ok: false, powod: "nieznana-okazja" };

  /*
   * Druga bariera pod regułą „własna nazwa dokładnie przy okazji `inna`”,
   * taka sama jak przy zleceniach. Warunku nie da się zapisać jako CHECK,
   * bo sięga przez klucz obcy do `event_types`.
   */
  const wlasnaNazwa = dane.innaOkazja?.trim() || null;
  if ((dane.okazja === OKAZJA_INNA.slug) !== (wlasnaNazwa !== null)) {
    return { ok: false, powod: "niezgodna-wlasna-okazja" };
  }

  const slug = await wolnySlugImprezy(dane.nazwa, dane.data);

  const [wstawiona] = await db
    .insert(events)
    .values({
      companyId,
      slug,
      name: dane.nazwa,
      eventTypeId: okazja.id,
      customEventName: wlasnaNazwa,
      eventDate: dane.data,
      startsAt: dane.godzinaOd,
      endsAt: dane.godzinaDo,
      ticketPrice: dane.cenaBiletu,
      description: dane.opis,
      adultsOnly: dane.dlaDoroslych,
    })
    .returning({ id: events.id, slug: events.slug });

  if (!wstawiona) throw new Error("utworzImpreze: zapis nie zwrócił wiersza.");

  return { ok: true, dane: wstawiona };
}

/**
 * Czy ten widz działa w imieniu tego lokalu.
 *
 * Dwa warunki naraz: członkostwo w firmie i to, że firma jest lokalem.
 * Drugi nie wynika z pierwszego i jest tu sednem: DJ ma pełne prawa do
 * własnego wpisu i żadnego do organizowania imprez, bo nie ma gdzie.
 */
async function czlonekLokalu(
  widz: Widz,
  companyId: string,
): Promise<{ ok: true } | { ok: false; powod: "brak-dostepu" | "nie-lokal" }> {
  const [firma] = await db
    .select({ kind: companies.kind })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (!firma) return { ok: false, powod: "brak-dostepu" };

  const userId = widz.rodzaj === "anonim" ? null : widz.userId;
  const [czlonkostwo] = userId
    ? await db
        .select({ id: companyMembers.id })
        .from(companyMembers)
        .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.userId, userId)))
        .limit(1)
    : [];

  const rozstrzygniecie = mozeEdytowacProfil(widz, czlonkostwo !== undefined);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: "brak-dostepu" };

  /*
   * Sprawdzane po uprawnieniach, nie przed. Obcy ma dostać tę samą odmowę
   * niezależnie od tego, czy cudza firma jest salą, czy DJ-em: inaczej
   * sama treść odmowy zdradzałaby, czym jest firma pod tym identyfikatorem.
   */
  if (firma.kind !== "venue") return { ok: false, powod: "nie-lokal" };

  return { ok: true };
}

/**
 * Wolny slug imprezy.
 *
 * Z nazwą i datą, bo „Sylwester” powtarza się co roku i w każdej sali.
 * Sam licznik dawałby „sylwester-2”, z czego nie wynika nic; z datą
 * adres mówi, o którą imprezę chodzi.
 */
async function wolnySlugImprezy(nazwa: string, data: string): Promise<string> {
  const podstawa = `${bezZnakow(nazwa)}-${data}`;

  for (let licznik = 0; licznik < 50; licznik++) {
    const kandydat = licznik === 0 ? podstawa : `${podstawa}-${licznik + 1}`;
    const [zajety] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.slug, kandydat))
      .limit(1);
    if (!zajety) return kandydat;
  }

  /*
   * Pięćdziesiąt imprez o tej samej nazwie tego samego dnia znaczy, że coś
   * jest nie tak z wejściem, a nie że trzeba szukać dalej. Głośny błąd
   * jest tu tańszy niż pętla bez końca.
   */
  throw new Error(`Nie znaleziono wolnego sluga dla imprezy „${nazwa}” w dniu ${data}.`);
}

/** Nazwa na slug: małe litery, bez polskich znaków, bez powtórzonych kresek. */
function bezZnakow(tekst: string): string {
  return tekst
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

type WierszImprezy = {
  slug: string;
  nazwa: string;
  okazja: string;
  data: string;
  godzinaOd: string;
  godzinaDo: string | null;
  cenaBiletuGrosze: number | null;
  opis: string;
  dlaDoroslych: boolean;
  lokalSlug: string;
  lokalNazwa: string;
  miejscowosc: string;
  powiat: string;
};

function doImprezy(w: WierszImprezy): ImprezaPubliczna {
  return {
    slug: w.slug,
    nazwa: w.nazwa,
    okazja: w.okazja,
    data: w.data,
    // Postgres oddaje `time` jako „20:00:00”; ekrany pokazują godziny i minuty.
    godzinaOd: w.godzinaOd.slice(0, 5),
    godzinaDo: w.godzinaDo ? w.godzinaDo.slice(0, 5) : null,
    cenaBiletuGrosze: w.cenaBiletuGrosze,
    opis: w.opis,
    dlaDoroslych: w.dlaDoroslych,
    lokal: {
      slug: w.lokalSlug,
      nazwa: w.lokalNazwa,
      miejscowosc: w.miejscowosc,
      powiat: w.powiat,
    },
  };
}

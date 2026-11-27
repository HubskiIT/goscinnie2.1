/**
 * Kolejka moderacji: zgłaszanie wpisów i rozstrzyganie zgłoszeń.
 *
 * Cały SQL dotyczący moderacji mieszka tutaj, zgodnie z zasadą 3.
 * Uprawnienia rozstrzyga `mozeModerowac` z lib/permissions.ts i żadna
 * funkcja poniżej nie podejmuje własnej decyzji o tym, kto co może.
 *
 * KAŻDA FUNKCJA PRZYJMUJE WIDZA JAKO PIERWSZY ARGUMENT i odmawia, zanim
 * dotknie pozostałych. Konwencji pilnuje tests/konwencja-zapytan.test.ts.
 */
import { and, asc, desc, eq, ilike, inArray, isNull, sql } from "drizzle-orm";
import { OKAZJA_INNA } from "@/content/okazje";
import { czyRodzajLokalu } from "@/content/rodzaje-lokali";
import { db } from "@/lib/db";
import { plans, subscriptions } from "@/lib/db/schema/abonament";
import { cities } from "@/lib/db/schema/geografia";
import { requests } from "@/lib/db/schema/gielda";
import { events } from "@/lib/db/schema/imprezy";
import {
  categories,
  companies,
  companyCategories,
  companyMembers,
  companyVerification,
  eventTypes,
} from "@/lib/db/schema/katalog";
import { type ModerationSubmission, moderationSubmissions } from "@/lib/db/schema/moderacja";
import { users } from "@/lib/db/schema/tozsamosc";
import {
  mozeModerowac,
  type PowodOdmowy,
  upewnijSieZeGalazUprawnienIstnieje,
  type Widz,
} from "@/lib/permissions";
import { DARMOWY_DOSTEP_DO } from "@/lib/serwis";
import type {
  DaneNowegoOgloszeniaModeratora,
  DaneNowejImprezyModeratora,
} from "@/lib/validators/moderacja";
import type { DaneNowegoZlecenia } from "@/lib/validators/zlecenia";

/** Co podlega moderacji. Odpowiada typowi `moderation_subject` w bazie. */
export type RodzajPrzedmiotu = (typeof moderationSubmissions.subjectKind.enumValues)[number];

export type WynikModeracji<T> = { ok: true; dane: T } | { ok: false; powod: PowodOdmowy };

/** Jeden wiersz kolejki, gotowy do pokazania w panelu. */
export type PozycjaKolejki = {
  id: string;
  rodzaj: RodzajPrzedmiotu;
  przedmiotId: string;
  zgloszoneO: Date;
  /**
   * Nazwa przedmiotu, żeby panel nie pokazywał samych identyfikatorów.
   * Pusta, gdy wiersz, na który wskazuje zgłoszenie, nie istnieje: to się
   * nie powinno zdarzyć, bo nic nie znika z bazy, ale panel ma pokazać
   * taki wiersz, a nie wywalić się na nim.
   */
  nazwa: string | null;
  /**
   * Adres, pod którym da się obejrzeć wpis przed decyzją.
   *
   * Składany tutaj, a nie w komponencie, bo każdy rodzaj przedmiotu ma
   * inną trasę i inny identyfikator w adresie: firma chodzi po slugu,
   * nie po UUID. Komponent składający te adresy sam musiałby znać
   * routing czterech encji naraz.
   *
   * Pusty, gdy rodzaju jeszcze nie umiemy pokazać. Pozycja zostaje wtedy
   * w kolejce bez odnośnika, zamiast prowadzić pod adres, który nie
   * istnieje: martwy link w panelu moderacji jest gorszy niż jego brak,
   * bo moderator klika go raz i przestaje ufać całej liście.
   */
  adresPodgladu: string | null;
  /** Dodatkowy kontekst do podglądu w kolejce (np. dla imprez bez publicznego linku). */
  szczegoly?: string | null;
};

/**
 * Zgłoszenie wpisu do moderacji.
 *
 * NIE SPRAWDZA UPRAWNIEŃ MODERATORA i to jest celowe: zgłasza firma albo
 * klient, czyli ten, kto właśnie coś wysłał. Dlatego widz służy tu wyłącznie
 * do odmowy anonimowi, a o tym, czy ten człowiek ma prawo wysłać ten wpis,
 * rozstrzyga funkcja wołająca, przy swoim własnym przedmiocie.
 *
 * `onConflictDoNothing` zamiast błędu: drugie kliknięcie „wyślij do
 * akceptacji” ma być bez skutku, a nie czerwonym ekranem. Częściowy indeks
 * unikalny z migracji 0015 dopuszcza jedno oczekujące zgłoszenie na przedmiot
 * i to on jest tu źródłem prawdy, nie sprawdzenie w kodzie, które zawsze
 * przegrywa wyścig z drugim żądaniem.
 */
export async function zglosDoModeracji(
  widz: Widz,
  rodzaj: RodzajPrzedmiotu,
  przedmiotId: string,
): Promise<WynikModeracji<null>> {
  // Domyślna odmowa w pierwszej linii, przed czymkolwiek innym.
  upewnijSieZeGalazUprawnienIstnieje(widz, "zglosDoModeracji");

  if (widz.rodzaj === "anonim") return { ok: false, powod: "brak-dostepu" };

  await db
    .insert(moderationSubmissions)
    .values({ subjectKind: rodzaj, subjectId: przedmiotId })
    .onConflictDoNothing();

  return { ok: true, dane: null };
}

/**
 * Czy ten przedmiot ma zgodę moderacji.
 *
 * Używane przez zapytania, które decydują o publicznej widoczności.
 * Liczy się **istnienie zgody**, a nie ostatni wiersz: firma raz przyjęta
 * zostaje w katalogu, gdy czeka na akceptację kolejnej zmiany. Inaczej
 * każda poprawka opisu wyrzucałaby ją z katalogu na czas rozpatrywania,
 * co jest karą za aktualizowanie wpisu.
 */
export async function czyZaakceptowany(
  widz: Widz,
  rodzaj: RodzajPrzedmiotu,
  przedmiotId: string,
): Promise<WynikModeracji<boolean>> {
  /*
   * Pytanie o widoczność zadaje każdy, łącznie z anonimem: to on ogląda
   * katalog. Ta funkcja nikomu więc nie odmawia z powodu roli, ale i tak
   * przechodzi przez bramę domyślnej odmowy, bo widz spoza typu znaczy,
   * że ktoś dopisał wariant i nie przemyślał tego miejsca. Cisza byłaby
   * tu gorsza niż wyjątek.
   */
  upewnijSieZeGalazUprawnienIstnieje(widz, "czyZaakceptowany");

  const [wiersz] = await db
    .select({ id: moderationSubmissions.id })
    .from(moderationSubmissions)
    .where(
      and(
        eq(moderationSubmissions.subjectKind, rodzaj),
        eq(moderationSubmissions.subjectId, przedmiotId),
        eq(moderationSubmissions.status, "approved"),
      ),
    )
    .limit(1);

  return { ok: true, dane: wiersz !== undefined };
}

/**
 * Kolejka zgłoszeń czekających na decyzję, od najstarszego.
 *
 * Od najstarszego, bo kolejka moderacji jest zobowiązaniem wobec ludzi,
 * którzy czekają. Sortowanie od najnowszego sprawia, że wpis, który raz
 * spadł na dół, nie wraca nigdy.
 */
export async function pobierzKolejke(widz: Widz): Promise<WynikModeracji<PozycjaKolejki[]>> {
  const rozstrzygniecie = mozeModerowac(widz);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };

  const zgloszenia = await db
    .select({
      id: moderationSubmissions.id,
      rodzaj: moderationSubmissions.subjectKind,
      przedmiotId: moderationSubmissions.subjectId,
      zgloszoneO: moderationSubmissions.createdAt,
    })
    .from(moderationSubmissions)
    .where(eq(moderationSubmissions.status, "pending"))
    .orderBy(asc(moderationSubmissions.createdAt));

  /*
   * Nazwy dociągamy osobnym zapytaniem na rodzaj, a nie złączeniem.
   * `subject_id` wskazuje na cztery różne tabele, więc złączenie wymagałoby
   * czterech lewych złączeń i tyluż kolumn z nazwą, z których trzy byłyby
   * puste w każdym wierszu.
   *
   * Rozpoznajemy wszystkie cztery rodzaje. Wiersz, którego przedmiotu
   * nie da się odnaleźć, zostaje w kolejce bez nazwy, a nie znika:
   * zgłoszenie ma dać się rozstrzygnąć nawet wtedy, gdy coś poszło nie tak.
   */
  const idFirm = zgloszenia
    .filter((z) => z.rodzaj === "company" || z.rodzaj === "company_change")
    .map((z) => z.przedmiotId);

  const firmy = new Map<string, { nazwa: string; slug: string }>();
  if (idFirm.length > 0) {
    const wiersze = await db
      .select({ id: companies.id, nazwa: companies.name, slug: companies.slug })
      .from(companies)
      .where(inArray(companies.id, idFirm));
    for (const wiersz of wiersze) {
      firmy.set(wiersz.id, { nazwa: wiersz.nazwa, slug: wiersz.slug });
    }
  }

  const idZlecen = zgloszenia.filter((z) => z.rodzaj === "request").map((z) => z.przedmiotId);

  const zlecenia = new Map<string, { okazja: string; goscie: number; powiat: string }>();
  if (idZlecen.length > 0) {
    const wiersze = await db
      .select({
        id: requests.id,
        okazja: sql<string>`coalesce(${requests.customEventName}, ${eventTypes.name})`,
        goscie: requests.guests,
        powiat: cities.powiat,
      })
      .from(requests)
      .innerJoin(eventTypes, eq(eventTypes.id, requests.eventTypeId))
      .innerJoin(cities, eq(cities.id, requests.cityId))
      .where(inArray(requests.id, idZlecen));
    for (const wiersz of wiersze) {
      zlecenia.set(wiersz.id, {
        okazja: wiersz.okazja,
        goscie: wiersz.goscie,
        powiat: wiersz.powiat,
      });
    }
  }

  const idImprez = zgloszenia.filter((z) => z.rodzaj === "event").map((z) => z.przedmiotId);

  const imprezy = new Map<
    string,
    { nazwa: string; slug: string; data: string; lokal: string; opis: string }
  >();
  if (idImprez.length > 0) {
    const wiersze = await db
      .select({
        id: events.id,
        nazwa: events.name,
        slug: events.slug,
        data: events.eventDate,
        lokal: companies.name,
        opis: events.description,
      })
      .from(events)
      .innerJoin(companies, eq(companies.id, events.companyId))
      .where(inArray(events.id, idImprez));
    for (const wiersz of wiersze) {
      imprezy.set(wiersz.id, {
        nazwa: wiersz.nazwa,
        slug: wiersz.slug,
        data: wiersz.data,
        lokal: wiersz.lokal,
        opis: wiersz.opis,
      });
    }
  }

  return {
    ok: true,
    dane: zgloszenia.map((z) => {
      const firma = firmy.get(z.przedmiotId);
      if (firma) {
        return { ...z, nazwa: firma.nazwa, adresPodgladu: `/f/${firma.slug}`, szczegoly: null };
      }

      const impreza = imprezy.get(z.przedmiotId);
      if (impreza) {
        return {
          ...z,
          nazwa: impreza.nazwa,
          adresPodgladu: null,
          szczegoly: `${impreza.data} • ${impreza.lokal} — ${impreza.opis.slice(0, 180)}`,
        };
      }

      const zlecenie = zlecenia.get(z.przedmiotId);
      if (zlecenie) {
        return {
          ...z,
          nazwa: `${zlecenie.okazja}, ${zlecenie.goscie} osób, powiat ${zlecenie.powiat}`,
          adresPodgladu: `/zlecenia/${z.przedmiotId}`,
          szczegoly: null,
        };
      }

      return { ...z, nazwa: null, adresPodgladu: null, szczegoly: null };
    }),
  };
}

/** Historia decyzji, od najnowszej. Do podglądu, co się działo. */
export async function pobierzRozstrzygniete(
  widz: Widz,
  limit = 50,
): Promise<WynikModeracji<ModerationSubmission[]>> {
  const rozstrzygniecie = mozeModerowac(widz);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };

  const wiersze = await db
    .select()
    .from(moderationSubmissions)
    .where(inArray(moderationSubmissions.status, ["approved", "rejected"]))
    .orderBy(desc(moderationSubmissions.decidedAt))
    .limit(limit);

  return { ok: true, dane: wiersze };
}

export type Decyzja = { rodzaj: "zgoda" } | { rodzaj: "odmowa"; powod: string };

/**
 * Rozstrzygnięcie zgłoszenia.
 *
 * Zwraca rozstrzygnięty wiersz, żeby wywołujący wiedział, czego dotyczyła
 * decyzja, i mógł zrobić swoje: wpuścić firmę do katalogu, odłożyć zmianę,
 * napisać do zgłaszającego. Ta funkcja sama nie rusza przedmiotu zgłoszenia
 * i nie powinna: wiedza o tym, co znaczy „zgoda” dla firmy, a co dla
 * imprezy, należy do modułów tych przedmiotów, nie do kolejki.
 *
 * Zapis warunkowy na `status = 'pending'`, a nie odczyt i potem zapis:
 * dwie karty otwarte na tej samej kolejce to zwykła sytuacja, a nie
 * wyścig egzotyczny. Przy sprawdzeniu w kodzie druga karta nadpisywałaby
 * decyzję pierwszej i cicho zmieniała zgodę w odmowę.
 */
export async function rozstrzygnij(
  widz: Widz,
  zgloszenieId: string,
  decyzja: Decyzja,
): Promise<WynikModeracji<ModerationSubmission>> {
  const rozstrzygniecie = mozeModerowac(widz);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };

  // Zawężenie typu: `mozeModerowac` przepuszcza wyłącznie moderatora,
  // a `userId` istnieje dopiero po tym warunku.
  if (widz.rodzaj !== "moderator") return { ok: false, powod: "brak-dostepu" };

  const [zmienione] = await db
    .update(moderationSubmissions)
    .set({
      status: decyzja.rodzaj === "zgoda" ? "approved" : "rejected",
      reason: decyzja.rodzaj === "odmowa" ? decyzja.powod : null,
      decidedByUserId: widz.userId,
      decidedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(eq(moderationSubmissions.id, zgloszenieId), eq(moderationSubmissions.status, "pending")),
    )
    .returning();

  /*
   * Brak wiersza znaczy jedno z dwojga: zgłoszenia nie ma albo ktoś je już
   * rozstrzygnął. Te dwa przypadki są celowo nierozróżnialne i nie z ostrożności
   * wobec napastnika, tylko dlatego, że dla moderatora odpowiedź jest ta sama:
   * nie ma tu nic do zrobienia.
   */
  if (!zmienione) return { ok: false, powod: "brak-dostepu" };

  return { ok: true, dane: zmienione };
}

/** Komu wysłać decyzję i w sprawie czego. */
export type AdresatDecyzji = { email: string; nazwaFirmy: string };

/**
 * Właściciel wpisu, którego dotyczy zgłoszenie.
 *
 * Osobne zapytanie, a nie pole w `rozstrzygnij`, bo rozstrzyganie i pisanie
 * listu to dwie różne rzeczy: decyzja ma zapaść także wtedy, gdy poczta
 * leży. Akcja woła najpierw jedno, potem drugie, i nieudana wysyłka nie
 * cofa decyzji.
 *
 * Dziś rozpoznaje wyłącznie firmy. Imprezy i zlecenia dojdą ze swoimi
 * plastrami i wtedy ta funkcja urośnie o ich gałęzie. Do tego czasu
 * zwraca `null`, czyli „nie ma komu pisać”, a nie rzuca: decyzja
 * o imprezie ma zapaść, nawet jeśli nie umiemy o niej jeszcze zawiadomić.
 */
export async function pobierzAdresataDecyzji(
  widz: Widz,
  rodzaj: RodzajPrzedmiotu,
  przedmiotId: string,
): Promise<WynikModeracji<AdresatDecyzji | null>> {
  const rozstrzygniecie = mozeModerowac(widz);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };

  if (rodzaj === "event") {
    /*
     * Przy imprezie piszemy do właściciela lokalu, bo to on ją zgłosił,
     * ale nazywamy ją po imieniu. „Wpis »Dwór Pod Lipami« wymaga
     * poprawki” przy odrzuconej imprezie sylwestrowej brzmi jak decyzja
     * o całym profilu i tak zostałoby przeczytane.
     */
    const [wiersz] = await db
      .select({ email: users.email, nazwaFirmy: events.name })
      .from(events)
      .innerJoin(companies, eq(companies.id, events.companyId))
      .innerJoin(users, eq(users.id, companies.ownerUserId))
      .where(eq(events.id, przedmiotId))
      .limit(1);

    return { ok: true, dane: wiersz ?? null };
  }

  if (rodzaj === "request") {
    /*
     * Przy zleceniu piszemy do jego autora, czyli do klienta. Zamiast
     * nazwy firmy, której klient nie ma, w to miejsce idzie opis zlecenia
     * jednym zdaniem: „Komunia, 80 osób”. List o „wpisie »undefined«”
     * byłby gorszy niż brak listu.
     */
    const [wiersz] = await db
      .select({
        email: users.email,
        nazwaFirmy: sql<string>`
          coalesce(${requests.customEventName}, ${eventTypes.name})
          || ', ' || ${requests.guests} || ' osób'
        `,
      })
      .from(requests)
      .innerJoin(users, eq(users.id, requests.authorUserId))
      .innerJoin(eventTypes, eq(eventTypes.id, requests.eventTypeId))
      .where(eq(requests.id, przedmiotId))
      .limit(1);

    return { ok: true, dane: wiersz ?? null };
  }

  if (rodzaj !== "company" && rodzaj !== "company_change") {
    return { ok: true, dane: null };
  }

  const [wiersz] = await db
    .select({ email: users.email, nazwaFirmy: companies.name })
    .from(companies)
    .innerJoin(users, eq(users.id, companies.ownerUserId))
    .where(eq(companies.id, przedmiotId))
    .limit(1);

  return { ok: true, dane: wiersz ?? null };
}

/** Stan wpisu widziany oczami jego właściciela. */
export type StanWpisu =
  | { rodzaj: "nigdy-nie-zgloszony" }
  | { rodzaj: "czeka"; zgloszoneO: Date }
  | { rodzaj: "przyjety"; decyzjaO: Date }
  /** Odmowa zawsze niesie powód: pilnuje tego `rozstrzygnij` i panel. */
  | { rodzaj: "odrzucony"; decyzjaO: Date; powod: string };

/**
 * Stan moderacji wpisu firmy, do pokazania właścicielowi w jego panelu.
 *
 * Bierze **ostatnie** zgłoszenie, a nie istnienie zgody, i to jest inna
 * odpowiedź niż ta, której potrzebuje katalog. Katalog pyta „czy wolno to
 * pokazać światu” i odpowiada mu zgoda kiedykolwiek. Właściciel pyta „co
 * się dzieje z tym, co wysłałem”, a na to odpowiada wyłącznie ostatnia
 * decyzja: firma w katalogu z odrzuconą poprawką ma zobaczyć tę odmowę,
 * a nie zgodę sprzed pół roku.
 *
 * Dostęp ma członek tej firmy i moderator. Obcemu nic do tego: stan
 * moderacji cudzego wpisu mówi, że ktoś coś zgłosił i co mu odpowiedziano.
 */
export async function pobierzStanWpisuFirmy(
  widz: Widz,
  companyId: string,
  czlonekTejFirmy: boolean,
): Promise<WynikModeracji<StanWpisu>> {
  /*
   * Brama przed sprawdzeniem członkostwa, nie po nim. Przy odwrotnej
   * kolejności widz spoza typu z `czlonekTejFirmy` ustawionym na prawdę
   * przechodziłby bez żadnej kontroli, bo alternatywa zwarłaby się na
   * pierwszym członie i `mozeModerowac` nigdy by się nie wykonało.
   */
  upewnijSieZeGalazUprawnienIstnieje(widz, "pobierzStanWpisuFirmy");

  const wolno = czlonekTejFirmy || mozeModerowac(widz).wolno;
  if (!wolno) return { ok: false, powod: "brak-dostepu" };

  const [ostatnie] = await db
    .select({
      status: moderationSubmissions.status,
      powod: moderationSubmissions.reason,
      zgloszoneO: moderationSubmissions.createdAt,
      decyzjaO: moderationSubmissions.decidedAt,
    })
    .from(moderationSubmissions)
    .where(
      and(
        inArray(moderationSubmissions.subjectKind, ["company", "company_change"]),
        eq(moderationSubmissions.subjectId, companyId),
      ),
    )
    .orderBy(desc(moderationSubmissions.createdAt))
    .limit(1);

  if (!ostatnie) return { ok: true, dane: { rodzaj: "nigdy-nie-zgloszony" } };

  if (ostatnie.status === "pending") {
    return { ok: true, dane: { rodzaj: "czeka", zgloszoneO: ostatnie.zgloszoneO } };
  }

  /*
   * Data decyzji nie może tu być pusta: pilnuje tego CHECK
   * `moderation_submissions_decyzja_ma_date` z migracji 0015. Zamiast
   * udawać, że może, i podstawiać datę zgłoszenia, wolimy głośny błąd:
   * pusta data przy rozstrzygniętym wierszu znaczy, że ktoś ustawił
   * status z pominięciem `rozstrzygnij`.
   */
  if (ostatnie.decyzjaO === null) {
    throw new Error(
      `Zgłoszenie moderacyjne firmy ${companyId} ma status ${ostatnie.status} bez daty decyzji. ` +
        "Status zmieniono z pominięciem rozstrzygnij() w lib/db/queries/moderacja.ts.",
    );
  }

  if (ostatnie.status === "approved") {
    return { ok: true, dane: { rodzaj: "przyjety", decyzjaO: ostatnie.decyzjaO } };
  }

  return {
    ok: true,
    dane: {
      rodzaj: "odrzucony",
      decyzjaO: ostatnie.decyzjaO,
      // Odmowa bez powodu nie powstaje przez rozstrzygnij(), ale gdyby
      // powstała inną drogą, panel ma pokazać cokolwiek sensownego.
      powod: ostatnie.powod ?? "Bez podanego powodu. Napisz do nas, wyjaśnimy.",
    },
  };
}

export type StatystykiModeracji = {
  doDecyzji: number;
  aktywneFirmy: number;
  szkiceFirm: number;
  zawieszoneFirmy: number;
  zleceniaOtwarte: number;
  imprezy: number;
  uzytkownicy: number;
};

/** Liczby poglądowe na górę panelu moderatora. */
export async function pobierzStatystykiModeracji(
  widz: Widz,
): Promise<WynikModeracji<StatystykiModeracji>> {
  const rozstrzygniecie = mozeModerowac(widz);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };

  const [wiersz] = await db
    .select({
      doDecyzji: sql<number>`(select count(*)::int from ${moderationSubmissions} where ${moderationSubmissions.status} = 'pending')`,
      aktywneFirmy: sql<number>`(select count(*)::int from ${companies} where ${companies.status} = 'active')`,
      szkiceFirm: sql<number>`(select count(*)::int from ${companies} where ${companies.status} = 'draft')`,
      zawieszoneFirmy: sql<number>`(select count(*)::int from ${companies} where ${companies.status} = 'suspended')`,
      zleceniaOtwarte: sql<number>`(select count(*)::int from ${requests} where ${requests.status} = 'open')`,
      imprezy: sql<number>`(select count(*)::int from ${events})`,
      uzytkownicy: sql<number>`(select count(*)::int from ${users})`,
    })
    .from(sql`(select 1) as _`);

  return {
    ok: true,
    dane: wiersz ?? {
      doDecyzji: 0,
      aktywneFirmy: 0,
      szkiceFirm: 0,
      zawieszoneFirmy: 0,
      zleceniaOtwarte: 0,
      imprezy: 0,
      uzytkownicy: 0,
    },
  };
}

export type FirmaDlaModeratora = {
  id: string;
  nazwa: string;
  slug: string;
  status: "draft" | "active" | "visitcard" | "suspended";
  rodzaj: "venue" | "service" | null;
  kategoria: string | null;
  miejscowosc: string;
  wlascicielEmail: string;
  zaakceptowana: boolean;
  maAktywnyAbonament: boolean;
  utworzono: Date;
};

/** Lista wszystkich firm w serwisie, do zarządzania przez moderatora. */
export async function pobierzWszystkieFirmyModeratora(
  widz: Widz,
  filtry: { status?: string; szukaj?: string } = {},
): Promise<WynikModeracji<FirmaDlaModeratora[]>> {
  const rozstrzygniecie = mozeModerowac(widz);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };

  const warunki = [];
  if (
    filtry.status === "draft" ||
    filtry.status === "active" ||
    filtry.status === "visitcard" ||
    filtry.status === "suspended"
  ) {
    warunki.push(eq(companies.status, filtry.status));
  }
  const fraza = filtry.szukaj?.trim();
  if (fraza) {
    warunki.push(ilike(companies.name, `%${fraza}%`));
  }

  const wiersze = await db
    .select({
      id: companies.id,
      nazwa: companies.name,
      slug: companies.slug,
      status: companies.status,
      rodzaj: companies.kind,
      kategoria: categories.name,
      miejscowosc: cities.name,
      wlascicielEmail: users.email,
      zaakceptowana: sql<boolean>`exists (
        select 1 from ${moderationSubmissions}
        where ${moderationSubmissions.subjectKind} = 'company'
          and ${moderationSubmissions.subjectId} = ${companies.id}
          and ${moderationSubmissions.status} = 'approved'
      )`,
      maAktywnyAbonament: sql<boolean>`exists (
        select 1 from ${subscriptions}
        where ${subscriptions.companyId} = ${companies.id}
          and ${subscriptions.status} = 'active'
          and ${subscriptions.expiresAt} > now()
      )`,
      utworzono: companies.createdAt,
    })
    .from(companies)
    .innerJoin(cities, eq(cities.id, companies.cityId))
    .innerJoin(users, eq(users.id, companies.ownerUserId))
    .leftJoin(
      companyCategories,
      and(eq(companyCategories.companyId, companies.id), isNull(companyCategories.archivedAt)),
    )
    .leftJoin(categories, eq(categories.id, companyCategories.categoryId))
    .where(warunki.length > 0 ? and(...warunki) : undefined)
    .orderBy(desc(companies.createdAt))
    .limit(100);

  return { ok: true, dane: wiersze };
}

/** Szybka zmiana statusu firmy przez moderatora (zatwierdź, zawieś, przywróć). */
export async function zmienStatusFirmyModerator(
  widz: Widz,
  companyId: string,
  akcja: "zatwierdz" | "zawies" | "przywroc",
): Promise<WynikModeracji<{ nazwa: string; slug: string }>> {
  const rozstrzygniecie = mozeModerowac(widz);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };
  if (widz.rodzaj !== "moderator") return { ok: false, powod: "brak-dostepu" };

  const [firma] = await db
    .select({ id: companies.id, nazwa: companies.name, slug: companies.slug })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (!firma) return { ok: false, powod: "brak-dostepu" };

  if (akcja === "zawies") {
    await db
      .update(companies)
      .set({ status: "suspended", updatedAt: new Date() })
      .where(eq(companies.id, companyId));
    return { ok: true, dane: { nazwa: firma.nazwa, slug: firma.slug } };
  }

  if (akcja === "przywroc") {
    await db
      .update(companies)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(companies.id, companyId));
    return { ok: true, dane: { nazwa: firma.nazwa, slug: firma.slug } };
  }

  // akcja === "zatwierdz": aktywuj, nadaj darmowy abonament jeśli brak, zatwierdź w moderacji
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

  await db.transaction(async (tx) => {
    const teraz = new Date();
    await tx
      .update(companies)
      .set({ status: "active", updatedAt: teraz })
      .where(eq(companies.id, companyId));

    const [maAbonament] = await tx
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.companyId, companyId),
          eq(subscriptions.status, "active"),
          sql`${subscriptions.expiresAt} > now()`,
        ),
      )
      .limit(1);

    if (!maAbonament && plan) {
      await tx.insert(subscriptions).values({
        companyId,
        planId: plan.id,
        status: "active",
        expiresAt: DARMOWY_DOSTEP_DO,
      });
    }

    const [oczekujace] = await tx
      .select({ id: moderationSubmissions.id })
      .from(moderationSubmissions)
      .where(
        and(
          inArray(moderationSubmissions.subjectKind, ["company", "company_change"]),
          eq(moderationSubmissions.subjectId, companyId),
          eq(moderationSubmissions.status, "pending"),
        ),
      )
      .limit(1);

    if (oczekujace) {
      await tx
        .update(moderationSubmissions)
        .set({
          status: "approved",
          reason: null,
          decidedByUserId: widz.userId,
          decidedAt: teraz,
          updatedAt: teraz,
        })
        .where(eq(moderationSubmissions.id, oczekujace.id));
    } else {
      await tx
        .insert(moderationSubmissions)
        .values({
          subjectKind: "company",
          subjectId: companyId,
          status: "approved",
          decidedByUserId: widz.userId,
          decidedAt: teraz,
        })
        .onConflictDoNothing();
    }
  });

  return { ok: true, dane: { nazwa: firma.nazwa, slug: firma.slug } };
}

function doSluguModerator(nazwa: string): string {
  return nazwa
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function wolnySlugFirmyModerator(nazwa: string): Promise<string> {
  const podstawa = doSluguModerator(nazwa) || "firma";
  const kandydaci = [podstawa, ...Array.from({ length: 50 }, (_, i) => `${podstawa}-${i + 2}`)];
  const zajete = await db
    .select({ slug: companies.slug })
    .from(companies)
    .where(inArray(companies.slug, kandydaci));
  const zajeteSet = new Set(zajete.map((z) => z.slug));
  const wolny = kandydaci.find((k) => !zajeteSet.has(k));
  if (!wolny) throw new Error(`Brak wolnego sluga dla „${nazwa}”.`);
  return wolny;
}

async function wolnySlugImprezyModerator(nazwa: string, data: string): Promise<string> {
  const podstawa = `${doSluguModerator(nazwa) || "impreza"}-${data}`;
  const kandydaci = [podstawa, ...Array.from({ length: 50 }, (_, i) => `${podstawa}-${i + 2}`)];
  const zajete = await db
    .select({ slug: events.slug })
    .from(events)
    .where(inArray(events.slug, kandydaci));
  const zajeteSet = new Set(zajete.map((z) => z.slug));
  const wolny = kandydaci.find((k) => !zajeteSet.has(k));
  if (!wolny) throw new Error(`Brak wolnego sluga imprezy dla „${nazwa}”.`);
  return wolny;
}

export type OdmowaTworzeniaModeratora =
  | PowodOdmowy
  | "nieznana-kategoria"
  | "miejscowosc-bez-wspolrzednych"
  | "nieznany-wlasciciel"
  | "nie-lokal"
  | "nieznana-okazja"
  | "niezgodna-wlasna-okazja";

/** Bezpośrednie dodanie firmy/lokalu/usługodawcy przez moderatora. */
export async function utworzOgloszenieModeratora(
  widz: Widz,
  dane: DaneNowegoOgloszeniaModeratora,
): Promise<
  | { ok: true; dane: { id: string; slug: string; nazwa: string } }
  | { ok: false; powod: OdmowaTworzeniaModeratora }
> {
  const rozstrzygniecie = mozeModerowac(widz);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };
  if (widz.rodzaj !== "moderator") return { ok: false, powod: "brak-dostepu" };

  const [kategoria] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, dane.kategoria))
    .limit(1);
  if (!kategoria) return { ok: false, powod: "nieznana-kategoria" };

  const [miejscowosc] = await db
    .select({ id: cities.id, maPunkt: sql<boolean>`${cities.point} is not null` })
    .from(cities)
    .where(eq(cities.id, dane.cityId))
    .limit(1);
  if (!miejscowosc?.maPunkt) {
    return { ok: false, powod: "miejscowosc-bez-wspolrzednych" };
  }

  let ownerUserId = widz.userId;
  if (dane.wlascicielEmail) {
    const [wlasciciel] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, dane.wlascicielEmail.toLowerCase()))
      .limit(1);
    if (!wlasciciel) return { ok: false, powod: "nieznany-wlasciciel" };
    ownerUserId = wlasciciel.id;
  }

  const slug = await wolnySlugFirmyModerator(dane.nazwa);
  const rodzaj = czyRodzajLokalu(dane.kategoria) ? "venue" : "service";

  const [plan] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(and(eq(plans.categoryId, kategoria.id), eq(plans.code, "start")))
    .limit(1);

  const teraz = new Date();
  const utworzona = await db.transaction(async (tx) => {
    const [firma] = await tx
      .insert(companies)
      .values({
        ownerUserId,
        name: dane.nazwa,
        slug,
        cityId: miejscowosc.id,
        point: sql`(select ${cities.point} from ${cities} where ${cities.id} = ${miejscowosc.id})`,
        description: dane.opis,
        priceFrom: dane.cenaOd,
        capacityMin: dane.pojemnoscMin,
        capacityMax: dane.pojemnoscMax,
        status: dane.opublikujOdRazu ? "active" : "draft",
        kind: rodzaj,
      })
      .returning({ id: companies.id, slug: companies.slug, nazwa: companies.name });

    if (!firma) throw new Error("utworzOgloszenieModeratora: brak wiersza.");

    await tx.insert(companyMembers).values({
      companyId: firma.id,
      userId: ownerUserId,
      role: "owner",
    });

    await tx.insert(companyCategories).values({
      companyId: firma.id,
      categoryId: kategoria.id,
    });

    if (dane.nip && dane.telefon) {
      await tx.insert(companyVerification).values({
        companyId: firma.id,
        nip: dane.nip.replace(/[\s-]/g, ""),
        telefon: dane.telefon.replace(/[\s-]/g, "").replace(/^(\+48|0048)/, ""),
      });
    }

    if (dane.opublikujOdRazu) {
      if (plan) {
        await tx.insert(subscriptions).values({
          companyId: firma.id,
          planId: plan.id,
          status: "active",
          expiresAt: DARMOWY_DOSTEP_DO,
        });
      }
      await tx.insert(moderationSubmissions).values({
        subjectKind: "company",
        subjectId: firma.id,
        status: "approved",
        decidedByUserId: widz.userId,
        decidedAt: teraz,
      });
    }

    return firma;
  });

  return { ok: true, dane: utworzona };
}

/** Bezpośrednie dodanie imprezy dla wybranego lokalu przez moderatora. */
export async function utworzImprezeModeratora(
  widz: Widz,
  dane: DaneNowejImprezyModeratora,
): Promise<
  | { ok: true; dane: { id: string; slug: string; nazwa: string } }
  | { ok: false; powod: OdmowaTworzeniaModeratora }
> {
  const rozstrzygniecie = mozeModerowac(widz);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };
  if (widz.rodzaj !== "moderator") return { ok: false, powod: "brak-dostepu" };

  const [firma] = await db
    .select({ id: companies.id, kind: companies.kind })
    .from(companies)
    .where(eq(companies.id, dane.companyId))
    .limit(1);
  if (firma?.kind !== "venue") return { ok: false, powod: "nie-lokal" };

  const [okazja] = await db
    .select({ id: eventTypes.id })
    .from(eventTypes)
    .where(eq(eventTypes.slug, dane.okazja))
    .limit(1);
  if (!okazja) return { ok: false, powod: "nieznana-okazja" };

  const wlasnaNazwa = dane.innaOkazja?.trim() || null;
  if ((dane.okazja === OKAZJA_INNA.slug) !== (wlasnaNazwa !== null)) {
    return { ok: false, powod: "niezgodna-wlasna-okazja" };
  }

  const slug = await wolnySlugImprezyModerator(dane.nazwa, dane.data);
  const teraz = new Date();

  const wstawiona = await db.transaction(async (tx) => {
    const [impreza] = await tx
      .insert(events)
      .values({
        companyId: firma.id,
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
      .returning({ id: events.id, slug: events.slug, nazwa: events.name });

    if (!impreza) throw new Error("utworzImprezeModeratora: brak wiersza.");

    await tx.insert(moderationSubmissions).values({
      subjectKind: "event",
      subjectId: impreza.id,
      status: "approved",
      decidedByUserId: widz.userId,
      decidedAt: teraz,
    });

    return impreza;
  });

  return { ok: true, dane: wstawiona };
}

/** Bezpośrednie wystawienie zlecenia przez moderatora (od razu zatwierdzone). */
export async function utworzZlecenieModeratora(
  widz: Widz,
  dane: DaneNowegoZlecenia,
): Promise<{ ok: true; dane: { id: string } } | { ok: false; powod: OdmowaTworzeniaModeratora }> {
  const rozstrzygniecie = mozeModerowac(widz);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };
  if (widz.rodzaj !== "moderator") return { ok: false, powod: "brak-dostepu" };

  const [okazja] = await db
    .select({ id: eventTypes.id })
    .from(eventTypes)
    .where(eq(eventTypes.slug, dane.okazja))
    .limit(1);
  if (!okazja) return { ok: false, powod: "nieznana-okazja" };

  const wlasnaNazwa = dane.innaOkazja?.trim() || null;
  if ((dane.okazja === OKAZJA_INNA.slug) !== (wlasnaNazwa !== null)) {
    return { ok: false, powod: "niezgodna-wlasna-okazja" };
  }

  const [miejscowosc] = await db
    .select({ id: cities.id, maPunkt: sql<boolean>`${cities.point} is not null` })
    .from(cities)
    .where(eq(cities.id, dane.cityId))
    .limit(1);
  if (!miejscowosc?.maPunkt) {
    return { ok: false, powod: "miejscowosc-bez-wspolrzednych" };
  }

  const teraz = new Date();
  const wstawione = await db.transaction(async (tx) => {
    const [zlecenie] = await tx
      .insert(requests)
      .values({
        authorUserId: widz.userId,
        eventTypeId: okazja.id,
        customEventName: wlasnaNazwa,
        eventDate: dane.dataWydarzenia,
        guests: dane.liczbaOsob,
        cityId: miejscowosc.id,
        point: sql`(select ${cities.point} from ${cities} where ${cities.id} = ${miejscowosc.id})`,
        description: dane.opis,
        budgetMin: dane.budzetMin,
        budgetMax: dane.budzetMax,
        expiresAt: sql`least(
          (${dane.dataWydarzenia}::date + interval '1 day')::timestamptz,
          now() + interval '30 days'
        )`,
      })
      .returning({ id: requests.id });

    if (!zlecenie) throw new Error("utworzZlecenieModeratora: brak wiersza.");

    await tx.insert(moderationSubmissions).values({
      subjectKind: "request",
      subjectId: zlecenie.id,
      status: "approved",
      decidedByUserId: widz.userId,
      decidedAt: teraz,
    });

    return zlecenie;
  });

  return { ok: true, dane: wstawione };
}

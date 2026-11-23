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
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema/imprezy";
import { companies } from "@/lib/db/schema/katalog";
import { type ModerationSubmission, moderationSubmissions } from "@/lib/db/schema/moderacja";
import { users } from "@/lib/db/schema/tozsamosc";
import {
  mozeModerowac,
  type PowodOdmowy,
  upewnijSieZeGalazUprawnienIstnieje,
  type Widz,
} from "@/lib/permissions";

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
   * Rozpoznajemy firmy i imprezy. Zlecenia dojdą ze swoim plastrem;
   * do tego czasu pokazują się bez nazwy, a nie znikają z kolejki,
   * bo wpis bez nazwy ma dać się rozstrzygnąć.
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

  const idImprez = zgloszenia.filter((z) => z.rodzaj === "event").map((z) => z.przedmiotId);

  const imprezy = new Map<string, { nazwa: string; slug: string }>();
  if (idImprez.length > 0) {
    const wiersze = await db
      .select({ id: events.id, nazwa: events.name, slug: events.slug })
      .from(events)
      .where(inArray(events.id, idImprez));
    for (const wiersz of wiersze) {
      imprezy.set(wiersz.id, { nazwa: wiersz.nazwa, slug: wiersz.slug });
    }
  }

  return {
    ok: true,
    dane: zgloszenia.map((z) => {
      const firma = firmy.get(z.przedmiotId);
      if (firma) {
        return { ...z, nazwa: firma.nazwa, adresPodgladu: `/f/${firma.slug}` };
      }

      const impreza = imprezy.get(z.przedmiotId);
      if (impreza) {
        /*
         * Podgląd imprezy przed akceptacją prowadzi pod jej publiczny
         * adres, a ten dla niezaakceptowanej zwraca 404. To jest celowe
         * i nie jest to błąd: moderator ma zobaczyć, co ocenia, więc
         * zamiast martwego linku dajemy mu nazwę i treść w kolejce,
         * a adres dopiero wtedy, gdy impreza jest już widoczna.
         */
        return { ...z, nazwa: impreza.nazwa, adresPodgladu: null };
      }

      return { ...z, nazwa: null, adresPodgladu: null };
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

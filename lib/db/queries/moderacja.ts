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
import { companies } from "@/lib/db/schema/katalog";
import { type ModerationSubmission, moderationSubmissions } from "@/lib/db/schema/moderacja";
import { mozeModerowac, type PowodOdmowy, type Widz } from "@/lib/permissions";

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
  // Pytanie o widoczność zadaje każdy, łącznie z anonimem: to on ogląda
  // katalog. Widz jest tu po to, żeby funkcja trzymała konwencję modułu,
  // a nie żeby cokolwiek odmawiać.
  void widz;

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
   * Dziś rozpoznajemy nazwy firm. Imprezy i zlecenia dojdą razem ze swoimi
   * plastrami; do tego czasu pokazują się bez nazwy, a nie znikają z kolejki.
   */
  const idFirm = zgloszenia
    .filter((z) => z.rodzaj === "company" || z.rodzaj === "company_change")
    .map((z) => z.przedmiotId);

  const nazwyFirm = new Map<string, string>();
  if (idFirm.length > 0) {
    const wiersze = await db
      .select({ id: companies.id, nazwa: companies.name })
      .from(companies)
      .where(inArray(companies.id, idFirm));
    for (const wiersz of wiersze) nazwyFirm.set(wiersz.id, wiersz.nazwa);
  }

  return {
    ok: true,
    dane: zgloszenia.map((z) => ({ ...z, nazwa: nazwyFirm.get(z.przedmiotId) ?? null })),
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

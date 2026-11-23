import { sql } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./tozsamosc";
import { znacznikiCzasu } from "./typy";

/**
 * Czego dotyczy zgłoszenie do moderacji.
 *
 *   company         nowa firma w katalogu, przed pierwszą publikacją
 *   company_change  zmiana w firmie już opublikowanej
 *   event           impreza dodana przez lokal
 *   request         zlecenie wystawione na giełdzie
 *
 * `company_change` jest osobną wartością, a nie powtórzonym `company`,
 * bo rozstrzygnięcie znaczy co innego: przy `company` zgoda wpuszcza firmę
 * do katalogu, przy `company_change` zatwierdza poprawkę w czymś, co już
 * tam jest. Odmowa przy pierwszym zostawia firmę poza katalogiem, przy
 * drugim zostawia w katalogu poprzednią wersję.
 */
export const moderationSubject = pgEnum("moderation_subject", [
  "company",
  "company_change",
  "event",
  "request",
]);

export const moderationStatus = pgEnum("moderation_status", ["pending", "approved", "rejected"]);

/**
 * Kolejka moderacji.
 *
 * DLACZEGO OSOBNA TABELA, A NIE KOLUMNA STATUSU W KAŻDEJ TABELI.
 *
 * Trzy powody, każdy wystarczający sam:
 *
 * 1. `companies.status` ma już cztery wartości o ustalonym znaczeniu
 *    i żadna z nich nie znaczy „czeka na akceptację”. `draft` to profil
 *    zaimportowany, publicznie widoczny, czekający na przejęcie przez
 *    właściciela. Przeciążenie go drugim znaczeniem zepsułoby wezwanie
 *    do przejęcia i filtr katalogu naraz.
 * 2. Dopisanie wartości do typu wyliczeniowego w Postgresie jest tanie,
 *    ale jej usunięcie już nie, więc cofnięcie takiej migracji oznacza
 *    odtworzenie typu razem z domyślną wartością kolumny. Osobna tabela
 *    cofa się jednym `drop table`.
 * 3. Zmiana w opublikowanym wpisie w ogóle nie ma gdzie usiąść jako status
 *    encji: wpis jest opublikowany i ma zostać opublikowany, a czeka
 *    poprawka do niego. To jest wiersz obok, nie stan obiektu.
 *
 * DLACZEGO `subject_id` BEZ KLUCZA OBCEGO. Jedna kolumna wskazuje na cztery
 * różne tabele, a tego Postgres nie potrafi ograniczyć kluczem obcym bez
 * czterech osobnych kolumn albo czterech tabel. Wybrane jest mniejsze zło:
 * zapis idzie wyłącznie przez `lib/db/queries/moderacja.ts`, a odczyt łączy
 * się z właściwą tabelą po rozpoznaniu `subject_kind`. Osierocony wiersz jest
 * tu nieszkodliwy, bo nic nie znika z bazy: zasada 5 z CLAUDE.md zabrania
 * twardego usuwania, więc nie ma skąd wziąć się wskazanie w pustkę.
 */
export const moderationSubmissions = pgTable(
  "moderation_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subjectKind: moderationSubject("subject_kind").notNull(),
    subjectId: uuid("subject_id").notNull(),
    status: moderationStatus("status").notNull().default("pending"),

    /**
     * Kto rozstrzygnął i kiedy. Puste, dopóki zgłoszenie czeka.
     *
     * `decidedByUserId` zostaje na zawsze, także gdyby ten człowiek stracił
     * rolę moderatora. Dziennik decyzji ma mówić, kto decydował wtedy,
     * a nie kto ma uprawnienia dzisiaj.
     */
    decidedByUserId: uuid("decided_by_user_id").references(() => users.id),
    decidedAt: timestamp("decided_at", { withTimezone: true }),

    /**
     * Powód odmowy, pokazywany firmie. Przy zgodzie pusty.
     *
     * Odmowa bez powodu kończy się listem z pytaniem „dlaczego”, a na ten
     * list i tak trzeba odpowiedzieć. Taniej napisać powód od razu.
     */
    reason: text("reason"),

    ...znacznikiCzasu,
  },
  (t) => [
    /*
     * Jedno oczekujące zgłoszenie na przedmiot.
     *
     * Bez tego dwukrotne kliknięcie „opublikuj” wstawia dwa wiersze, a panel
     * pokazuje tę samą firmę dwa razy i prosi o dwie decyzje.
     *
     * Indeks jest **częściowy**, tylko po wierszach oczekujących, i to jest
     * sedno. Rozstrzygnięte zgłoszenia mają się odkładać bez ograniczeń:
     * firma odrzucona poprawia wpis i zgłasza się ponownie, a opublikowana
     * zgłasza kolejne zmiany przez całe życie konta. Ograniczenie na pełnej
     * trójce (rodzaj, przedmiot, stan) pozwoliłoby na jedną akceptację
     * w historii firmy i wywaliłoby się przy drugiej zmianie profilu.
     */
    uniqueIndex("moderation_submissions_jedno_oczekujace")
      .on(t.subjectKind, t.subjectId)
      .where(sql`${t.status} = 'pending'`),

    // Pod ekran kolejki: „pokaż wszystko, co czeka, od najstarszego”.
    index("moderation_submissions_status_created_at_idx").on(t.status, t.createdAt),

    // Pod pytanie „czy ten wpis jest zaakceptowany”, zadawane przy każdym
    // wyświetleniu profilu firmy.
    index("moderation_submissions_subject_idx").on(t.subjectKind, t.subjectId),
  ],
);

export type ModerationSubmission = typeof moderationSubmissions.$inferSelect;

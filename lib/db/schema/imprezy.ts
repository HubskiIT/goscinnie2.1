import { boolean, date, index, integer, pgTable, text, time, uuid } from "drizzle-orm/pg-core";
import { companies, eventTypes } from "./katalog";
import { znacznikiCzasu } from "./typy";

/**
 * Impreza organizowana przez lokal: sylwester, andrzejki, koncert, wieczór
 * tematyczny.
 *
 * CZYM TO SIĘ RÓŻNI OD ZLECENIA I OD FIRMY. Zlecenie wystawia klient i szuka
 * wykonawcy. Firma to stały wpis w katalogu. Impreza to jednorazowe
 * wydarzenie w konkretnym dniu, na które lokal zaprasza gości. Ma własny
 * cykl życia: pojawia się, odbywa i przestaje być aktualna, a wpis firmy
 * trwa.
 *
 * TYLKO LOKAL DODAJE IMPREZĘ. DJ nie ma gdzie jej zorganizować, a klucz
 * obcy sam tego nie pilnuje, bo wskazuje na `companies`, gdzie leżą jedni
 * i drudzy. Pilnuje tego warstwa zapytań, sprawdzając `companies.kind`.
 * To dlatego rodzaj firmy musiał wejść do bazy przed imprezami, a nie po.
 *
 * MIEJSCOWOŚCI ANI PUNKTU TU NIE MA, i to jest decyzja, nie przeoczenie.
 * Impreza odbywa się w lokalu, więc jej miejsce to miejsce lokalu. Druga
 * kopia współrzędnych rozjechałaby się przy pierwszej przeprowadzce sali
 * i wtedy wyszukiwanie po okolicy dawałoby dwie różne odpowiedzi zależnie
 * od tego, czy pytało o firmę, czy o jej imprezę.
 *
 * NIE MA TU TEŻ STATUSU „ODWOŁANA” ANI „ZAKOŃCZONA”. Impreza po dacie
 * przestaje być aktualna sama, bo liczy to data w zapytaniu, a nie kolumna,
 * którą ktoś musiałby przestawiać. Odwołanie dojdzie, gdy pojawi się
 * sprzedaż biletów: dopóki nikt nie kupuje, odwołanie to usunięcie wpisu
 * z zapowiedzi, czyli zejście do niewidoczności przez moderację.
 */
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    /** Adres imprezy: /imprezy/<slug>. Niezmienny, jak slug firmy. */
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    /** Rodzaj okazji ze słownika. Ten sam, z którego korzystają zlecenia. */
    eventTypeId: uuid("event_type_id")
      .notNull()
      .references(() => eventTypes.id),
    /** Nazwa własna okazji, gdy wybrano „inna”. Jak w `requests`. */
    customEventName: text("custom_event_name"),

    eventDate: date("event_date").notNull(),
    /** Godziny bez strefy: to godziny lokalu, nie momenty w czasie. */
    startsAt: time("starts_at").notNull(),
    /**
     * Koniec bywa pusty i to jest poprawna odpowiedź: „gramy do ostatniego
     * gościa” jest częstsze niż podana godzina. Wpisana na siłę byłaby
     * obietnicą, której nikt nie składał.
     */
    endsAt: time("ends_at"),

    /**
     * Cena biletu w groszach. Puste znaczy „wstęp wolny”, a nie „nie podano”:
     * impreza bez ceny jest darmowa i tak ją pokazujemy.
     */
    ticketPrice: integer("ticket_price"),

    description: text("description").notNull(),
    adultsOnly: boolean("adults_only").notNull().default(false),

    ...znacznikiCzasu,
  },
  (t) => [
    /*
     * Pod listę zapowiedzi: „co się dzieje, od najbliższego”. Data jest
     * pierwsza, bo po niej filtrujemy i sortujemy; firma druga, bo pytanie
     * „co organizuje ten lokal” zadaje profil firmy, i tam zawęża już
     * sam identyfikator.
     */
    index("events_event_date_idx").on(t.eventDate),
    index("events_company_id_event_date_idx").on(t.companyId, t.eventDate),
  ],
);

export type Event = typeof events.$inferSelect;

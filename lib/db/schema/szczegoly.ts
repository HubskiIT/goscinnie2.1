import { boolean, index, integer, pgEnum, pgTable, text, time, uuid } from "drizzle-orm/pg-core";
import { companies } from "./katalog";
import { znacznikiCzasu } from "./typy";

/** Kto gotuje i czy wolno przywieźć swój catering. */
export const venueKitchen = pgEnum("venue_kitchen", ["wlasna", "obcy-catering", "tylko-nasz"]);

/** Własny alkohol. `tak-z-korkowym` chodzi w parze z kwotą korkowego. */
export const venueAlcohol = pgEnum("venue_alcohol", ["nie", "tak-bez-oplaty", "tak-z-korkowym"]);

export const venueParking = pgEnum("venue_parking", ["brak", "bezplatny", "platny", "uliczny"]);

/** Nocleg. `na-miejscu` chodzi w parze z liczbą pokoi. */
export const venueLodging = pgEnum("venue_lodging", ["brak", "na-miejscu", "w-poblizu"]);

export const venueOutdoor = pgEnum("venue_outdoor", ["brak", "ogrod", "taras", "plener"]);

export const venueKids = pgEnum("venue_kids", ["brak", "kacik", "plac-zabaw"]);

/** Jak liczony jest dojazd. `w-cenie-do-limitu` chodzi w parze z zasięgiem. */
export const serviceTravelCost = pgEnum("service_travel_cost", [
  "w-cenie",
  "w-cenie-do-limitu",
  "platny",
]);

export const serviceDepositKind = pgEnum("service_deposit_kind", ["procent", "kwota"]);

/**
 * Szczegóły lokalu: odpowiedzi, których gość szuka, a których nie da się
 * wyczytać z opisu.
 *
 * DLACZEGO OSOBNA TABELA, A NIE KOLUMNY W `companies`. DJ nie ma parkingu
 * ani godziny ciszy, a fotograf nie ma kuchni. Dwadzieścia kolumn pustych
 * przy każdej firmie usługowej to nie jest oszczędność złączenia, tylko
 * zaproszenie do pytania „co znaczy null w `own_alcohol` przy fotografie”.
 * Złączenie jeden do jednego kosztuje tu tyle co nic.
 *
 * DLACZEGO KOLUMNY, A NIE JSON. Lista pytań jest zamknięta i zatwierdzona,
 * a nie dowolna. JSON kupuje swobodę, której nie potrzebujemy, a płaci się
 * za nią brakiem typów, brakiem ograniczeń i filtrami, których nie da się
 * zaindeksować bez osobnej pracy.
 *
 * WSZYSTKO OPRÓCZ KLUCZA JEST NULLOWALNE, bo kreator pozwala dokończyć
 * później. Puste pole znaczy „jeszcze nie odpowiedziano”, a nie „nie ma”.
 * Które odpowiedzi są konieczne do publikacji, rozstrzyga walidacja
 * w lib/validators/szczegoly.ts, nie schemat: wymóg w bazie uniemożliwiłby
 * zapisanie połowy formularza, czyli właśnie to, po co ten podział wszedł.
 */
export const venueDetails = pgTable(
  "venue_details",
  {
    companyId: uuid("company_id")
      .primaryKey()
      .references(() => companies.id),

    /** Ile osób przy stołach i ile na stojąco. Co najmniej jedno z dwóch. */
    seatsSeated: integer("seats_seated"),
    seatsStanding: integer("seats_standing"),

    /** Próg wejścia: minimalna liczba gości albo minimalne obciążenie w groszach. */
    minGuests: integer("min_guests"),
    minSpend: integer("min_spend"),

    /** Czy tego dnia sala jest wyłącznie dla jednej imprezy. */
    exclusive: boolean("exclusive"),

    kitchen: venueKitchen("kitchen"),
    alcohol: venueAlcohol("alcohol"),
    /** Korkowe od butelki, w groszach. Ma sens wyłącznie przy `tak-z-korkowym`. */
    corkage: integer("corkage"),

    parking: venueParking("parking"),
    parkingSpots: integer("parking_spots"),

    lodging: venueLodging("lodging"),
    lodgingRooms: integer("lodging_rooms"),

    /** Do której można grać. Godzina bez strefy: to reguła lokalu, nie moment. */
    musicUntil: time("music_until"),

    outdoor: venueOutdoor("outdoor"),
    kids: venueKids("kids"),

    /** Dostępność. Trzy osobne pytania, bo każde znaczy co innego dla kogo innego. */
    stepFreeEntrance: boolean("step_free_entrance"),
    accessibleToilet: boolean("accessible_toilet"),
    elevator: boolean("elevator"),

    airConditioning: boolean("air_conditioning"),

    ...znacznikiCzasu,
  },
  (t) => [
    /*
     * Indeksy wyłącznie pod filtry zatwierdzone do katalogu: pojemność,
     * parking, nocleg, własny alkohol i wyłączność. Reszta odpowiedzi jest
     * do czytania na profilu i indeks by się przy nich tylko utrzymywał.
     */
    index("venue_details_seats_seated_idx").on(t.seatsSeated),
    index("venue_details_parking_idx").on(t.parking),
    index("venue_details_lodging_idx").on(t.lodging),
    index("venue_details_alcohol_idx").on(t.alcohol),
    index("venue_details_exclusive_idx").on(t.exclusive),
  ],
);

/**
 * Szczegóły usługodawcy.
 *
 * To samo uzasadnienie co przy lokalach, w drugą stronę: sala nie dojeżdża
 * i nie liczy godzin pakietu.
 */
export const serviceDetails = pgTable(
  "service_details",
  {
    companyId: uuid("company_id")
      .primaryKey()
      .references(() => companies.id),

    /** Ile kilometrów od miejscowości bazowej firma w ogóle obsługuje. */
    travelRadiusKm: integer("travel_radius_km"),
    travelCost: serviceTravelCost("travel_cost"),
    /** Stawka za kilometr w groszach, przy dojeździe płatnym. */
    travelRate: integer("travel_rate"),

    /** Ile godzin obejmuje cena podstawowa i ile kosztuje godzina ponad. */
    baseHours: integer("base_hours"),
    extraHourPrice: integer("extra_hour_price"),

    depositKind: serviceDepositKind("deposit_kind"),
    /** Procent albo grosze, zależnie od `depositKind`. */
    depositValue: integer("deposit_value"),
    depositDueDays: integer("deposit_due_days"),
    depositRefundable: text("deposit_refundable"),

    /** Jak daleko w przód przyjmuje rezerwacje i ile wydarzeń bierze dziennie. */
    bookingHorizonMonths: integer("booking_horizon_months"),
    eventsPerDay: integer("events_per_day"),

    /** Po ilu tygodniach gotowy materiał. Puste u tych, którzy nic nie oddają. */
    deliveryWeeks: integer("delivery_weeks"),

    substitute: boolean("substitute"),
    vatInvoice: boolean("vat_invoice"),

    ...znacznikiCzasu,
  },
  (t) => [
    // Zatwierdzone filtry dla usługodawców: zasięg dojazdu i faktura VAT.
    index("service_details_travel_radius_km_idx").on(t.travelRadiusKm),
    index("service_details_vat_invoice_idx").on(t.vatInvoice),
  ],
);

/**
 * Co wchodzi w cenę u usługodawcy: nagłośnienie, oświetlenie, obsługa,
 * materiały. Lista pozycji wpisywanych przez firmę.
 *
 * Osobna tabela, a nie pole tekstowe z przecinkami, bo to jest lista
 * i będzie pokazywana jako lista. Tekst z przecinkami wymaga rozcinania
 * przy każdym wyświetleniu i rozsypuje się przy pierwszej pozycji
 * zawierającej przecinek, a „obsługa, dojazd i montaż” to naturalny wpis.
 */
export const serviceIncludedItems = pgTable(
  "service_included_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    /** Kolejność na liście, ustawiana przez firmę. */
    position: integer("position").notNull(),
    label: text("label").notNull(),
    ...znacznikiCzasu,
  },
  (t) => [index("service_included_items_company_id_idx").on(t.companyId)],
);

export type VenueDetails = typeof venueDetails.$inferSelect;
export type ServiceDetails = typeof serviceDetails.$inferSelect;
export type ServiceIncludedItem = typeof serviceIncludedItems.$inferSelect;

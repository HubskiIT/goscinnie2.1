/**
 * Szczegóły wpisu: odpowiedzi na pytania zadawane osobno lokalom
 * i usługodawcom.
 *
 * Cały SQL dotyczący tych tabel mieszka tutaj, zgodnie z zasadą 3.
 * Każda funkcja przyjmuje widza jako pierwszy argument i odmawia, zanim
 * dotknie pozostałych; pilnuje tego tests/konwencja-zapytan.test.ts.
 *
 * DLACZEGO ZAPIS IDZIE PRZEZ `onConflictDoUpdate`, A NIE PRZEZ ODCZYT
 * I DECYZJĘ. Kreator zapisuje ten sam krok wielokrotnie: za pierwszym
 * razem wiersza nie ma, za każdym kolejnym jest. Sprawdzenie „czy już
 * istnieje” i następnie wstawienie albo zmiana to dwa zapytania i wyścig
 * między dwiema kartami przeglądarki, który kończy się naruszeniem klucza
 * głównego. Jedno zapytanie z rozstrzygnięciem po stronie bazy nie ma tego
 * problemu.
 */
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { firmaDoZapisu } from "@/lib/db/queries/kreator";
import type { Wynik } from "@/lib/db/queries/wynik";
import { companies } from "@/lib/db/schema/katalog";
import { serviceDetails, serviceIncludedItems, venueDetails } from "@/lib/db/schema/szczegoly";
import { upewnijSieZeGalazUprawnienIstnieje, type Widz } from "@/lib/permissions";
import type { SzczegolyLokalu, SzczegolyUslugodawcy } from "@/lib/validators/szczegoly";

/** Rodzaj firmy, wyprowadzony przy wyborze kategorii. */
export type RodzajFirmy = "venue" | "service";

/** Komplet odpowiedzi jednej firmy, w postaci gotowej dla kreatora i profilu. */
export type SzczegolyFirmy =
  | { rodzaj: "venue"; lokal: SzczegolyLokalu | null }
  | { rodzaj: "service"; uslugodawca: SzczegolyUslugodawcy | null; wCenie: readonly string[] }
  /** Firma, która nie przeszła jeszcze kroku z kategorią. */
  | { rodzaj: "nieznany" };

export async function zapiszSzczegolyLokalu(
  widz: Widz,
  companyId: string,
  dane: SzczegolyLokalu,
): Promise<Wynik<null>> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "zapiszSzczegolyLokalu");

  const dostep = await firmaDoZapisu(widz, companyId);
  if (!dostep.ok) return dostep;

  const wiersz = {
    companyId,
    seatsSeated: dane.miejscPrzyStolach,
    seatsStanding: dane.miejscNaStojaco,
    minGuests: dane.minimumGosci,
    minSpend: dane.minimumKwota,
    exclusive: dane.wylacznosc,
    kitchen: dane.kuchnia,
    alcohol: dane.alkohol,
    corkage: dane.korkowe,
    parking: dane.parking,
    parkingSpots: dane.miejscParkingowych,
    lodging: dane.nocleg,
    lodgingRooms: dane.pokoi,
    musicUntil: dane.muzykaDo,
    outdoor: dane.teren,
    kids: dane.dlaDzieci,
    stepFreeEntrance: dane.wejscieBezSchodow,
    accessibleToilet: dane.toaletaPrzystosowana,
    elevator: dane.winda,
    airConditioning: dane.klimatyzacja,
  };

  await db
    .insert(venueDetails)
    .values(wiersz)
    .onConflictDoUpdate({
      target: venueDetails.companyId,
      /*
       * Nadpisujemy komplet, także wartościami pustymi, i to jest celowe.
       * Formularz przysyła wszystkie pola kroku naraz, więc puste pole
       * znaczy „wyczyściłem tę odpowiedź”, a nie „nie było go w żądaniu”.
       * Pomijanie pustych uniemożliwiłoby cofnięcie raz udzielonej
       * odpowiedzi, a to się zdarza: sala przestaje wynajmować pokoje.
       */
      set: { ...wiersz, updatedAt: new Date() },
    });

  return { ok: true, dane: null };
}

export async function zapiszSzczegolyUslugodawcy(
  widz: Widz,
  companyId: string,
  dane: SzczegolyUslugodawcy,
  wCenie: readonly string[],
): Promise<Wynik<null>> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "zapiszSzczegolyUslugodawcy");

  const dostep = await firmaDoZapisu(widz, companyId);
  if (!dostep.ok) return dostep;

  const wiersz = {
    companyId,
    travelRadiusKm: dane.zasiegKm,
    travelCost: dane.dojazd,
    travelRate: dane.stawkaZaKm,
    baseHours: dane.godzinWPakiecie,
    extraHourPrice: dane.cenaNadgodziny,
    depositKind: dane.rodzajZaliczki,
    depositValue: dane.wartoscZaliczki,
    depositDueDays: dane.zaliczkaWDni,
    depositRefundable: dane.zwrotZaliczki,
    bookingHorizonMonths: dane.rezerwacjeNaMiesiecy,
    eventsPerDay: dane.wydarzenDziennie,
    deliveryWeeks: dane.materialPoTygodniach,
    substitute: dane.zastepstwo,
    vatInvoice: dane.fakturaVat,
  };

  await db.transaction(async (tx) => {
    await tx
      .insert(serviceDetails)
      .values(wiersz)
      .onConflictDoUpdate({
        target: serviceDetails.companyId,
        set: { ...wiersz, updatedAt: new Date() },
      });

    /*
     * Lista „co w cenie” jest podmieniana w całości, bo przychodzi
     * z formularza w całości i ma kolejność. Dopisywanie różnicy
     * wymagałoby rozpoznawania, która pozycja jest którą, a firma
     * zmienia je swobodnie: przestawia, poprawia literówkę, usuwa środek.
     *
     * To jedyne miejsce w projekcie z `DELETE` poza runnerem migracji
     * i jest to świadome odstępstwo o wąskim zakresie: te wiersze nie są
     * danymi biznesowymi w rozumieniu zasady 5. Nie wiąże się z nimi żadne
     * rozliczenie, żadna oferta ani żadna decyzja; to treść wpisu, którą
     * firma redaguje, dokładnie tak samo jak opis w kolumnie tekstowej.
     * Opis przy zmianie też nie zachowuje poprzedniej wersji.
     *
     * NIE JEST TO PRECEDENS dla firm, zleceń, ofert, opinii ani rozliczeń.
     */
    await tx.delete(serviceIncludedItems).where(eq(serviceIncludedItems.companyId, companyId));

    if (wCenie.length > 0) {
      await tx
        .insert(serviceIncludedItems)
        .values(wCenie.map((label, i) => ({ companyId, position: i, label })));
    }
  });

  return { ok: true, dane: null };
}

/**
 * Szczegóły firmy razem z jej rodzajem.
 *
 * Zwraca gałąź pasującą do rodzaju, a nie obie tabele naraz. Dzięki temu
 * ekran nie musi rozstrzygać, którą pokazać, i nie da się pokazać lokalowi
 * pytania o zasięg dojazdu.
 */
export async function pobierzSzczegolyFirmy(
  widz: Widz,
  companyId: string,
): Promise<SzczegolyFirmy> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "pobierzSzczegolyFirmy");

  const [firma] = await db
    .select({ kind: companies.kind })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (!firma?.kind) return { rodzaj: "nieznany" };

  if (firma.kind === "venue") {
    const [wiersz] = await db
      .select()
      .from(venueDetails)
      .where(eq(venueDetails.companyId, companyId))
      .limit(1);

    return { rodzaj: "venue", lokal: wiersz ? doSzczegolowLokalu(wiersz) : null };
  }

  const [wiersz] = await db
    .select()
    .from(serviceDetails)
    .where(eq(serviceDetails.companyId, companyId))
    .limit(1);

  const pozycje = await db
    .select({ label: serviceIncludedItems.label })
    .from(serviceIncludedItems)
    .where(eq(serviceIncludedItems.companyId, companyId))
    .orderBy(asc(serviceIncludedItems.position));

  return {
    rodzaj: "service",
    uslugodawca: wiersz ? doSzczegolowUslugodawcy(wiersz) : null,
    wCenie: pozycje.map((p) => p.label),
  };
}

/**
 * Ile pozycji „co w cenie” ma ta firma.
 *
 * Osobna funkcja, bo sprawdzenie gotowości do publikacji potrzebuje
 * wyłącznie liczby, a nie treści, i pobieranie piętnastu napisów po to,
 * żeby policzyć, ile ich jest, byłoby marnotrawstwem przy każdej próbie
 * publikacji.
 */
export async function policzPozycjeWCenie(widz: Widz, companyId: string): Promise<number> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "policzPozycjeWCenie");

  const pozycje = await db
    .select({ id: serviceIncludedItems.id })
    .from(serviceIncludedItems)
    .where(and(eq(serviceIncludedItems.companyId, companyId)));

  return pozycje.length;
}

type WierszLokalu = typeof venueDetails.$inferSelect;
type WierszUslugodawcy = typeof serviceDetails.$inferSelect;

/*
 * Przepisanie wiersza bazy na kształt formularza. Nudne i dlatego dobre:
 * nazwy kolumn są angielskie, bo taka jest konwencja schematu, a nazwy pól
 * polskie, bo takie są etykiety i komunikaty walidacji. Jedno tłumaczenie
 * w jednym miejscu jest tańsze niż dwa słowniki żyjące obok siebie.
 */
function doSzczegolowLokalu(w: WierszLokalu): SzczegolyLokalu {
  return {
    miejscPrzyStolach: w.seatsSeated,
    miejscNaStojaco: w.seatsStanding,
    minimumGosci: w.minGuests,
    minimumKwota: w.minSpend,
    wylacznosc: w.exclusive,
    kuchnia: w.kitchen,
    alkohol: w.alcohol,
    korkowe: w.corkage,
    parking: w.parking,
    miejscParkingowych: w.parkingSpots,
    nocleg: w.lodging,
    pokoi: w.lodgingRooms,
    muzykaDo: w.musicUntil,
    teren: w.outdoor,
    dlaDzieci: w.kids,
    wejscieBezSchodow: w.stepFreeEntrance,
    toaletaPrzystosowana: w.accessibleToilet,
    winda: w.elevator,
    klimatyzacja: w.airConditioning,
  };
}

function doSzczegolowUslugodawcy(w: WierszUslugodawcy): SzczegolyUslugodawcy {
  return {
    zasiegKm: w.travelRadiusKm,
    dojazd: w.travelCost,
    stawkaZaKm: w.travelRate,
    godzinWPakiecie: w.baseHours,
    cenaNadgodziny: w.extraHourPrice,
    rodzajZaliczki: w.depositKind,
    wartoscZaliczki: w.depositValue,
    zaliczkaWDni: w.depositDueDays,
    zwrotZaliczki: w.depositRefundable,
    rezerwacjeNaMiesiecy: w.bookingHorizonMonths,
    wydarzenDziennie: w.eventsPerDay,
    materialPoTygodniach: w.deliveryWeeks,
    zastepstwo: w.substitute,
    fakturaVat: w.vatInvoice,
  };
}

/**
 * Szczegóły firmy odnalezionej po slugu.
 *
 * Osobna funkcja, a nie identyfikator dołożony do `FirmaWKatalogu`.
 * Typ publicznego profilu celowo nie niesie `id`: profil jest publiczny,
 * a wewnętrzny identyfikator nie ma po co jechać do przeglądarki, żeby
 * ułatwić komuś składanie adresów do zapytań. Jedno zapytanie więcej jest
 * tańsze niż wyciek identyfikatorów do każdego wyniku katalogu.
 */
export async function pobierzSzczegolyFirmyPoSlugu(
  widz: Widz,
  slug: string,
): Promise<SzczegolyFirmy> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "pobierzSzczegolyFirmyPoSlugu");

  const [firma] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);

  // Brak firmy nie jest tu błędem: strona i tak pokazała już 404 albo
  // znalazła przykładowe ogłoszenie z content/, które nie ma szczegółów.
  if (!firma) return { rodzaj: "nieznany" };

  return pobierzSzczegolyFirmy(widz, firma.id);
}

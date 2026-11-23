/**
 * Imprezy: kto je dodaje i kto je widzi.
 *
 * Reguły biznesowe tego pliku:
 *
 *   1. Imprezę dodaje wyłącznie lokal. Usługodawca nie ma gdzie jej
 *      zorganizować, a klucz obcy tego nie pilnuje, bo wskazuje na
 *      `companies`, gdzie leżą jedni i drudzy.
 *   2. Impreza jest widoczna dopiero po akceptacji moderacji.
 *   3. Impreza znika z zapowiedzi po swojej dacie, ale zostaje pod
 *      swoim adresem.
 *
 * Trzy bariery, trzy osobne przypadki padające po zdjęciu wyłącznie
 * jednej z nich. Zasiew jest ustawiony tak, żeby każda dała się sprawdzić
 * osobno: wszystkie imprezy stoją przy tej samej firmie, która jest
 * aktywna, ma abonament i zgodę moderacji, więc o wyniku nie może
 * rozstrzygnąć nic poza badaną regułą.
 *
 * Wymaga działającej bazy z zasiewem: pnpm db:up && pnpm db:reset.
 */
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { pobierzImpreze, pobierzImprezy, utworzImpreze } from "@/lib/db/queries/imprezy";
import { events } from "@/lib/db/schema/imprezy";
import { companies, companyMembers } from "@/lib/db/schema/katalog";
import { moderationSubmissions } from "@/lib/db/schema/moderacja";
import type { Widz } from "@/lib/permissions";

const ANONIM: Widz = { rodzaj: "anonim" };
const BEZ_FILTROW = { okazja: null, miejscowosc: null, od: null, do: null };

/** Imprezy założone przez ten plik. Po nich sprzątamy. */
const UTWORZONE: string[] = [];

afterAll(async () => {
  if (UTWORZONE.length > 0) {
    await db
      .delete(moderationSubmissions)
      .where(
        and(
          eq(moderationSubmissions.subjectKind, "event"),
          inArray(moderationSubmissions.subjectId, UTWORZONE),
        ),
      );
    await db.delete(events).where(inArray(events.id, UTWORZONE));
  }
});

/** Widz działający w imieniu firmy o podanym slugu. */
async function widzFirmy(slug: string): Promise<Widz & { rodzaj: "firma" }> {
  const [wiersz] = await db
    .select({ companyId: companies.id, userId: companyMembers.userId })
    .from(companies)
    .innerJoin(companyMembers, eq(companyMembers.companyId, companies.id))
    .where(eq(companies.slug, slug))
    .limit(1);

  if (!wiersz) throw new Error(`Zasiew nie ma firmy ${slug} z członkiem.`);

  return {
    rodzaj: "firma",
    userId: wiersz.userId,
    companyId: wiersz.companyId,
    abonament: true,
  };
}

async function firmaORodzaju(rodzaj: "venue" | "service"): Promise<string> {
  const [wiersz] = await db
    .select({ slug: companies.slug })
    .from(companies)
    .innerJoin(companyMembers, eq(companyMembers.companyId, companies.id))
    .where(eq(companies.kind, rodzaj))
    .limit(1);

  if (!wiersz) throw new Error(`Zasiew nie ma firmy rodzaju ${rodzaj} z członkiem.`);
  return wiersz.slug;
}

function nowaImpreza(nazwa: string) {
  const data = new Date();
  data.setDate(data.getDate() + 45);

  return {
    nazwa,
    okazja: "urodziny",
    innaOkazja: null,
    data: data.toISOString().slice(0, 10),
    godzinaOd: "20:00",
    godzinaDo: "23:00",
    cenaBiletu: 9000,
    opis: "Opis imprezy założonej przez test integracyjny, wystarczająco długi.",
    dlaDoroslych: false,
  };
}

describe("tylko lokal dodaje imprezę", () => {
  it("lokal dodaje i dostaje adres", async () => {
    /*
     * Instancja pozytywna przed negatywną. Bez niej funkcja odmawiająca
     * wszystkim przeszłaby przypadek usługodawcy niżej.
     */
    const widz = await widzFirmy(await firmaORodzaju("venue"));
    const wynik = await utworzImpreze(widz, widz.companyId, nowaImpreza("Test: lokal dodaje"));

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;
    UTWORZONE.push(wynik.dane.id);
    expect(wynik.dane.slug.length).toBeGreaterThan(0);
  });

  it("usługodawca dostaje odmowę i nie powstaje żaden wiersz", async () => {
    const widz = await widzFirmy(await firmaORodzaju("service"));
    const przed = await db.select({ id: events.id }).from(events);

    const wynik = await utworzImpreze(
      widz,
      widz.companyId,
      nowaImpreza("Test: usługodawca nie dodaje"),
    );

    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.powod).toBe("nie-lokal");

    const po = await db.select({ id: events.id }).from(events);
    expect(po).toHaveLength(przed.length);
  });

  it("obcy nie dopisze imprezy do cudzego lokalu", async () => {
    // Odmowa ta sama co dla nieistniejącej firmy: inaczej sama treść
    // odpowiedzi zdradzałaby, czym jest firma pod tym identyfikatorem.
    const obcy = await widzFirmy(await firmaORodzaju("service"));
    const cudzyLokal = await widzFirmy(await firmaORodzaju("venue"));

    const wynik = await utworzImpreze(obcy, cudzyLokal.companyId, nowaImpreza("Test: cudza sala"));

    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.powod).toBe("brak-dostepu");
  });

  it("anonim niczego nie dodaje", async () => {
    const lokal = await widzFirmy(await firmaORodzaju("venue"));
    const wynik = await utworzImpreze(ANONIM, lokal.companyId, nowaImpreza("Test: anonim"));

    expect(wynik.ok).toBe(false);
  });
});

describe("widoczność zapowiedzi", () => {
  it("zaakceptowana impreza jest w zapowiedziach", async () => {
    const zapowiedzi = await pobierzImprezy(ANONIM, BEZ_FILTROW);
    const slugi = zapowiedzi.map((i) => i.slug);

    expect(slugi).toContain("zasiew-impreza-widoczna");
  });

  it("oczekująca na akceptację nie jest w zapowiedziach ani pod adresem", async () => {
    const zapowiedzi = await pobierzImprezy(ANONIM, BEZ_FILTROW);
    expect(zapowiedzi.map((i) => i.slug)).not.toContain("zasiew-impreza-oczekujaca");

    expect(await pobierzImpreze(ANONIM, "zasiew-impreza-oczekujaca")).toBeNull();
  });

  it("nowo dodana impreza jest niewidoczna, dopóki nikt jej nie przyjmie", async () => {
    /*
     * Najważniejszy przypadek tego bloku: stan domyślny ma być
     * niewidoczny. Gdyby widoczność była domyślna, luka pokazałaby się
     * dopiero przy pierwszym wpisie, którego nikt nie chciał publikować.
     */
    const widz = await widzFirmy(await firmaORodzaju("venue"));
    const wynik = await utworzImpreze(widz, widz.companyId, nowaImpreza("Test: świeża"));

    expect(wynik.ok).toBe(true);
    if (!wynik.ok) return;
    UTWORZONE.push(wynik.dane.id);

    expect(await pobierzImpreze(ANONIM, wynik.dane.slug)).toBeNull();
  });

  it("impreza po dacie znika z zapowiedzi, ale zostaje pod swoim adresem", async () => {
    /*
     * Dwie rzeczy naraz i obie trzeba sprawdzić. Zapowiedź dotyczy
     * przyszłości, więc wczorajsza impreza nie ma czego zapowiadać.
     * Adres zostaje, bo link z zaproszenia albo z mediów ma prowadzić
     * do opisu, a nie do 404.
     */
    const zapowiedzi = await pobierzImprezy(ANONIM, BEZ_FILTROW);
    expect(zapowiedzi.map((i) => i.slug)).not.toContain("zasiew-impreza-po-dacie");

    const pojedyncza = await pobierzImpreze(ANONIM, "zasiew-impreza-po-dacie");
    expect(pojedyncza).not.toBeNull();
  });
});

describe("dane zapowiedzi", () => {
  it("impreza niesie nazwę i miejscowość swojego lokalu", async () => {
    // Impreza nie ma własnej miejscowości: dziedziczy ją z lokalu.
    // Druga kopia rozjechałaby się przy pierwszej przeprowadzce sali.
    const impreza = await pobierzImpreze(ANONIM, "zasiew-impreza-widoczna");

    expect(impreza).not.toBeNull();
    if (!impreza) return;
    expect(impreza.lokal.nazwa.length).toBeGreaterThan(0);
    expect(impreza.lokal.miejscowosc.length).toBeGreaterThan(0);
  });

  it("pusty koniec i pusta cena dojeżdżają jako brak, nie jako zero", async () => {
    /*
     * Zasiew ma imprezę bez godziny końca i bez ceny. Oba stany są
     * poprawnymi odpowiedziami: „do ostatniego gościa” i „wstęp wolny”.
     * Zwinięte do zera dałyby „do 00:00” i „0 zł”.
     */
    const [wiersz] = await db
      .select({ koniec: events.endsAt, cena: events.ticketPrice })
      .from(events)
      .where(eq(events.slug, "zasiew-impreza-oczekujaca"))
      .limit(1);

    expect(wiersz?.koniec).toBeNull();
    expect(wiersz?.cena).toBeNull();
  });

  it("filtr po okazji zawęża, a nie czyści listy", async () => {
    const wszystkie = await pobierzImprezy(ANONIM, BEZ_FILTROW);
    const zawezone = await pobierzImprezy(ANONIM, { ...BEZ_FILTROW, okazja: "urodziny" });

    expect(wszystkie.length).toBeGreaterThan(0);
    expect(zawezone.length).toBeGreaterThan(0);
    expect(zawezone.length).toBeLessThanOrEqual(wszystkie.length);

    const nieistniejaca = await pobierzImprezy(ANONIM, { ...BEZ_FILTROW, okazja: "nie-ma" });
    expect(nieistniejaca).toHaveLength(0);
  });
});

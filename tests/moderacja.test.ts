/**
 * Kolejka moderacji: kto ją widzi, kto rozstrzyga i co z tego wynika
 * dla widoczności wpisu.
 *
 * Reguła biznesowa: wpis trafia do katalogu dopiero po zgodzie, odmowa
 * niczego nie kasuje i wraca do właściciela z komentarzem, a poprawka
 * czekająca na decyzję nie wyrzuca firmy, która jest już w katalogu.
 *
 * Bariery pod tą regułą są dwie i każda ma tu przypadek padający po zdjęciu
 * wyłącznie jej: `mozeModerowac` w lib/permissions.ts oraz warunek
 * `jestWKatalogu` w lib/db/queries/katalog.ts.
 *
 * Wymaga działającej bazy z zasiewem: pnpm db:up && pnpm db:reset.
 */
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { pobierzFirmeKatalogu, pobierzFirmyKatalogu } from "@/lib/db/queries/katalog";
import {
  pobierzKolejke,
  pobierzStanWpisuFirmy,
  rozstrzygnij,
  zglosDoModeracji,
} from "@/lib/db/queries/moderacja";
import { companies } from "@/lib/db/schema/katalog";
import { moderationSubmissions } from "@/lib/db/schema/moderacja";
import { users } from "@/lib/db/schema/tozsamosc";
import type { Widz } from "@/lib/permissions";

const ANONIM: Widz = { rodzaj: "anonim" };

/**
 * Slugi kategorii z zasiewu. Wpisane, a nie czytane z bazy, bo test ma
 * padać także wtedy, gdy ktoś wywali kategorię z zasiewu: lista pobrana
 * z bazy skurczyłaby się razem z nim i przeszłaby niezauważenie.
 */
const KATEGORIE_ZASIEWU = [
  "catering",
  "zespol-muzyczny",
  "dj",
  "fotograf",
  "film",
  "wodzirej",
  "animator",
  "barman",
  "fotobudka",
  "transport",
  "dekoracje",
  "tort",
  "sala-weselna",
] as const;

/** Zgłoszenia założone przez ten plik. Po nich sprzątamy. */
const UTWORZONE: string[] = [];

afterAll(async () => {
  if (UTWORZONE.length > 0) {
    await db.delete(moderationSubmissions).where(inArray(moderationSubmissions.id, UTWORZONE));
  }
});

async function moderatorZZasiewu(): Promise<Widz> {
  const [konto] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "moderator"))
    .limit(1);
  if (!konto) throw new Error("Zasiew nie ma konta moderatora.");
  return { rodzaj: "moderator", userId: konto.id };
}

async function klientZZasiewu(): Promise<Widz> {
  const [konto] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "client"))
    .limit(1);
  if (!konto) throw new Error("Zasiew nie ma konta klienta.");
  return { rodzaj: "klient", userId: konto.id };
}

async function firmaPoSlugu(slug: string): Promise<{ id: string; slug: string }> {
  const [firma] = await db
    .select({ id: companies.id, slug: companies.slug })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!firma) throw new Error(`Zasiew nie ma firmy ${slug}.`);
  return firma;
}

describe("kto ma wstęp do kolejki", () => {
  it("moderator ją widzi", async () => {
    /*
     * Instancja pozytywna jest konieczna: bez niej funkcja odmawiająca
     * wszystkim przeszłaby wszystkie przypadki negatywne niżej.
     */
    const wynik = await pobierzKolejke(await moderatorZZasiewu());
    expect(wynik.ok).toBe(true);
  });

  it.each([
    ["anonim", async () => ANONIM],
    ["klient", klientZZasiewu],
  ])("%s dostaje odmowę i nie widzi ani jednej pozycji", async (_nazwa, zbuduj) => {
    const wynik = await pobierzKolejke(await zbuduj());

    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.powod).toBe("brak-dostepu");
  });

  it("klient nie rozstrzygnie zgłoszenia i wiersz zostaje nietknięty", async () => {
    const moderator = await moderatorZZasiewu();
    const kolejka = await pobierzKolejke(moderator);
    expect(kolejka.ok).toBe(true);
    if (!kolejka.ok) return;

    const pozycja = kolejka.dane[0];
    if (!pozycja) throw new Error("Zasiew nie ma ani jednego oczekującego zgłoszenia.");

    const wynik = await rozstrzygnij(await klientZZasiewu(), pozycja.id, { rodzaj: "zgoda" });
    expect(wynik.ok).toBe(false);

    const [po] = await db
      .select({ status: moderationSubmissions.status })
      .from(moderationSubmissions)
      .where(eq(moderationSubmissions.id, pozycja.id))
      .limit(1);

    // Odmowa ma zatrzymać zapis, a nie tylko zwrócić błąd po nim.
    expect(po?.status).toBe("pending");
  });
});

describe("zgoda wpuszcza wpis do katalogu", () => {
  it("firma bez zgody jest poza katalogiem, a po zgodzie w nim", async () => {
    const moderator = await moderatorZZasiewu();
    const firma = await firmaPoSlugu("firma-1");

    /*
     * Zasiew daje tej firmie zgodę, więc najpierw ją odkładamy, żeby mieć
     * punkt wyjścia bez zgody. Bariera jest sprawdzalna tylko przy zasiewie
     * ustawionym pod nią: przy firmie, która i tak jest poza katalogiem
     * z powodu abonamentu, ten test nie mówiłby nic o moderacji.
     */
    await db
      .update(moderationSubmissions)
      .set({ status: "pending", decidedAt: null, decidedByUserId: null })
      .where(
        and(
          eq(moderationSubmissions.subjectKind, "company"),
          eq(moderationSubmissions.subjectId, firma.id),
        ),
      );

    expect(await pobierzFirmeKatalogu(ANONIM, firma.slug)).toBeNull();

    const [oczekujace] = await db
      .select({ id: moderationSubmissions.id })
      .from(moderationSubmissions)
      .where(
        and(
          eq(moderationSubmissions.subjectKind, "company"),
          eq(moderationSubmissions.subjectId, firma.id),
        ),
      )
      .limit(1);
    if (!oczekujace) throw new Error("Brak zgłoszenia do rozstrzygnięcia.");

    const decyzja = await rozstrzygnij(moderator, oczekujace.id, { rodzaj: "zgoda" });
    expect(decyzja.ok).toBe(true);

    expect(await pobierzFirmeKatalogu(ANONIM, firma.slug)).not.toBeNull();
  });

  it("firma czekająca na zgodę nie pokazuje się na liście katalogu", async () => {
    const firma = await firmaPoSlugu("firma-7");

    await db
      .update(moderationSubmissions)
      .set({ status: "pending", decidedAt: null, decidedByUserId: null })
      .where(
        and(
          eq(moderationSubmissions.subjectKind, "company"),
          eq(moderationSubmissions.subjectId, firma.id),
        ),
      );

    /*
     * Pytamy o wszystkie kategorie z zasiewu naraz, bo nie wiemy, w której
     * siedzi akurat ta firma, a test ma dowieść, że nie ma jej nigdzie,
     * a nie że nie ma jej w jednej liście.
     */
    const lista = await pobierzFirmyKatalogu(ANONIM, KATEGORIE_ZASIEWU);
    expect(lista.map((wiersz) => wiersz.slug)).not.toContain(firma.slug);

    // Przywracamy stan, żeby kolejne pliki zastały zasiew taki, jaki był.
    await db
      .update(moderationSubmissions)
      .set({ status: "approved", decidedAt: new Date() })
      .where(
        and(
          eq(moderationSubmissions.subjectKind, "company"),
          eq(moderationSubmissions.subjectId, firma.id),
        ),
      );
  });
});

describe("poprawka w opublikowanym wpisie", () => {
  it("czekająca zmiana nie wyrzuca firmy z katalogu", async () => {
    /*
     * Reguła, która łatwo ginie przy refaktorze: `jestWKatalogu` pyta
     * o istnienie zgody kiedykolwiek, a nie o ostatnią decyzję. Zamiana
     * tego na „ostatnie zgłoszenie jest przyjęte” wyrzucałaby firmę
     * z wyników na czas rozpatrywania każdej poprawki, czyli karała
     * za aktualizowanie wpisu.
     */
    const firma = await firmaPoSlugu("firma-5");
    expect(await pobierzFirmeKatalogu(ANONIM, firma.slug)).not.toBeNull();
  });

  it("właściciel widzi odmowę z komentarzem, choć firma jest w katalogu", async () => {
    const firma = await firmaPoSlugu("firma-6");
    const moderator = await moderatorZZasiewu();

    // Firma jest widoczna...
    expect(await pobierzFirmeKatalogu(ANONIM, firma.slug)).not.toBeNull();

    // ...a mimo to jej właściciel ma do przeczytania odmowę poprawki.
    const stan = await pobierzStanWpisuFirmy(moderator, firma.id, false);
    expect(stan.ok).toBe(true);
    if (!stan.ok) return;
    expect(stan.dane.rodzaj).toBe("odrzucony");
    if (stan.dane.rodzaj !== "odrzucony") return;
    expect(stan.dane.powod.length).toBeGreaterThan(0);
  });

  it("obcy nie pozna stanu moderacji cudzego wpisu", async () => {
    const firma = await firmaPoSlugu("firma-6");
    const wynik = await pobierzStanWpisuFirmy(await klientZZasiewu(), firma.id, false);

    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.powod).toBe("brak-dostepu");
  });
});

describe("jedno oczekujące zgłoszenie na przedmiot", () => {
  it("drugie zgłoszenie tego samego wpisu nie zakłada drugiego wiersza", async () => {
    /*
     * Pilnuje tego częściowy indeks unikalny z migracji 0015, a nie
     * sprawdzenie w kodzie: dwukrotne kliknięcie „wyślij” to dwa żądania,
     * a sprawdzenie przed zapisem przegrywa taki wyścig.
     */
    const firma = await firmaPoSlugu("firma-8");
    const klient = await klientZZasiewu();

    await zglosDoModeracji(klient, "company_change", firma.id);
    await zglosDoModeracji(klient, "company_change", firma.id);

    const wiersze = await db
      .select({ id: moderationSubmissions.id })
      .from(moderationSubmissions)
      .where(
        and(
          eq(moderationSubmissions.subjectKind, "company_change"),
          eq(moderationSubmissions.subjectId, firma.id),
          eq(moderationSubmissions.status, "pending"),
        ),
      );

    expect(wiersze).toHaveLength(1);
    for (const w of wiersze) UTWORZONE.push(w.id);
  });

  it("anonim niczego nie zgłasza", async () => {
    const firma = await firmaPoSlugu("firma-9");
    const wynik = await zglosDoModeracji(ANONIM, "company_change", firma.id);

    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.powod).toBe("brak-dostepu");
  });
});

describe("rozstrzygnięcie zapada raz", () => {
  it("drugie rozstrzygnięcie tego samego zgłoszenia odpada", async () => {
    /*
     * Dwie karty otwarte na tej samej kolejce to zwykła sytuacja, a nie
     * wyścig egzotyczny. Bez warunku `status = 'pending'` w zapisie druga
     * karta nadpisywałaby decyzję pierwszej i cicho zmieniała zgodę
     * w odmowę.
     */
    const moderator = await moderatorZZasiewu();
    const firma = await firmaPoSlugu("firma-10");

    await zglosDoModeracji(moderator, "company_change", firma.id);

    const [zgloszenie] = await db
      .select({ id: moderationSubmissions.id })
      .from(moderationSubmissions)
      .where(
        and(
          eq(moderationSubmissions.subjectKind, "company_change"),
          eq(moderationSubmissions.subjectId, firma.id),
          eq(moderationSubmissions.status, "pending"),
        ),
      )
      .limit(1);
    if (!zgloszenie) throw new Error("Nie udało się założyć zgłoszenia.");
    UTWORZONE.push(zgloszenie.id);

    const pierwsze = await rozstrzygnij(moderator, zgloszenie.id, {
      rodzaj: "odmowa",
      powod: "Brakuje zdjęć sali, dodaj co najmniej jedno.",
    });
    expect(pierwsze.ok).toBe(true);

    const drugie = await rozstrzygnij(moderator, zgloszenie.id, { rodzaj: "zgoda" });
    expect(drugie.ok).toBe(false);

    const [po] = await db
      .select({ status: moderationSubmissions.status, powod: moderationSubmissions.reason })
      .from(moderationSubmissions)
      .where(eq(moderationSubmissions.id, zgloszenie.id))
      .limit(1);

    // Pierwsza decyzja stoi, razem ze swoim komentarzem.
    expect(po?.status).toBe("rejected");
    expect(po?.powod).toContain("zdjęć");
  });
});

/**
 * Profil klienta i lista jego własnych zleceń na /moje.
 *
 * Reguły biznesowe tego pliku:
 *
 * 1. autor widzi **swoje** zlecenia i tylko swoje, w zakresie autorskim,
 *    czyli z opisem, budżetem i liczbą ofert — jest jedynym widzem, który
 *    ma prawo do tej liczby;
 * 2. zapis profilu zmienia wyłącznie wiersz pytającego, a identyfikator
 *    użytkownika nie jest w ogóle wejściem;
 * 3. wyczyszczenie telefonu to `update` na `null`, nigdy `delete` wiersza.
 */
import { and, eq, isNotNull, ne, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { pobierzProfilKlienta, zapiszProfilKlienta } from "@/lib/db/queries/konto";
import { pobierzMojeZlecenia } from "@/lib/db/queries/requests";
import { requests } from "@/lib/db/schema/gielda";
import { users } from "@/lib/db/schema/tozsamosc";
import { NiezaimplementowanaGalazUprawnien, type Widz } from "@/lib/permissions";
import { daneProfiluKlienta } from "@/lib/validators/konto";

const ANONIM: Widz = { rodzaj: "anonim" };
const MODERATOR: Widz = { rodzaj: "moderator", userId: "11111111-1111-4111-8111-111111111111" };

/** Profile zmienione przez ten plik, do przywrócenia po przebiegu. */
const DO_PRZYWROCENIA: { id: string; imie: string; telefon: string | null }[] = [];

/** Autor z zasiewu: człowiek, który ma w bazie własne zlecenie. */
async function autorZZasiewu(): Promise<Extract<Widz, { rodzaj: "klient" }>> {
  const [wiersz] = await db
    .select({ id: requests.authorUserId })
    .from(requests)
    .orderBy(requests.createdAt)
    .limit(1);

  if (!wiersz) throw new Error("Zasiew nie ma żadnego zlecenia, a na nim stoi ten plik.");
  return { rodzaj: "klient", userId: wiersz.id };
}

/** Inny autor: instancja pozytywna gdzie indziej, bez niej test negatywny nic nie dowodzi. */
async function innyAutor(pierwszy: string): Promise<string> {
  const [wiersz] = await db
    .select({ id: requests.authorUserId })
    .from(requests)
    .where(ne(requests.authorUserId, pierwszy))
    .limit(1);

  if (!wiersz) throw new Error("Zasiew ma zlecenia tylko jednego autora, a test potrzebuje dwóch.");
  return wiersz.id;
}

async function zapamietajProfil(userId: string): Promise<void> {
  const [wiersz] = await db
    .select({ imie: users.name, telefon: users.phone })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (wiersz) DO_PRZYWROCENIA.push({ id: userId, imie: wiersz.imie, telefon: wiersz.telefon });
}

afterAll(async () => {
  for (const profil of DO_PRZYWROCENIA) {
    await db
      .update(users)
      .set({ name: profil.imie, phone: profil.telefon })
      .where(eq(users.id, profil.id));
  }
});

describe("własne zlecenia na /moje", () => {
  it("autor widzi swoje zlecenia i nie widzi cudzych", async () => {
    const widz = await autorZZasiewu();
    const obcy = await innyAutor(widz.userId);

    const moje = await pobierzMojeZlecenia(widz);

    expect(moje.length).toBeGreaterThan(0);

    /*
     * Instancja pozytywna gdzie indziej: w bazie istnieją zlecenia innego
     * autora. Bez tego „nie widzę cudzych” i „nie ma żadnych cudzych”
     * dawałyby ten sam wynik.
     */
    const [obce] = await db
      .select({ ile: sql<number>`count(*)::int` })
      .from(requests)
      .where(eq(requests.authorUserId, obcy));
    expect(obce?.ile ?? 0).toBeGreaterThan(0);

    const autorzy = await db
      .select({ autor: requests.authorUserId })
      .from(requests)
      .where(and(eq(requests.authorUserId, widz.userId), isNotNull(requests.id)));

    expect(moje).toHaveLength(autorzy.length);
  });

  it("lista jest w zakresie autorskim: opis, budżet i liczba ofert", async () => {
    const widz = await autorZZasiewu();

    const [pierwsze] = await pobierzMojeZlecenia(widz);

    expect(pierwsze).toBeDefined();
    if (!pierwsze) return;

    // Opis i budżet to pola, których firma bez abonamentu nie widzi wcale,
    // a liczba ofert nie należy się żadnej firmie.
    expect(typeof pierwsze.opis).toBe("string");
    expect(pierwsze.opis.length).toBeGreaterThan(0);
    expect(pierwsze).toHaveProperty("budzetMin");
    expect(typeof pierwsze.liczbaOfert).toBe("number");
  });

  it("anonim nie ma własnych zleceń, moderator rzuca", async () => {
    expect(await pobierzMojeZlecenia(ANONIM)).toEqual([]);
    await expect(pobierzMojeZlecenia(MODERATOR)).rejects.toBeInstanceOf(
      NiezaimplementowanaGalazUprawnien,
    );
  });
});

describe("zapis profilu", () => {
  it("zmienia wyłącznie wiersz pytającego", async () => {
    const widz = await autorZZasiewu();
    const obcy = await innyAutor(widz.userId);
    await zapamietajProfil(widz.userId);

    const [przedObcy] = await db
      .select({ imie: users.name })
      .from(users)
      .where(eq(users.id, obcy))
      .limit(1);

    const wynik = await zapiszProfilKlienta(widz, { imie: "Zmienione Imię", telefon: "600100200" });

    expect(wynik.ok).toBe(true);
    expect((await pobierzProfilKlienta(widz))?.imie).toBe("Zmienione Imię");

    // Cudzy wiersz ma zostać nietknięty.
    const [poObcy] = await db
      .select({ imie: users.name })
      .from(users)
      .where(eq(users.id, obcy))
      .limit(1);
    expect(poObcy?.imie).toBe(przedObcy?.imie);
  });

  it("wyczyszczenie telefonu zapisuje brak wartości i nie usuwa konta", async () => {
    const widz = await autorZZasiewu();
    await zapamietajProfil(widz.userId);

    await zapiszProfilKlienta(widz, { imie: "Z Telefonem", telefon: "600100200" });
    await zapiszProfilKlienta(widz, { imie: "Bez Telefonu", telefon: null });

    const profil = await pobierzProfilKlienta(widz);

    expect(profil?.telefon).toBeNull();
    // Sedno: wiersz konta istnieje dalej. Czyszczenie pola to edycja danych
    // kontaktowych, a nie usuwanie danych biznesowych.
    expect(profil?.email).toBeTruthy();
  });

  it("anonim dostaje odmowę, moderator rzuca", async () => {
    const wynik = await zapiszProfilKlienta(ANONIM, { imie: "Ktokolwiek", telefon: null });

    expect(wynik).toEqual({ ok: false, powod: "brak-dostepu" });
    await expect(
      zapiszProfilKlienta(MODERATOR, { imie: "Ktokolwiek", telefon: null }),
    ).rejects.toBeInstanceOf(NiezaimplementowanaGalazUprawnien);
  });
});

describe("walidacja profilu", () => {
  it("identyfikator użytkownika przysłany formularzem jest odrzucany przez schemat", () => {
    const wynik = daneProfiluKlienta.parse({
      imie: "Anna",
      telefon: "",
      userId: "99999999-9999-4999-8999-999999999999",
    });

    // Schemat nie przepuszcza nieznanych pól, więc cudzy identyfikator nie ma
    // jak dojechać do zapisu. Zapis i tak bierze konto z widza.
    expect(wynik).not.toHaveProperty("userId");
  });

  it("ten sam numer w trzech zapisach daje jedną wartość", () => {
    const warianty = ["+48 600 100 200", "600-100-200", "0048600100200"];

    for (const wariant of warianty) {
      const wynik = daneProfiluKlienta.parse({ imie: "Anna", telefon: wariant });
      expect(wynik.telefon).toBe("600100200");
    }
  });

  it("puste pole telefonu znaczy brak wartości, nie pusty napis", () => {
    expect(daneProfiluKlienta.parse({ imie: "Anna", telefon: "" }).telefon).toBeNull();
  });

  it("numer o złej długości jest odrzucany", () => {
    expect(daneProfiluKlienta.safeParse({ imie: "Anna", telefon: "600100" }).success).toBe(false);
  });
});

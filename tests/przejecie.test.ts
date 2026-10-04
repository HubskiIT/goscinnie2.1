/**
 * Przejęcie profilu i edycja podstaw.
 *
 * Największe ryzyko tego plastra: przejęcie cudzej firmy. Każdy może kliknąć
 * „to moja firma”, łącznie z konkurencją zza rogu, więc zgłoszenie nie może
 * dawać żadnego dostępu. Cała ochrona siedzi w ręcznym zatwierdzaniu.
 *
 * Testy pracują na firmach i wnioskach z zasiewu.
 */
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { POST as zglosEndpoint } from "@/app/api/firmy/[slug]/przejecie/route";
import { PATCH as edytujEndpoint } from "@/app/api/firmy/[slug]/route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pobierzProfilFirmy } from "@/lib/db/queries/firmy";
import {
  companies,
  companyCategories,
  companyClaims,
  companyMembers,
} from "@/lib/db/schema/katalog";
import { rateLimits } from "@/lib/db/schema/sesje";
import { users } from "@/lib/db/schema/tozsamosc";
import { mozeEdytowacProfil, mozeZglosicPrzejecie, type Widz } from "@/lib/permissions";

const HASLO = "goscinnie-lokalnie-2026";

const IMPORTOWANY = "firma-8";
const PRZEJETY = "firma-11";
const SPORNY = "firma-13";

type Sesja = { ciasteczko: string; userId: string };

async function zaloguj(email: string): Promise<Sesja> {
  await db
    .update(rateLimits)
    .set({ windowStart: new Date(Date.now() - 60 * 60 * 1000) })
    .where(eq(rateLimits.key, `logowanie:konto:${email.toLowerCase()}`));

  const odpowiedz = await auth.api.signInEmail({
    body: { email, password: HASLO },
    returnHeaders: true,
    headers: new Headers({ "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200)}` }),
  });

  const ciasteczko = odpowiedz.headers.get("set-cookie");
  if (!ciasteczko) throw new Error(`Logowanie ${email} nie zwróciło ciasteczka.`);
  return { ciasteczko, userId: odpowiedz.response.user.id };
}

function zadanie(sciezka: string, sesja: Sesja | null, cialo: unknown, metoda = "POST"): Request {
  const naglowki = new Headers({ "content-type": "application/json" });
  if (sesja) naglowki.set("cookie", sesja.ciasteczko);
  return new Request(`http://localhost:3000${sciezka}`, {
    method: metoda,
    headers: naglowki,
    body: JSON.stringify(cialo),
  });
}

async function zglos(slug: string, sesja: Sesja | null, uzasadnienie = "To moja firma.") {
  const odpowiedz = await zglosEndpoint(
    zadanie(`/api/firmy/${slug}/przejecie`, sesja, { uzasadnienie }),
    { params: Promise.resolve({ slug }) },
  );
  return { status: odpowiedz.status, tekst: await odpowiedz.text() };
}

async function edytuj(slug: string, sesja: Sesja | null, dane: Record<string, unknown>) {
  const odpowiedz = await edytujEndpoint(zadanie(`/api/firmy/${slug}`, sesja, dane, "PATCH"), {
    params: Promise.resolve({ slug }),
  });
  return { status: odpowiedz.status, tekst: await odpowiedz.text() };
}

const PELNE_DANE = {
  opis: "Sala na sto osób, ogród, własna kuchnia.",
  cenaOdZl: 320,
  pojemnoscMin: 20,
  pojemnoscMax: 100,
  kategorie: ["sale"],
};

let obcy: Sesja;
let wnioskodawca: Sesja;
let wlascicielPrzejetego: Sesja;

beforeAll(async () => {
  // Klient bez żadnego związku z firmami.
  obcy = await zaloguj("uzytkownik14@przyklad.pl");
  // Klient, który złoży wniosek w trakcie testów.
  wnioskodawca = await zaloguj("uzytkownik15@przyklad.pl");

  const [wlasciciel] = await db
    .select({ email: users.email })
    .from(companies)
    .innerJoin(companyMembers, eq(companyMembers.companyId, companies.id))
    .innerJoin(users, eq(users.id, companyMembers.userId))
    .where(eq(companies.slug, PRZEJETY))
    .limit(1);
  if (!wlasciciel) throw new Error("Zasiew nie ma właściciela profilu przejętego.");
  wlascicielPrzejetego = await zaloguj(wlasciciel.email);
});

/** Punkt (a) z rozpisu: przejęcie cudzej firmy. */
describe("zgłoszenie przejęcia nie daje żadnego dostępu", () => {
  it("anonim nie może zgłosić przejęcia", async () => {
    const { status } = await zglos(IMPORTOWANY, null);
    expect(status).toBe(403);
  });

  it("zalogowany może zgłosić i dostaje 201", async () => {
    const { status, tekst } = await zglos(IMPORTOWANY, wnioskodawca);
    expect(status).toBe(201);
    expect(JSON.parse(tekst).wniosek.id).toBeTruthy();
  });

  it("drugi wniosek tej samej osoby do tej samej firmy daje 409", async () => {
    const { status } = await zglos(IMPORTOWANY, wnioskodawca);
    expect(status).toBe(409);
  });

  it("wniosek oczekujący NIE zakłada członkostwa", async () => {
    const [firma] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, IMPORTOWANY))
      .limit(1);
    if (!firma) throw new Error("Brak profilu importowanego.");

    const czlonkostwa = await db
      .select({ id: companyMembers.id })
      .from(companyMembers)
      .where(
        and(eq(companyMembers.companyId, firma.id), eq(companyMembers.userId, wnioskodawca.userId)),
      );

    expect(czlonkostwa).toHaveLength(0);
  });

  it("wniosek oczekujący NIE zmienia statusu firmy", async () => {
    const profil = await pobierzProfilFirmy({ rodzaj: "anonim" }, IMPORTOWANY);
    expect(profil?.status).toBe("draft");
  });

  it("KLUCZOWE: człowiek z wnioskiem dostaje przy edycji to samo, co obcy", async () => {
    // Gdyby wniosek dawał cokolwiek, wystarczyłoby kliknąć „to moja firma”,
    // żeby edytować cudzy profil, a ręczne zatwierdzanie byłoby ozdobą.
    const zWnioskiem = await edytuj(IMPORTOWANY, wnioskodawca, PELNE_DANE);
    const zupelnieObcy = await edytuj(IMPORTOWANY, obcy, PELNE_DANE);

    expect(zWnioskiem.status).toBe(403);
    expect(zWnioskiem.status).toBe(zupelnieObcy.status);
    expect(zWnioskiem.tekst).toBe(zupelnieObcy.tekst);
  });

  it("dwa wnioski do jednej firmy od różnych osób zapisują się oba", async () => {
    // To sygnał do sprawdzenia, nie błąd. Gdyby zapisywał się tylko pierwszy,
    // konkurencja blokowałaby prawdziwego właściciela samym kliknięciem.
    const [firma] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, SPORNY))
      .limit(1);
    if (!firma) throw new Error("Brak firmy spornej.");

    const wnioski = await db
      .select({ userId: companyClaims.userId })
      .from(companyClaims)
      .where(and(eq(companyClaims.companyId, firma.id), eq(companyClaims.status, "pending")));

    expect(wnioski.length).toBe(2);
    expect(new Set(wnioski.map((w) => w.userId)).size).toBe(2);
  });
});

/** Punkt (b) z rozpisu: edycja przez nie-członka. */
describe("edytować może wyłącznie członek firmy", () => {
  it("reguła: bez członkostwa nie ma prawa zapisu", () => {
    const klient: Widz = { rodzaj: "klient", userId: "u1" };
    expect(mozeEdytowacProfil(klient, false)).toEqual({ wolno: false, powod: "brak-dostepu" });
    expect(mozeEdytowacProfil(klient, true)).toEqual({ wolno: true });
  });

  it("obcy dostaje 403 i nic się nie zapisuje", async () => {
    const przed = await pobierzProfilFirmy({ rodzaj: "anonim" }, PRZEJETY);

    const { status } = await edytuj(PRZEJETY, obcy, {
      ...PELNE_DANE,
      opis: "Opis wstawiony przez kogoś obcego.",
    });
    expect(status).toBe(403);

    const po = await pobierzProfilFirmy({ rodzaj: "anonim" }, PRZEJETY);
    expect(po?.opis).toBe(przed?.opis);
  });

  it("członek firmy zapisuje bez przeszkód", async () => {
    const { status } = await edytuj(PRZEJETY, wlascicielPrzejetego, PELNE_DANE);
    expect(status).toBe(200);
  });

  it("członek nie może edytować cudzej firmy", async () => {
    const { status } = await edytuj(IMPORTOWANY, wlascicielPrzejetego, PELNE_DANE);
    expect(status).toBe(403);
  });
});

/** Punkt (c) z rozpisu: cena w groszach, formularz w złotówkach. */
describe("cena przechodzi tam i z powrotem bez zgubienia dwóch rzędów wielkości", () => {
  it("320 zł zapisuje się jako 32000 groszy", async () => {
    const { status } = await edytuj(PRZEJETY, wlascicielPrzejetego, {
      ...PELNE_DANE,
      cenaOdZl: 320,
    });
    expect(status).toBe(200);

    const profil = await pobierzProfilFirmy({ rodzaj: "anonim" }, PRZEJETY);
    expect(profil?.cenaOd).toBe(32000);
  });

  it("z pustej ceny na wypełnioną", async () => {
    await edytuj(PRZEJETY, wlascicielPrzejetego, { ...PELNE_DANE, cenaOdZl: "" });
    expect((await pobierzProfilFirmy({ rodzaj: "anonim" }, PRZEJETY))?.cenaOd).toBeNull();

    await edytuj(PRZEJETY, wlascicielPrzejetego, { ...PELNE_DANE, cenaOdZl: 199 });
    expect((await pobierzProfilFirmy({ rodzaj: "anonim" }, PRZEJETY))?.cenaOd).toBe(19900);
  });

  it("z wypełnionej ceny na pustą, i to nie znaczy zero", async () => {
    await edytuj(PRZEJETY, wlascicielPrzejetego, { ...PELNE_DANE, cenaOdZl: 500 });
    await edytuj(PRZEJETY, wlascicielPrzejetego, { ...PELNE_DANE, cenaOdZl: "" });

    const profil = await pobierzProfilFirmy({ rodzaj: "anonim" }, PRZEJETY);
    expect(profil?.cenaOd).toBeNull();
    expect(profil?.cenaOd).not.toBe(0);
  });

  it("cena z groszami po przecinku zaokrągla się, nie gubi", async () => {
    await edytuj(PRZEJETY, wlascicielPrzejetego, { ...PELNE_DANE, cenaOdZl: 99.99 });
    expect((await pobierzProfilFirmy({ rodzaj: "anonim" }, PRZEJETY))?.cenaOd).toBe(9999);
  });
});

/** Punkt (d) z rozpisu: zmiana kategorii zmienia wyniki wyszukiwania. */
describe("podmiana kategorii", () => {
  it("nowy zestaw zastępuje stary w całości", async () => {
    await edytuj(PRZEJETY, wlascicielPrzejetego, { ...PELNE_DANE, kategorie: ["sale"] });
    const poPierwszej = await pobierzProfilFirmy({ rodzaj: "anonim" }, PRZEJETY);
    expect(poPierwszej?.kategorie).toEqual(["Sale i lokale"]);

    await edytuj(PRZEJETY, wlascicielPrzejetego, { ...PELNE_DANE, kategorie: ["fotograf"] });
    const poDrugiej = await pobierzProfilFirmy({ rodzaj: "anonim" }, PRZEJETY);
    expect(poDrugiej?.kategorie).toEqual(["Fotograf"]);
  });

  it("firma nigdy nie zostaje w dwóch kategoriach naraz po podmianie", async () => {
    await edytuj(PRZEJETY, wlascicielPrzejetego, { ...PELNE_DANE, kategorie: ["catering", "dj"] });
    const profil = await pobierzProfilFirmy({ rodzaj: "anonim" }, PRZEJETY);

    expect(profil?.kategorie.sort()).toEqual(["Catering", "DJ i muzyka"]);
    expect(profil?.kategorie).not.toContain("Fotograf");
  });

  it("powrót do kategorii zdjętej wcześniej działa", async () => {
    // Wiersze nie znikają, tylko dostają datę archiwizacji, więc ponowne
    // dodanie tej samej kategorii musi wyzerować tę datę, a nie wyłożyć się
    // na kluczu głównym.
    await edytuj(PRZEJETY, wlascicielPrzejetego, { ...PELNE_DANE, kategorie: ["sale"] });
    await edytuj(PRZEJETY, wlascicielPrzejetego, { ...PELNE_DANE, kategorie: ["fotograf"] });
    const { status } = await edytuj(PRZEJETY, wlascicielPrzejetego, {
      ...PELNE_DANE,
      kategorie: ["sale"],
    });

    expect(status).toBe(200);
    expect((await pobierzProfilFirmy({ rodzaj: "anonim" }, PRZEJETY))?.kategorie).toEqual([
      "Sale i lokale",
    ]);
  });

  it("zdjęte przypisania zostają w bazie, tylko z datą archiwizacji", async () => {
    // Zasada 5: nic, co dotyczy firm, nie znika z bazy.
    const [firma] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, PRZEJETY))
      .limit(1);
    if (!firma) throw new Error("Brak firmy przejętej.");

    // Liczymy wiersze wprost, bo chodzi o to, co jest w tabeli, a nie o to,
    // co pokazuje profil.
    const wiersze = await db
      .select({
        categoryId: companyCategories.categoryId,
        archivedAt: companyCategories.archivedAt,
      })
      .from(companyCategories)
      .where(eq(companyCategories.companyId, firma.id));

    const aktywne = wiersze.filter((w) => w.archivedAt === null);
    const zarchiwizowane = wiersze.filter((w) => w.archivedAt !== null);

    // Poprzednie testy przestawiały kategorie kilka razy, więc w bazie musi
    // być więcej wierszy niż aktywnych kategorii.
    expect(aktywne.length).toBe(1);
    expect(zarchiwizowane.length).toBeGreaterThan(0);

    const profil = await pobierzProfilFirmy({ rodzaj: "anonim" }, PRZEJETY);
    expect(profil?.kategorie.length).toBe(1);
  });
});

describe("reguła zgłoszenia przejęcia", () => {
  it("członek firmy nie ma czego przejmować", () => {
    const klient: Widz = { rodzaj: "klient", userId: "u1" };
    expect(mozeZglosicPrzejecie(klient, true)).toEqual({ wolno: false, powod: "brak-dostepu" });
    expect(mozeZglosicPrzejecie(klient, false)).toEqual({ wolno: true });
  });

  it("anonim nie zgłasza niczego", () => {
    expect(mozeZglosicPrzejecie({ rodzaj: "anonim" }, false)).toEqual({
      wolno: false,
      powod: "brak-dostepu",
    });
  });
});

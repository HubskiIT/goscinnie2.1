/**
 * Zakładanie konta klienta przez akcję serwerową, czyli tą samą drogą,
 * którą idzie człowiek z formularza na /rejestracja/klient.
 *
 * Reguła biznesowa: konto klienta powstaje **niepotwierdzone** i z rolą
 * `client`, a wejście, które nie przeszło walidacji, nie zostawia w bazie
 * żadnego śladu.
 *
 * Dlaczego test woła akcję, a nie `auth.api.signUpEmail` wprost: schemat
 * i wywołanie biblioteki są sprawdzone osobno gdzie indziej, a tutaj chodzi
 * o to, czy akcja faktycznie je spina. Test na samym schemacie przeszedłby
 * nawet wtedy, gdyby akcja walidowała dane i zakładała konto mimo odmowy.
 *
 * `next/headers` jest podstawione, bo poza żądaniem HTTP nie ma nagłówków
 * do odczytania. Reszta drogi, łącznie z better-auth i bazą, jest prawdziwa.
 */
import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { accounts, sessions, verifications } from "@/lib/db/schema/sesje";
import { users } from "@/lib/db/schema/tozsamosc";
import { STAN_POCZATKOWY, type StanFormularza } from "@/lib/formularze";

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

const { zarejestrujKlienta } = await import("@/lib/akcje/rejestracja");

/** Prefiks adresów zakładanych przez ten plik. Po nim sprzątamy. */
const PREFIKS = "klient-test-";

/** Hasło spełniające wszystkie reguły. Same reguły sprawdza tests/haslo.test.ts. */
const HASLO = "Dobre-haslo-klienta-1";

const WSZYSTKIE_ADRESY: string[] = [];

function adres(co: string): string {
  const email = `${PREFIKS}${co}@przyklad.pl`;
  WSZYSTKIE_ADRESY.push(email);
  return email;
}

type Wywolanie = { przekierowano: boolean; stan: StanFormularza | null };

/**
 * Wywołuje akcję i rozpoznaje przekierowanie.
 *
 * `redirect` w Next.js działa przez wyjątek, więc udana rejestracja kończy
 * się rzutem, a nie zwróconym stanem. Bez tego rozróżnienia test nie odróżni
 * sukcesu od awarii.
 */
async function zarejestruj(dane: Record<string, string>): Promise<Wywolanie> {
  const formularz = new FormData();
  for (const [pole, wartosc] of Object.entries(dane)) formularz.set(pole, wartosc);

  try {
    return { przekierowano: false, stan: await zarejestrujKlienta(STAN_POCZATKOWY, formularz) };
  } catch (blad) {
    const digest = (blad as { digest?: string }).digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
      return { przekierowano: true, stan: null };
    }
    throw blad;
  }
}

async function konto(email: string) {
  const [wiersz] = await db
    .select({ id: users.id, potwierdzony: users.emailVerified, rola: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return wiersz ?? null;
}

async function usunKonto(email: string): Promise<void> {
  const znalezione = await konto(email);
  if (!znalezione) return;

  // Sprzątanie po teście, na danych, które ten test właśnie utworzył.
  await db.delete(sessions).where(eq(sessions.userId, znalezione.id));
  await db.delete(accounts).where(eq(accounts.userId, znalezione.id));
  await db.delete(verifications).where(like(verifications.identifier, `%${email}%`));
  await db.delete(users).where(eq(users.id, znalezione.id));
}

afterAll(async () => {
  for (const email of WSZYSTKIE_ADRESY) await usunKonto(email);
});

describe("konto klienta powstaje we właściwym stanie", () => {
  it("poprawne dane zakładają konto niepotwierdzone i przekierowują na weryfikację", async () => {
    const email = adres("poprawny");

    const wynik = await zarejestruj({ email, haslo: HASLO, haslo2: HASLO });

    expect(wynik.przekierowano).toBe(true);

    const utworzone = await konto(email);
    expect(utworzone).not.toBeNull();
    // Sedno: konto istnieje, ale adres nie jest jeszcze potwierdzony.
    // Potwierdzenie ma wymagać kodu ze skrzynki, nie samego formularza.
    expect(utworzone?.potwierdzony).toBe(false);
  });

  it("konto założone drogą klienta ma rolę client", async () => {
    const email = adres("rola");

    await zarejestruj({ email, haslo: HASLO, haslo2: HASLO });

    expect((await konto(email))?.rola).toBe("client");
  });
});

describe("wejście odrzucone nie zostawia konta", () => {
  it("niezgodne hasła nie zakładają konta", async () => {
    const email = adres("rozjazd");

    const wynik = await zarejestruj({ email, haslo: HASLO, haslo2: `${HASLO}X` });

    expect(wynik.przekierowano).toBe(false);
    expect(wynik.stan?.status).toBe("bledy");
    // Nie wystarczy, że akcja zwróciła błąd: konta ma w bazie nie być.
    expect(await konto(email)).toBeNull();
  });

  it("hasło niespełniające reguł nie zakłada konta", async () => {
    const email = adres("slabe");
    const slabe = "bezwielkiejliterycyfry";

    const wynik = await zarejestruj({ email, haslo: slabe, haslo2: slabe });

    expect(wynik.przekierowano).toBe(false);
    expect(wynik.stan?.status).toBe("bledy");
    expect(await konto(email)).toBeNull();
  });

  it("adres, który nie jest adresem, nie zakłada konta", async () => {
    const wynik = await zarejestruj({ email: "to-nie-jest-adres", haslo: HASLO, haslo2: HASLO });

    expect(wynik.przekierowano).toBe(false);
    expect(wynik.stan?.status).toBe("bledy");
  });
});

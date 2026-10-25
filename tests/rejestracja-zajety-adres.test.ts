/**
 * Zakładanie konta na adres, który już jest w bazie.
 *
 * Reguła biznesowa: człowiek, który ma już konto i próbuje założyć drugie,
 * dowiaduje się tego **przy polu adresu**, a nie z ogólnika „spróbuj ponownie
 * za chwilę”, i nie ląduje na ekranie wpisywania kodu, który nigdy nie
 * przyjdzie.
 *
 * DLACZEGO TEN PLIK ISTNIEJE. better-auth przy `requireEmailVerification: true`
 * nie rzuca przy zajętym adresie: zwraca atrapę użytkownika z identyfikatorem
 * zrobionym na miejscu (api/routes/sign-up.mjs:200-210). Przy
 * `generateId: false` ten identyfikator **nie jest uuid-em**, więc ścieżka
 * firmy wkładała go do `where id = $1` na kolumnie uuid i dostawała od
 * Postgresa 22P02. Wyjątek wpadał do `catch`, a formularz pokazywał ogólnik
 * pod kluczem `_`.
 *
 * Istniejący `tests/konto.test.ts` tego nie łapał i nie mógł: woła
 * `auth.api.signUpEmail` wprost, czyli sprawdza bibliotekę, a nie akcję.
 * Dlatego ten test idzie przez akcję serwerową, tą samą drogą co formularz.
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

const { zarejestrujFirme, zarejestrujKlienta } = await import("@/lib/akcje/rejestracja");

/** Prefiks adresów zakładanych przez ten plik. Po nim sprzątamy. */
const PREFIKS = "zajety-test-";

const HASLO = "Dobre-haslo-zajete-1";

const WSZYSTKIE_ADRESY: string[] = [];

function adres(co: string): string {
  const email = `${PREFIKS}${co}@przyklad.pl`;
  WSZYSTKIE_ADRESY.push(email);
  return email;
}

type Wywolanie = { przekierowano: boolean; stan: StanFormularza | null };

type Akcja = (poprzedni: StanFormularza, dane: FormData) => Promise<StanFormularza>;

/**
 * Wywołuje akcję i rozpoznaje przekierowanie.
 *
 * `redirect` w Next.js działa przez wyjątek, więc udana rejestracja kończy się
 * rzutem, a nie zwróconym stanem. Bez tego rozróżnienia test nie odróżniłby
 * sukcesu od awarii.
 */
async function zarejestruj(akcja: Akcja, email: string): Promise<Wywolanie> {
  const formularz = new FormData();
  formularz.set("email", email);
  formularz.set("haslo", HASLO);
  formularz.set("haslo2", HASLO);

  try {
    return { przekierowano: false, stan: await akcja(STAN_POCZATKOWY, formularz) };
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
    .select({ id: users.id, rola: users.role, potwierdzony: users.emailVerified })
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

/** Błędy przypisane do konkretnego pola formularza. */
function bledyPola(stan: StanFormularza | null, pole: string): string[] {
  return stan?.status === "bledy" ? (stan.bledy[pole] ?? []) : [];
}

describe("drugie konto na ten sam adres: ścieżka firmy", () => {
  it("odmawia przy polu adresu, a nie ogólnikiem", async () => {
    const email = adres("firma");

    // Pierwsze zakładanie musi się udać, inaczej test niczego nie dowodzi:
    // „nie ma takiego konta” i „jest, ale odmawiamy” dałyby ten sam wynik.
    const pierwsze = await zarejestruj(zarejestrujFirme, email);
    expect(pierwsze.przekierowano).toBe(true);
    expect((await konto(email))?.rola).toBe("company_owner");

    const drugie = await zarejestruj(zarejestrujFirme, email);

    // Sedno: nie przekierowujemy na ekran z kodem, bo kod nie przyjdzie.
    expect(drugie.przekierowano).toBe(false);
    // Komunikat stoi przy polu `email`, nie pod kluczem `_`. Kreator pokazuje
    // błędy pól obok pól, a `_` rysuje jako ogólną czerwoną ramkę.
    expect(bledyPola(drugie.stan, "email").join(" ")).toMatch(/już istnieje/i);
    expect(bledyPola(drugie.stan, "_")).toEqual([]);
  });

  it("drugie zgłoszenie nie tworzy drugiego konta ani nie zmienia roli", async () => {
    const email = adres("firma-bez-skutku");

    await zarejestruj(zarejestrujFirme, email);
    await zarejestruj(zarejestrujFirme, email);

    const wiersze = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    expect(wiersze).toHaveLength(1);
    expect((await konto(email))?.rola).toBe("company_owner");
  });
});

describe("drugie konto na ten sam adres: ścieżka klienta", () => {
  it("odmawia przy polu adresu, zamiast odsyłać po kod, który nie przyjdzie", async () => {
    const email = adres("klient");

    const pierwsze = await zarejestruj(zarejestrujKlienta, email);
    expect(pierwsze.przekierowano).toBe(true);
    expect(await konto(email)).not.toBeNull();

    const drugie = await zarejestruj(zarejestrujKlienta, email);

    /*
     * Sedno tej ścieżki. Dotąd nie było tu żadnego sprawdzenia, więc akcja
     * przekierowywała na /weryfikacja, a `wyslijKodPotwierdzeniaAdresu` nic
     * nie wysyłało dla konta już potwierdzonego. Człowiek czekał na kod,
     * którego nikt nie nadał.
     */
    expect(drugie.przekierowano).toBe(false);
    expect(bledyPola(drugie.stan, "email").join(" ")).toMatch(/już istnieje/i);
  });
});

describe("odmowa nie wycieka informacji o cudzym koncie", () => {
  it("adres wolny nadal zakłada konto, więc odmowa dotyczy zajętości, nie wszystkiego", async () => {
    /*
     * Instancja pozytywna obok negatywnej. Bez niej test wyżej przechodziłby
     * także wtedy, gdyby akcja odmawiała **każdemu** zgłoszeniu: „nikt nie
     * założy konta” i „ten nie założy” dają ten sam wynik.
     */
    const email = adres("wolny");

    const wynik = await zarejestruj(zarejestrujKlienta, email);

    expect(wynik.przekierowano).toBe(true);
    expect(await konto(email)).not.toBeNull();
  });
});

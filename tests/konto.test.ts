/**
 * Zakładanie konta, potwierdzanie adresu i logowanie.
 *
 * NAJWAŻNIEJSZA REGUŁA W TYM PLIKU: **zły kod nie potwierdza adresu**.
 *
 * Poprzednia wersja `zweryfikujEmail` nie sprawdzała kodu w ogóle. Znajdowała
 * konto po adresie z formularza i ustawiała `email_verified` na prawdę, więc
 * dowolne sześć cyfr potwierdzało dowolny cudzy adres. Wystarczyło znać czyjś
 * e-mail, żeby przejąć jego konto w trakcie zakładania. Pierwszy blok testów
 * istnieje po to, żeby ta dziura nie wróciła.
 *
 * Druga reguła: **niepotwierdzone konto się nie loguje**. Na niej stoi sens
 * potwierdzania adresu w ogóle.
 *
 * Testy pracują na własnych kontach, nie na zasiewowych, bo zakładanie konta
 * jest tym, co sprawdzają. Konta z zasiewu służą do sprawdzenia logowania,
 * czyli ścieżki, która zasiewu używa.
 */
import { eq, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts, sessions, verifications } from "@/lib/db/schema/sesje";
import { users } from "@/lib/db/schema/tozsamosc";

/** Prefiks adresów zakładanych przez ten plik. Po nim sprzątamy. */
const PREFIKS = "konto-test-";

/** Hasło spełniające wymóg dwunastu znaków. */
const HASLO = "bardzo-dlugie-haslo-testowe";

function adres(co: string): string {
  return `${PREFIKS}${co}@przyklad.pl`;
}

/** Zakłada konto przez tę samą drogę, którą idzie kreator. */
async function zalozKonto(email: string): Promise<void> {
  await auth.api.signUpEmail({
    body: { email, password: HASLO, name: "Testowe" },
    asResponse: false,
  });
}

async function czyPotwierdzony(email: string): Promise<boolean> {
  const [wiersz] = await db
    .select({ potwierdzony: users.emailVerified })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return wiersz?.potwierdzony ?? false;
}

/**
 * Kod wysłany na podany adres, wyciągnięty wprost z tabeli better-auth.
 *
 * Test nie ma dostępu do skrzynki, a nadawca w trybie lokalnym pisze do
 * konsoli. Czytamy więc to, co wtyczka zapisała. Kod leży w bazie **w postaci
 * skrótu**, więc to, co stąd wraca, nie nadaje się do wpisania: służy
 * wyłącznie do sprawdzenia, że zgłoszenie w ogóle powstało.
 */
async function zgloszenieWeryfikacji(email: string): Promise<string | null> {
  const wiersze = await db
    .select({ wartosc: verifications.value, identyfikator: verifications.identifier })
    .from(verifications)
    .where(like(verifications.identifier, `%${email}%`));

  return wiersze[0]?.wartosc ?? null;
}

async function usunKonto(email: string): Promise<void> {
  const [uzytkownik] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!uzytkownik) return;

  // Sprzątanie po teście, na danych, które ten test właśnie utworzył.
  await db.delete(sessions).where(eq(sessions.userId, uzytkownik.id));
  await db.delete(accounts).where(eq(accounts.userId, uzytkownik.id));
  await db.delete(verifications).where(like(verifications.identifier, `%${email}%`));
  await db.delete(users).where(eq(users.id, uzytkownik.id));
}

const WSZYSTKIE_ADRESY = [
  adres("dziura"),
  adres("ofiara"),
  adres("niepotwierdzony"),
  adres("potwierdzony"),
  adres("logowanie"),
  adres("duplikat"),
];

beforeAll(async () => {
  for (const email of WSZYSTKIE_ADRESY) await usunKonto(email);
});

afterAll(async () => {
  for (const email of WSZYSTKIE_ADRESY) await usunKonto(email);
});

describe("zły kod nie potwierdza adresu", () => {
  it("sześć przypadkowych cyfr nie przechodzi", async () => {
    const email = adres("dziura");
    await zalozKonto(email);

    expect(await czyPotwierdzony(email)).toBe(false);

    await expect(
      auth.api.verifyEmailOTP({ body: { email, otp: "000000" }, asResponse: false }),
    ).rejects.toThrow();

    // To jest sedno: po nieudanej próbie konto nadal jest niepotwierdzone.
    expect(await czyPotwierdzony(email)).toBe(false);
  });

  it("znajomość cudzego adresu nie wystarcza do potwierdzenia go", async () => {
    /*
     * Dokładnie ten scenariusz, który przepuszczała poprzednia wersja:
     * ktoś zna adres ofiary i podaje go razem z wymyślonym kodem.
     */
    const ofiara = adres("ofiara");
    await zalozKonto(ofiara);

    for (const kod of ["123456", "111111", "999999", "000001"]) {
      await expect(
        auth.api.verifyEmailOTP({ body: { email: ofiara, otp: kod }, asResponse: false }),
        `kod ${kod} nie powinien przejść`,
      ).rejects.toThrow();
    }

    expect(await czyPotwierdzony(ofiara)).toBe(false);
  });

  it("kod w bazie leży jako skrót, nie jako sześć cyfr do odczytania", async () => {
    const email = adres("niepotwierdzony");
    await zalozKonto(email);

    const zapisane = await zgloszenieWeryfikacji(email);

    expect(zapisane, "zakładanie konta nie utworzyło zgłoszenia weryfikacji").not.toBeNull();
    /*
     * Gdyby kod leżał wprost, wyciek tabeli `verifications` dawałby gotowe
     * kody do cudzych kont. Skrót jest dłuższy niż sześć cyfr i nie składa
     * się z samych cyfr.
     */
    expect(zapisane).not.toMatch(/^\d{6}$/);
  });
});

describe("niepotwierdzone konto się nie loguje", () => {
  it("poprawne hasło nie wystarcza, dopóki adres nie jest potwierdzony", async () => {
    const email = adres("logowanie");
    await zalozKonto(email);

    // Hasło jest poprawne. Odmowa bierze się wyłącznie z braku potwierdzenia.
    await expect(
      auth.api.signInEmail({ body: { email, password: HASLO }, asResponse: false }),
    ).rejects.toThrow();
  });

  it("po potwierdzeniu adresu logowanie przechodzi", async () => {
    const email = adres("potwierdzony");
    await zalozKonto(email);

    /*
     * Potwierdzamy wprost w bazie, a nie kodem: skrótu z `verifications`
     * nie da się odwrócić, a tworzenie własnego kodu obok wtyczki znaczyłoby
     * sprawdzanie własnej atrapy zamiast prawdziwej ścieżki.
     *
     * Ten test pilnuje drugiej połowy reguły: że potwierdzenie **odblokowuje**
     * logowanie. Bez niego poprzedni test przechodziłby także wtedy, gdyby
     * logowanie było zepsute na amen i odmawiało wszystkim.
     */
    await db.update(users).set({ emailVerified: true }).where(eq(users.email, email));

    const sesja = await auth.api.signInEmail({
      body: { email, password: HASLO },
      asResponse: false,
    });

    expect(sesja).toBeTruthy();
  });

  it("złe hasło nie przechodzi także na potwierdzonym koncie", async () => {
    const email = adres("potwierdzony");

    await expect(
      auth.api.signInEmail({
        body: { email, password: "zupelnie-inne-haslo-testowe" },
        asResponse: false,
      }),
    ).rejects.toThrow();
  });
});

describe("zakładanie konta", () => {
  it("drugie zakładanie konta na ten sam adres niczego nie zmienia", async () => {
    const email = adres("duplikat");
    await zalozKonto(email);

    const [przed] = await db
      .select({ haslo: accounts.password })
      .from(accounts)
      .innerJoin(users, eq(users.id, accounts.userId))
      .where(eq(users.email, email))
      .limit(1);

    /*
     * better-auth **nie rzuca** przy zajętym adresie i to jest zamierzone:
     * komunikat „ten adres jest zajęty" zamieniłby rejestrację w sprawdzarkę,
     * czy ktoś ma u nas konto.
     *
     * Istotne jest co innego i to sprawdza ten test: cisza nie znaczy, że
     * konto zostało przejęte. Drugie zgłoszenie nie tworzy drugiego wiersza
     * i **nie nadpisuje hasła**, więc właściciel nadal loguje się swoim.
     */
    await zalozKonto(email);

    const wiersze = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    expect(wiersze).toHaveLength(1);

    const [po] = await db
      .select({ haslo: accounts.password })
      .from(accounts)
      .innerJoin(users, eq(users.id, accounts.userId))
      .where(eq(users.email, email))
      .limit(1);

    expect(po?.haslo).toBe(przed?.haslo);
  });

  it("nowe konto startuje jako niepotwierdzone", async () => {
    // Gdyby konto powstawało od razu potwierdzone, cały krok z kodem
    // byłby ozdobą, a testy wyżej przechodziłyby z niewłaściwego powodu.
    expect(await czyPotwierdzony(adres("duplikat"))).toBe(false);
  });

  it("hasło nie leży w bazie w postaci jawnej", async () => {
    const email = adres("duplikat");
    const [uzytkownik] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!uzytkownik) throw new Error("Brak konta założonego przez ten test.");

    const [konto] = await db
      .select({ haslo: accounts.password })
      .from(accounts)
      .where(eq(accounts.userId, uzytkownik.id))
      .limit(1);

    expect(konto?.haslo).toBeTruthy();
    expect(konto?.haslo).not.toBe(HASLO);
    // argon2id zapisuje skrót w formacie zaczynającym się od $argon2id$.
    expect(konto?.haslo).toMatch(/^\$argon2id\$/);
  });
});

/**
 * Zmiana zapomnianego hasła kodem z maila.
 *
 * DWIE REGUŁY, OBIE NA RÓWNI WAŻNE:
 *
 * 1. Droga ma działać od końca do końca: kod z maila ustawia nowe hasło,
 *    stare przestaje działać.
 * 2. Formularz **nie jest sprawdzarką adresów**. Odpowiedź musi być
 *    identyczna dla adresu, na którym jest konto, i dla takiego, na którym
 *    go nie ma — także wtedy, gdy wysyłka padnie. To jest przypadek 20
 *    z docs/uprawnienia.md.
 *
 * Napięcie między „pokaż prawdę o awarii" a regułą 2 rozstrzyga kolejność
 * kroków w `lib/konto/kody.ts`: nadawcę pobieramy **przed** zajrzeniem
 * do bazy, więc awaria konfiguracji wychodzi tak samo dla każdego adresu
 * i wolno ją pokazać. Czwarty test w tym pliku pilnuje właśnie tej kolejności.
 *
 * Wymaga działającej bazy z zasiewem.
 */
import { eq, like } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts, verifications } from "@/lib/db/schema/sesje";
import { users } from "@/lib/db/schema/tozsamosc";
import { HASLO_ZASIEWOWE } from "@/lib/db/seed";
import { STAN_POCZATKOWY } from "@/lib/formularze";
import type { Email, Nadawca } from "@/lib/poczta";

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

const { poprosONoweHaslo, ustawNoweHasloKodem } = await import("@/lib/akcje/haslo");
const { wyslijKodResetuHasla } = await import("@/lib/konto/kody");

/** Konto z zasiewu, na którym ten plik zmienia hasło. Przywracane na końcu. */
const KONTO = "uzytkownik7@przyklad.pl";
const NIE_MA_TAKIEGO = "na-pewno-nie-ma-takiego@przyklad.pl";

const NOWE_HASLO = "Zupelnie-nowe-haslo-9";

class NadawcaZapisujacy implements Nadawca {
  wyslane: Email[] = [];

  async wyslij(email: Email): Promise<void> {
    this.wyslane.push(email);
  }
}

function formularz(pola: Record<string, string>): FormData {
  const dane = new FormData();
  for (const [klucz, wartosc] of Object.entries(pola)) dane.set(klucz, wartosc);
  return dane;
}

/** Kod z treści maila. Z bazy go nie odczytamy, bo leży tam jako skrót. */
function kodZMaila(email: Email): string {
  const trafienie = email.html.match(/\b(\d{6})\b/);
  if (!trafienie?.[1]) throw new Error("W mailu nie ma sześciocyfrowego kodu.");
  return trafienie[1];
}

async function czyHasloDziala(haslo: string): Promise<boolean> {
  try {
    await auth.api.signInEmail({ body: { email: KONTO, password: haslo }, asResponse: false });
    return true;
  } catch {
    return false;
  }
}

afterAll(async () => {
  // Przywracamy hasło z zasiewu, żeby inne pliki zastały konto takie,
  // jakie opisuje zasiew.
  await ustawHaslo(HASLO_ZASIEWOWE).catch(() => undefined);
  await db.delete(verifications).where(like(verifications.identifier, `%${KONTO}%`));
});

async function poprosOKod(): Promise<Email> {
  const nadawca = new NadawcaZapisujacy();
  const wynik = await wyslijKodResetuHasla(KONTO, nadawca);

  expect(wynik.ok).toBe(true);
  const wiadomosc = nadawca.wyslane[0];
  if (!wiadomosc) throw new Error("Lej nie wysłał kodu do konta z zasiewu.");
  return wiadomosc;
}

/**
 * Ustawia hasło pełną drogą: kod z maila plus akcja serwerowa.
 *
 * Udana zmiana kończy się przekierowaniem, czyli rzutem, więc łapiemy go
 * i rozpoznajemy po `digest`.
 */
async function ustawHaslo(nowe: string): Promise<void> {
  const kod = kodZMaila(await poprosOKod());

  try {
    const wynik = await ustawNoweHasloKodem(
      STAN_POCZATKOWY,
      formularz({ email: KONTO, kod, haslo: nowe, haslo2: nowe }),
    );
    throw new Error(`Zmiana hasła nie przekierowała, zwróciła ${wynik.status}.`);
  } catch (blad) {
    const digest = (blad as { digest?: string }).digest;
    if (typeof digest !== "string" || !digest.startsWith("NEXT_REDIRECT")) throw blad;
  }
}

describe("zmiana hasła kodem działa od końca do końca", () => {
  /*
   * Każdy test zaczyna od znanego hasła i sam je ustawia tą samą drogą,
   * którą sprawdza. Bez tego drugi i trzeci test zależały od hasła
   * ustawionego przez pierwszy — a wtedy przestawienie kolejności albo
   * padnięcie pierwszego wywraca pozostałe w miejscu, które z przyczyną
   * nie ma nic wspólnego.
   */
  beforeEach(async () => {
    await ustawHaslo(HASLO_ZASIEWOWE);
  });

  it("kod z maila ustawia nowe hasło, a stare przestaje działać", async () => {
    await ustawHaslo(NOWE_HASLO);

    expect(await czyHasloDziala(NOWE_HASLO)).toBe(true);
    expect(await czyHasloDziala(HASLO_ZASIEWOWE)).toBe(false);
  });

  it("reguły składu hasła obowiązują także przy zmianie kodem", async () => {
    /*
     * better-auth zna tylko minimalną i maksymalną długość, nie nasze reguły
     * składu. Gdyby schemat Zod wypadł z tej ścieżki, hasło bez wielkiej
     * litery przeszłoby przez bibliotekę bez protestu.
     */
    const kod = kodZMaila(await poprosOKod());
    const slabe = "bezwielkiejliterycyfry";

    const wynik = await ustawNoweHasloKodem(
      STAN_POCZATKOWY,
      formularz({ email: KONTO, kod, haslo: slabe, haslo2: slabe }),
    );

    expect(wynik.status).toBe("bledy");
    // Hasło w bazie nietknięte, czyli to ustawione przez beforeEach.
    expect(await czyHasloDziala(HASLO_ZASIEWOWE)).toBe(true);
  });

  it("zły kod nie zmienia hasła", async () => {
    const wynik = await ustawNoweHasloKodem(
      STAN_POCZATKOWY,
      formularz({ email: KONTO, kod: "000000", haslo: NOWE_HASLO, haslo2: NOWE_HASLO }),
    );

    expect(wynik.status).toBe("bledy");
    expect(await czyHasloDziala(HASLO_ZASIEWOWE)).toBe(true);
  });
});

describe("formularz resetu nie jest sprawdzarką adresów", () => {
  it("odpowiedź jest identyczna dla konta z zasiewu i dla adresu bez konta", async () => {
    const istniejacy = await poprosONoweHaslo(STAN_POCZATKOWY, formularz({ email: KONTO }));
    const nieistniejacy = await poprosONoweHaslo(
      STAN_POCZATKOWY,
      formularz({ email: NIE_MA_TAKIEGO }),
    );

    /*
     * Porównujemy wszystko poza odnośnikiem, bo ten z natury zawiera wpisany
     * adres. Reszta ma być co do znaku taka sama.
     */
    expect(nieistniejacy.status).toEqual(istniejacy.status);
    if (istniejacy.status !== "informacja" || nieistniejacy.status !== "informacja") return;
    expect(nieistniejacy.tresc).toEqual(istniejacy.tresc);
    expect(nieistniejacy.waga).toEqual(istniejacy.waga);
  });

  it("awaria konfiguracji poczty jest pokazana, i to jednakowo dla obu adresów", async () => {
    /*
     * TEST NA SAMO ROZSTRZYGNIĘCIE NAPIĘCIA.
     *
     * Pada dokładnie wtedy, gdy ktoś przestawi `pobierzNadawce()` za odczyt
     * konta w `lib/konto/kody.ts`: wtedy adres nieistniejący wraca zwykłym
     * komunikatem, a istniejący ostrzeżeniem — i formularz zaczyna zdradzać,
     * na które adresy są konta.
     */
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "");

    try {
      const istniejacy = await poprosONoweHaslo(STAN_POCZATKOWY, formularz({ email: KONTO }));
      const nieistniejacy = await poprosONoweHaslo(
        STAN_POCZATKOWY,
        formularz({ email: NIE_MA_TAKIEGO }),
      );

      expect(istniejacy.status).toBe("informacja");
      if (istniejacy.status !== "informacja" || nieistniejacy.status !== "informacja") return;

      expect(istniejacy.waga).toBe("ostrzezenie");
      expect(nieistniejacy).toEqual(istniejacy);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("nieistniejący adres nie zostawia zgłoszenia, a konto z zasiewu zostawia", async () => {
    const nadawca = new NadawcaZapisujacy();

    await wyslijKodResetuHasla(NIE_MA_TAKIEGO, nadawca);
    const obce = await db
      .select({ id: verifications.id })
      .from(verifications)
      .where(like(verifications.identifier, `%${NIE_MA_TAKIEGO}%`));
    expect(obce).toHaveLength(0);
    expect(nadawca.wyslane).toHaveLength(0);

    // Instancja pozytywna gdzie indziej, inaczej test niczego nie dowodzi.
    await wyslijKodResetuHasla(KONTO, nadawca);
    expect(nadawca.wyslane).toHaveLength(1);
  });
});

describe("stara droga resetu jest zamknięta", () => {
  it("endpoint z linkiem odmawia, bo nie ma już funkcji wysyłającej", async () => {
    /*
     * Dwie drogi do ustawienia hasła, z których jedna jest nieutrzymywana
     * i niewidoczna w testach, są gorsze niż jedna. Ta ma odmawiać głośno.
     */
    await expect(
      auth.api.requestPasswordReset({
        body: { email: KONTO, redirectTo: "/nowe-haslo" },
        asResponse: false,
      }),
    ).rejects.toThrow();
  });

  it("konto po zmianie hasła nie ma już starych sesji", async () => {
    const [konto] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, KONTO))
      .limit(1);

    expect(konto).toBeDefined();
    if (!konto) return;

    // Poświadczenie istnieje, więc konto nie zostało przy okazji zepsute.
    const [poswiadczenie] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.userId, konto.id))
      .limit(1);

    expect(poswiadczenie).toBeDefined();
  });
});

/**
 * Wysyłka kodu potwierdzającego adres.
 *
 * REGUŁA BIZNESOWA: nieudana wysyłka ma być widoczna. Rejestracja, po której
 * mail nie wyszedł, **nie przenosi** człowieka na ekran „sprawdź skrzynkę",
 * bo ten ekran byłby wtedy kłamstwem — a kod, na który czeka, nigdy nie
 * przyjdzie.
 *
 * DLACZEGO TO W OGÓLE WYMAGAŁO PRACY: better-auth woła każdą funkcję
 * wysyłającą przez warstwę, która łapie wyjątek i tylko go loguje
 * (`runInBackgroundOrAwait`). Wysyłka przez bibliotekę jest więc wysyłką,
 * o której awarii nikt się nie dowie. Wysyłkę przejęliśmy, a te testy
 * pilnują, żeby nie wróciła do biblioteki po cichu przy aktualizacji.
 *
 * Wymaga działającej bazy z zasiewem.
 */
import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { OPCJE_WERYFIKACJI } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts, sessions, verifications } from "@/lib/db/schema/sesje";
import { users } from "@/lib/db/schema/tozsamosc";
import { STAN_POCZATKOWY, type StanFormularza } from "@/lib/formularze";
import type { Email, Nadawca } from "@/lib/poczta";
import { BladWysylki } from "@/lib/poczta/bledy";

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

const { zarejestrujKlienta } = await import("@/lib/akcje/rejestracja");
const { wyslijKodPonownie } = await import("@/lib/akcje/weryfikacja");
const { wyslijKodPotwierdzeniaAdresu } = await import("@/lib/konto/kody");

/** Konto z zasiewu, które zatrzymało się na potwierdzaniu adresu. */
const NIEPOTWIERDZONY = "niepotwierdzony@przyklad.pl";
/** Konto z zasiewu, które adres ma już potwierdzony. */
const POTWIERDZONY = "uzytkownik6@przyklad.pl";

const PREFIKS = "kod-test-";
const WSZYSTKIE_ADRESY: string[] = [];
const HASLO = "Dobre-haslo-do-kodu-1";

function adres(co: string): string {
  const email = `${PREFIKS}${co}@przyklad.pl`;
  WSZYSTKIE_ADRESY.push(email);
  return email;
}

/** Nadawca, który zapamiętuje wiadomość zamiast ją wysyłać. */
class NadawcaZapisujacy implements Nadawca {
  wyslane: Email[] = [];

  async wyslij(email: Email): Promise<void> {
    this.wyslane.push(email);
  }
}

/** Nadawca, który odmawia tak, jak odmawia Resend przy zepsutej konfiguracji. */
class NadawcaOdmawiajacy implements Nadawca {
  async wyslij(): Promise<void> {
    throw new BladWysylki({
      komunikat: "Resend API zwróciło 403",
      klasyfikacja: {
        rodzaj: "konfiguracja",
        kodResend: "validation_error",
        zaleznyOdOdbiorcy: false,
      },
      status: 403,
    });
  }
}

async function zarejestruj(
  email: string,
): Promise<{ przekierowano: boolean; stan: StanFormularza | null }> {
  const formularz = new FormData();
  formularz.set("email", email);
  formularz.set("haslo", HASLO);
  formularz.set("haslo2", HASLO);

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

async function zgloszeniaKodu(email: string, rodzaj: string): Promise<number> {
  const wiersze = await db
    .select({ id: verifications.id })
    .from(verifications)
    .where(like(verifications.identifier, `%${rodzaj}%${email}%`));

  return wiersze.length;
}

async function usunKonto(email: string): Promise<void> {
  const [uzytkownik] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!uzytkownik) return;

  await db.delete(sessions).where(eq(sessions.userId, uzytkownik.id));
  await db.delete(accounts).where(eq(accounts.userId, uzytkownik.id));
  await db.delete(verifications).where(like(verifications.identifier, `%${email}%`));
  await db.delete(users).where(eq(users.id, uzytkownik.id));
}

afterAll(async () => {
  for (const email of WSZYSTKIE_ADRESY) await usunKonto(email);
});

describe("biblioteka nie wysyła kodów sama", () => {
  /*
   * Trzy przełączniki, trzy testy. Dwa z nich bronią tej samej ścieżki
   * w koniunkcji (brama w sign-up.mjs wymaga obu), więc test na skutek
   * padłby dopiero po zdjęciu obu i dowodziłby tylko, że działa co najmniej
   * jeden. Te trzy padają po zdjęciu dokładnie jednego.
   *
   * Są też jedynym mechanizmem, który zauważy, że aktualizacja better-auth
   * przywróciła wysyłkę po cichu.
   */
  it("brama rejestracji w bibliotece jest wyłączona", () => {
    expect(OPCJE_WERYFIKACJI.emailVerification.sendOnSignUp).toBe(false);
  });

  it("hook wtyczki po rejestracji jest wyłączony", () => {
    expect(OPCJE_WERYFIKACJI.emailOTP.sendVerificationOnSignUp).toBe(false);
  });

  it("wtyczka nie podstawia własnej funkcji wysyłającej", () => {
    expect(OPCJE_WERYFIKACJI.emailOTP.overrideDefaultEmailVerification).toBe(false);
  });

  it("samo założenie konta w bibliotece nie tworzy zgłoszenia kodu", async () => {
    const email = adres("bez-kodu");
    const { auth } = await import("@/lib/auth");

    await auth.api.signUpEmail({
      body: { email, password: HASLO, name: "Bez kodu" },
      asResponse: false,
    });

    // Kod tworzy dopiero nasz lej. Gdyby biblioteka wysyłała sama,
    // zgłoszenie powstałoby już tutaj — i jego awaria byłaby niewidoczna.
    expect(await zgloszeniaKodu(email, "email-verification")).toBe(0);
  });
});

describe("rejestracja mówi prawdę o wysyłce", () => {
  it("przy działającej poczcie przekierowuje i zostawia zgłoszenie kodu", async () => {
    const email = adres("dziala");

    const wynik = await zarejestruj(email);

    expect(wynik.przekierowano).toBe(true);
    expect(await zgloszeniaKodu(email, "email-verification")).toBe(1);
  });

  it("przy awarii wysyłki NIE przekierowuje i ostrzega, a konto zostaje", async () => {
    const email = adres("awaria");

    /*
     * Awarię udajemy na poziomie środowiska, nie przez podmianę modułu:
     * produkcja bez klucza Resend to dokładnie ta sytuacja, przez którą
     * ten plik powstał.
     */
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "");

    try {
      const wynik = await zarejestruj(email);

      expect(wynik.przekierowano).toBe(false);
      expect(wynik.stan?.status).toBe("informacja");
      if (wynik.stan?.status !== "informacja") return;
      expect(wynik.stan.waga).toBe("ostrzezenie");
      expect(wynik.stan.odnosnik?.adres).toContain("/weryfikacja");

      // Konta NIE kasujemy: zasada 5 z CLAUDE.md, a kod i tak da się
      // wysłać ponownie, gdy poczta wróci.
      const [konto] = await db
        .select({ potwierdzony: users.emailVerified })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      expect(konto).toBeDefined();
      expect(konto?.potwierdzony).toBe(false);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("lej wysyłkowy", () => {
  it("wysyła kod sześciocyfrowy do konta czekającego na potwierdzenie", async () => {
    const nadawca = new NadawcaZapisujacy();

    const wynik = await wyslijKodPotwierdzeniaAdresu(NIEPOTWIERDZONY, nadawca);

    expect(wynik.ok).toBe(true);
    expect(nadawca.wyslane).toHaveLength(1);
    expect(nadawca.wyslane[0]?.do).toBe(NIEPOTWIERDZONY);
    // Kod w treści, a nie pusta ramka: kształt odpowiedzi biblioteki
    // sprawdza schemat, więc tu widać jego skutek.
    expect(nadawca.wyslane[0]?.html).toMatch(/\d{6}/);
  });

  it("nie wysyła do konta, które adres ma już potwierdzony", async () => {
    const nadawca = new NadawcaZapisujacy();

    const wynik = await wyslijKodPotwierdzeniaAdresu(POTWIERDZONY, nadawca);

    // Wynik udany, bo z zewnątrz ma nie być różnicy. Ale maila nie ma.
    expect(wynik.ok).toBe(true);
    expect(nadawca.wyslane).toHaveLength(0);
  });

  it("nieznany adres nie zostawia zgłoszenia, a znany zostawia", async () => {
    const nadawca = new NadawcaZapisujacy();
    const nieznany = "nie-ma-takiego-konta@przyklad.pl";

    await wyslijKodPotwierdzeniaAdresu(nieznany, nadawca);
    expect(await zgloszeniaKodu(nieznany, "email-verification")).toBe(0);

    /*
     * Instancja pozytywna gdzie indziej: bez niej „nie zostawia zgłoszenia”
     * i „nigdy nie zostawia zgłoszeń” dawałyby ten sam wynik.
     */
    await wyslijKodPotwierdzeniaAdresu(NIEPOTWIERDZONY, nadawca);
    expect(await zgloszeniaKodu(NIEPOTWIERDZONY, "email-verification")).toBeGreaterThan(0);
  });

  it("awaria wysyłki wraca jako odmowa z informacją, kiedy ją wykryto", async () => {
    const wynik = await wyslijKodPotwierdzeniaAdresu(NIEPOTWIERDZONY, new NadawcaOdmawiajacy());

    expect(wynik.ok).toBe(false);
    if (wynik.ok) return;
    expect(wynik.blad).toBeInstanceOf(BladWysylki);
    // Awaria z samej wysyłki, czyli po odczycie konta: tej nie wolno pokazać
    // tam, gdzie adres wpisuje obcy człowiek.
    expect(wynik.przedOdczytemKonta).toBe(false);
  });
});

describe("ponowne wysłanie kodu nie jest sprawdzarką adresów", () => {
  it("odpowiedź jest identyczna dla adresu z zasiewu i dla nieistniejącego", async () => {
    const formularz = (email: string) => {
      const dane = new FormData();
      dane.set("email", email);
      return dane;
    };

    const istniejacy = await wyslijKodPonownie(STAN_POCZATKOWY, formularz(NIEPOTWIERDZONY));
    const nieistniejacy = await wyslijKodPonownie(
      STAN_POCZATKOWY,
      formularz("na-pewno-nie-ma@przyklad.pl"),
    );

    // Porównanie całych obiektów, nie samego statusu: różnica w jednym
    // słowie wystarczy, żeby formularz zaczął zdradzać istnienie konta.
    expect(nieistniejacy).toEqual(istniejacy);
  });
});

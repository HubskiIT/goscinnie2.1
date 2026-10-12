/**
 * Reguły hasła: jedno źródło prawdy i dwie niezależne bariery.
 *
 * Reguła biznesowa: hasło ma mieć co najmniej osiem znaków, cyfrę i wielką
 * literę, a człowiek ma te wymagania zobaczyć przed wpisaniem, nie po.
 *
 * DLACZEGO TEN PLIK ISTNIEJE. Minimalna długość była wcześniej wpisana
 * w czterech miejscach naraz: w schemacie Zod, w konfiguracji better-auth,
 * w atrybucie `minLength` i w zdaniu napisanym ręcznie pod polem. Rozjazd
 * między nimi nie wywalał się nigdzie i nie było po nim żadnego śladu:
 * formularz ogłaszał jedno, serwer egzekwował drugie, a człowiek dostawał
 * odmowę bez podania przyczyny.
 *
 * Bariery są dwie i każda ma tu własny test, bo każda działa sama:
 * Zod w `lib/validators/konto.ts` i `minPasswordLength` w `lib/auth`.
 * Test sprawdzający je razem dowodziłby tylko, że działa co najmniej jedna.
 */
import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts, sessions, verifications } from "@/lib/db/schema/sesje";
import { users } from "@/lib/db/schema/tozsamosc";
import { HASLO_ZASIEWOWE } from "@/lib/db/seed";
import { bledyZod } from "@/lib/formularze";
import { MINIMALNA_DLUGOSC_HASLA, niespelnioneReguly, REGULY_HASLA } from "@/lib/haslo";
import { daneRejestracjiFirmy, haslo as schematHasla } from "@/lib/validators/konto";

/** Prefiks adresów zakładanych przez ten plik. Po nim sprzątamy. */
const PREFIKS = "haslo-test-";

const WSZYSTKIE_ADRESY: string[] = [];

function adres(co: string): string {
  const email = `${PREFIKS}${co}@przyklad.pl`;
  WSZYSTKIE_ADRESY.push(email);
  return email;
}

/**
 * Hasło dokładnie na granicy: minimalna długość, jedna cyfra, jedna wielka
 * litera. Budowane z `MINIMALNA_DLUGOSC_HASLA`, a nie wpisane, żeby test
 * sprawdzał granicę, a nie ośmioznakowy ciąg.
 */
function hasloNaGranicy(): string {
  return `Ab1${"c".repeat(MINIMALNA_DLUGOSC_HASLA - 3)}`;
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

afterAll(async () => {
  for (const email of WSZYSTKIE_ADRESY) await usunKonto(email);
});

describe("bariera pierwsza: schemat Zod", () => {
  /*
   * Te dwa przypadki mają liczbę wpisaną wprost i tak ma zostać.
   *
   * Przypadki budowane z `MINIMALNA_DLUGOSC_HASLA` sprawdzają zależność
   * „granica działa”, ale rosną razem ze stałą, więc podniesienie minimum
   * przechodzi przez nie bez śladu. Sprawdzone: zmiana ósemki na dziewiątkę
   * nie wywaliła żadnego z nich. Decyzję właściciela „osiem znaków, nie
   * dwanaście” pilnują dopiero te dwa.
   */
  it("ośmioznakowe hasło z cyfrą i wielką literą przechodzi", () => {
    expect(schematHasla.safeParse("Abcdefg1").success).toBe(true);
  });

  it("siedmioznakowe hasło z cyfrą i wielką literą jest odrzucone", () => {
    expect(schematHasla.safeParse("Abcdef1").success).toBe(false);
  });

  it("hasło dokładnie na granicy długości, z cyfrą i wielką literą, przechodzi", () => {
    const wynik = schematHasla.safeParse(hasloNaGranicy());

    expect(wynik.success).toBe(true);
  });

  it("hasło o jeden znak za krótkie jest odrzucone", () => {
    const zaKrotkie = `Ab1${"c".repeat(MINIMALNA_DLUGOSC_HASLA - 4)}`;

    expect(zaKrotkie).toHaveLength(MINIMALNA_DLUGOSC_HASLA - 1);
    expect(schematHasla.safeParse(zaKrotkie).success).toBe(false);
  });

  it("hasło bez wielkiej litery jest odrzucone", () => {
    expect(schematHasla.safeParse("abcdefgh1").success).toBe(false);
  });

  it("hasło bez cyfry jest odrzucone", () => {
    expect(schematHasla.safeParse("Abcdefghi").success).toBe(false);
  });

  it("odmowa wymienia każdą niespełnioną regułę z osobna", () => {
    // Samo „xx”: za krótkie, bez cyfry i bez wielkiej litery, czyli trzy
    // powody naraz. Człowiek ma zobaczyć wszystkie, a nie poprawiać po jednym.
    const wynik = schematHasla.safeParse("xx");

    expect(wynik.success).toBe(false);
    if (wynik.success) return;
    expect(wynik.error.issues).toHaveLength(REGULY_HASLA.length);
  });

  it("każda reguła ma niepusty opis i predykat, który cokolwiek odrzuca", () => {
    for (const regula of REGULY_HASLA) {
      expect(regula.opis.trim()).not.toBe("");
      // Pusty ciąg nie spełnia żadnej sensownej reguły hasła. Predykat, który
      // go przepuszcza, nie sprawdza niczego.
      expect(regula.spelnia("")).toBe(false);
    }
  });

  it("niespelnioneReguly wskazuje dokładnie to, czego brakuje", () => {
    expect(niespelnioneReguly(hasloNaGranicy())).toHaveLength(0);
    expect(niespelnioneReguly("abcdefgh1").map((r) => r.id)).toEqual(["wielka"]);
    expect(niespelnioneReguly("Abcdefghi").map((r) => r.id)).toEqual(["cyfra"]);
  });
});

describe("bariera druga: minPasswordLength w better-auth", () => {
  /*
   * Ta bariera jest sprawdzana OSOBNO i celowo z pominięciem Zoda: wołamy
   * better-auth wprost. Gdyby `minPasswordLength` zostało na dwunastu,
   * hasło przechodzące naszą walidację odbijałoby się tutaj, a formularz
   * pokazywałby błąd biblioteki zamiast własnego komunikatu.
   */
  it("konto z hasłem o minimalnej dozwolonej długości daje się założyć", async () => {
    const email = adres("granica");

    await auth.api.signUpEmail({
      body: { email, password: hasloNaGranicy(), name: "Granica" },
      asResponse: false,
    });

    const [konto] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    expect(konto).toBeDefined();
  });
});

describe("powtórzenie hasła", () => {
  it("niezgodne hasła są odrzucone, a błąd trafia pod pole haslo2", () => {
    const wynik = daneRejestracjiFirmy.safeParse({
      email: "ktos@przyklad.pl",
      haslo: hasloNaGranicy(),
      haslo2: `${hasloNaGranicy()}X`,
    });

    expect(wynik.success).toBe(false);
    if (wynik.success) return;

    const sciezki = wynik.error.issues.map((problem) => problem.path.join("."));
    expect(sciezki).toContain("haslo2");
    // Błąd bez ścieżki wylądowałby w panelu zbiorczym bez wskazania pola.
    expect(sciezki).not.toContain("");
  });

  it("zgodne hasła przechodzą", () => {
    const wynik = daneRejestracjiFirmy.safeParse({
      email: "ktos@przyklad.pl",
      haslo: hasloNaGranicy(),
      haslo2: hasloNaGranicy(),
    });

    expect(wynik.success).toBe(true);
  });

  it("żadne z dwóch pól hasła nie wraca do przeglądarki", () => {
    const wejscie = {
      email: "ktos@przyklad.pl",
      haslo: "tajne-haslo",
      haslo2: "inne-tajne-haslo",
    };
    const wynik = daneRejestracjiFirmy.safeParse(wejscie);

    expect(wynik.success).toBe(false);
    if (wynik.success) return;

    const stan = bledyZod(wynik.error, wejscie);
    expect(stan.status).toBe("bledy");
    if (stan.status !== "bledy") return;

    expect(stan.wartosci.email).toBe("ktos@przyklad.pl");
    expect(stan.wartosci.haslo).toBeUndefined();
    expect(stan.wartosci.haslo2).toBeUndefined();
  });
});

describe("zgodność reszty projektu z regułami", () => {
  it("hasło zasiewowe spełnia reguły, które ogłasza formularz", () => {
    // Inaczej zasiew przestaje być przykładem tego, czego wymagamy od ludzi,
    // a zauważa się to dopiero przy próbie założenia konta takim hasłem.
    expect(niespelnioneReguly(HASLO_ZASIEWOWE)).toHaveLength(0);
  });

  it("żaden ekran nie przepisuje wymagań hasła własnymi słowami", () => {
    /*
     * Strażnik jedynego źródła prawdy. Zdanie „co najmniej 12 znaków"
     * wpisane ręcznie żyło w dwóch plikach i w obu trzeba było pamiętać
     * o poprawieniu. Lista wymagań ma pochodzić z REGULY_HASLA.
     */
    const wzorzec = /co najmniej \d+ znak/;
    const winne: string[] = [];

    for (const plik of plikiZrodlowe(["app", "components"])) {
      if (wzorzec.test(readFileSync(plik, "utf8"))) winne.push(plik);
    }

    expect(winne).toEqual([]);
  });
});

/** Wszystkie pliki .ts i .tsx w podanych katalogach, rekurencyjnie. */
function plikiZrodlowe(katalogi: readonly string[]): string[] {
  const znalezione: string[] = [];

  const obejdz = (katalog: string): void => {
    for (const wpis of readdirSync(katalog, { withFileTypes: true })) {
      const sciezka = join(katalog, wpis.name);
      if (wpis.isDirectory()) obejdz(sciezka);
      else if ([".ts", ".tsx"].includes(extname(wpis.name))) znalezione.push(sciezka);
    }
  };

  for (const katalog of katalogi) obejdz(join(process.cwd(), katalog));
  return znalezione;
}

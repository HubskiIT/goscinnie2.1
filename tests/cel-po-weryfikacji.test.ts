/**
 * Dokąd trafia człowiek po potwierdzeniu adresu kodem z maila.
 *
 * Reguła biznesowa: firma wraca do kreatora, klient ląduje na swoim ekranie.
 * Wcześniej była tu jedna stała prowadząca zawsze do kreatora, więc klient
 * po potwierdzeniu adresu dostawał ekran „Dodaj swoją firmę do katalogu".
 *
 * Rozstrzyga `users.role`, nadawana przy zakładaniu konta. Ta kolumna jest
 * **wyłącznie podpowiedzią nawigacyjną**: nie nadaje uprawnień i nie mówi,
 * w czyim imieniu ktoś działa. Ostatni test w tym pliku pilnuje, żeby nikt
 * nie zaczął jej traktować inaczej.
 */
import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { czlonkostwoUzytkownika } from "@/lib/auth/firma";
import { db } from "@/lib/db";
import { oznaczKontoJakoFirmowe, rolaKonta } from "@/lib/db/queries/konto";
import { accounts, sessions, verifications } from "@/lib/db/schema/sesje";
import { users } from "@/lib/db/schema/tozsamosc";
import { STAN_POCZATKOWY } from "@/lib/formularze";
import { NiezaimplementowanaGalazUprawnien, type Widz } from "@/lib/permissions";
import { KREATOR_KROK_2, TRASY, trasaPoWeryfikacji } from "@/lib/trasy";

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

const { zarejestrujFirme, zarejestrujKlienta } = await import("@/lib/akcje/rejestracja");

const ANONIM: Widz = { rodzaj: "anonim" };
const MODERATOR: Widz = { rodzaj: "moderator", userId: "11111111-1111-4111-8111-111111111111" };

/** Konto firmowe z zasiewu, które nie zdążyło założyć firmy. */
const FIRMA_BEZ_PROFILU = "firma-bez-profilu@przyklad.pl";
/** Konto firmowe z zasiewu, które firmę ma. */
const FIRMA_Z_PROFILEM = "uzytkownik1@przyklad.pl";

const PREFIKS = "cel-test-";
const WSZYSTKIE_ADRESY: string[] = [];

const HASLO = "Dobre-haslo-do-testu-1";

function adres(co: string): string {
  const email = `${PREFIKS}${co}@przyklad.pl`;
  WSZYSTKIE_ADRESY.push(email);
  return email;
}

async function zarejestruj(
  akcja: (poprzedni: typeof STAN_POCZATKOWY, dane: FormData) => Promise<unknown>,
  email: string,
): Promise<void> {
  const formularz = new FormData();
  formularz.set("email", email);
  formularz.set("haslo", HASLO);
  formularz.set("haslo2", HASLO);

  try {
    await akcja(STAN_POCZATKOWY, formularz);
  } catch (blad) {
    const digest = (blad as { digest?: string }).digest;
    // Udana rejestracja kończy się przekierowaniem, czyli rzutem.
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) return;
    throw blad;
  }
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

describe("trasa po weryfikacji zależy od roli", () => {
  it("konto firmowe wraca do kreatora", () => {
    expect(trasaPoWeryfikacji("company_owner")).toBe(KREATOR_KROK_2);
  });

  it("konto klienta idzie na swój ekran", () => {
    expect(trasaPoWeryfikacji("client")).toBe(TRASY.moje);
  });

  it("nieznana rola i brak odczytu prowadzą na ekran klienta, nie do kreatora", () => {
    // Kierunek pomyłki ma znaczenie: /moje niczego nie odsłania i niczego
    // nie zaczyna, a kreator wyglądałby jak polecenie założenia firmy.
    expect(trasaPoWeryfikacji("moderator")).toBe(TRASY.moje);
    expect(trasaPoWeryfikacji(null)).toBe(TRASY.moje);
  });
});

describe("rola zapisywana przy zakładaniu konta", () => {
  it("rejestracja firmy oznacza konto jako firmowe", async () => {
    const email = adres("firma");

    await zarejestruj(zarejestrujFirme, email);

    expect(await rolaKonta(ANONIM, email)).toBe("company_owner");
  });

  it("rejestracja klienta zostawia rolę klienta", async () => {
    const email = adres("klient");

    await zarejestruj(zarejestrujKlienta, email);

    expect(await rolaKonta(ANONIM, email)).toBe("client");
  });

  it("oznaczenie nie rusza konta, które jest już potwierdzone", async () => {
    /*
     * Zawężenie `where` do konta niepotwierdzonego jest tym, co nie pozwala
     * ruszyć cudzego konta znajomością jego identyfikatora. Bierzemy konto
     * z zasiewu, bo ono jest potwierdzone od początku.
     */
    const [klientZZasiewu] = await db
      .select({ id: users.id, rola: users.role })
      .from(users)
      .where(eq(users.email, "uzytkownik6@przyklad.pl"))
      .limit(1);

    expect(klientZZasiewu?.rola).toBe("client");
    if (!klientZZasiewu) return;

    const zmienione = await oznaczKontoJakoFirmowe(ANONIM, klientZZasiewu.id);

    expect(zmienione).toBe(0);
    expect(await rolaKonta(ANONIM, "uzytkownik6@przyklad.pl")).toBe("client");
  });
});

describe("zapytania o konto trzymają konwencję", () => {
  it("odmawiają widzowi, którego gałąź uprawnień nie istnieje", async () => {
    await expect(rolaKonta(MODERATOR, FIRMA_Z_PROFILEM)).rejects.toBeInstanceOf(
      NiezaimplementowanaGalazUprawnien,
    );
    await expect(
      oznaczKontoJakoFirmowe(MODERATOR, "11111111-1111-4111-8111-111111111111"),
    ).rejects.toBeInstanceOf(NiezaimplementowanaGalazUprawnien);
  });
});

describe("rola nie zastępuje członkostwa", () => {
  it("konto firmowe z zasiewu bez firmy nie ma członkostwa, a mimo to ma rolę firmy", async () => {
    /*
     * To jest sedno rozdziału pojęć: rola mówi, po co ktoś przyszedł,
     * a członkostwo mówi, w czyim imieniu działa. Konto z kreatora
     * zatrzymanego na pierwszym kroku ma pierwsze i nie ma drugiego.
     */
    const [konto] = await db
      .select({ id: users.id, rola: users.role })
      .from(users)
      .where(eq(users.email, FIRMA_BEZ_PROFILU))
      .limit(1);

    expect(konto?.rola).toBe("company_owner");
    if (!konto) return;

    expect(await czlonkostwoUzytkownika(konto.id)).toBeNull();
  });

  it("konto firmowe z zasiewu z firmą członkostwo ma", async () => {
    // Instancja pozytywna gdzie indziej: bez niej „nie ma członkostwa”
    // i „nikt nie ma członkostwa” dawałyby ten sam wynik.
    const [konto] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, FIRMA_Z_PROFILEM))
      .limit(1);

    expect(konto).toBeDefined();
    if (!konto) return;

    expect(await czlonkostwoUzytkownika(konto.id)).not.toBeNull();
  });
});

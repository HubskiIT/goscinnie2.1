/**
 * Testy sesji i tego, co widać po zalogowaniu.
 *
 * To jest ten sam wyciek co przy anonimie, tylko trudniejszy: żądanie ma
 * poprawną sesję, więc nie da się go odsiać na wejściu. Odpowiedź musi zależeć
 * od tego, czy pytający jest autorem tego konkretnego zlecenia.
 *
 * Testy strzelają do handlerów endpointów i patrzą na treść odpowiedzi API.
 * Wymagają działającej bazy: pnpm db:up && pnpm db:reset.
 */
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { GET as pobierzJedno } from "@/app/api/zlecenia/[id]/route";
import { auth } from "@/lib/auth";
import { widzWKontekscieZlecenia } from "@/lib/auth/widz";
import { db } from "@/lib/db";
import { requests } from "@/lib/db/schema/gielda";
import { accounts } from "@/lib/db/schema/sesje";
import type { Widz } from "@/lib/permissions";

const HASLO = "bardzo-dlugie-haslo-testowe";

type Konto = { userId: string; ciasteczko: string };

/** Zakłada konto przez prawdziwy endpoint rejestracji i zwraca ciasteczko sesji. */
async function zalozKonto(email: string, imie: string): Promise<Konto> {
  const odpowiedz = await auth.api.signUpEmail({
    body: { email, password: HASLO, name: imie },
    returnHeaders: true,
  });

  const ciasteczko = odpowiedz.headers.get("set-cookie");
  if (!ciasteczko) throw new Error(`Rejestracja ${email} nie zwróciła ciasteczka sesji.`);

  return { userId: odpowiedz.response.user.id, ciasteczko };
}

function zadanieZSesja(sciezka: string, ciasteczko: string | null): Request {
  const naglowki = new Headers();
  if (ciasteczko) naglowki.set("cookie", ciasteczko);
  return new Request(`http://localhost:3000${sciezka}`, { headers: naglowki });
}

async function pobierzZlecenieJako(id: string, ciasteczko: string | null) {
  const odpowiedz = await pobierzJedno(zadanieZSesja(`/api/zlecenia/${id}`, ciasteczko), {
    params: Promise.resolve({ id }),
  });
  return { status: odpowiedz.status, tekst: await odpowiedz.text() };
}

let autor: Konto;
let obcyKlient: Konto;
let idZlecenia: string;

/** Opis i budżet, których szukamy w odpowiedziach. Muszą być rozpoznawalne. */
const OPIS = "Ogród u babci, wjazd od strony sadu, prąd z garażu.";
const BUDZET_MIN = 777100;
const BUDZET_MAX = 999300;

beforeAll(async () => {
  const znacznik = Date.now();
  autor = await zalozKonto(`autor-${znacznik}@przyklad.pl`, "Autor Testowy");
  obcyKlient = await zalozKonto(`obcy-${znacznik}@przyklad.pl`, "Obcy Klient");

  // Bierzemy dowolne otwarte zlecenie z zasiewu i przepisujemy je na autora,
  // żeby nie duplikować logiki wstawiania zlecenia w teście.
  const [wzorzec] = await db
    .select({ id: requests.id })
    .from(requests)
    .where(eq(requests.status, "open"))
    .limit(1);

  if (!wzorzec) throw new Error("Brak otwartego zlecenia w zasiewie.");
  idZlecenia = wzorzec.id;

  await db
    .update(requests)
    .set({
      authorUserId: autor.userId,
      description: OPIS,
      budgetMin: BUDZET_MIN,
      budgetMax: BUDZET_MAX,
    })
    .where(eq(requests.id, idZlecenia));
});

describe("rejestracja i sesja", () => {
  it("rejestracja zakłada konto i zwraca ciasteczko sesji", () => {
    expect(autor.userId).toBeTruthy();
    expect(autor.ciasteczko).toContain("HttpOnly");
  });

  it("ciasteczko sesji ma SameSite=Lax", () => {
    expect(autor.ciasteczko.toLowerCase()).toContain("samesite=lax");
  });

  it("w bazie leży skrót argon2id, a nie hasło i nie scrypt", async () => {
    const [konto] = await db
      .select({ skrot: accounts.password })
      .from(accounts)
      .where(eq(accounts.userId, autor.userId))
      .limit(1);

    expect(konto?.skrot).toBeTruthy();
    // Skrót argon2id zaczyna się od tego przedrostka. Domyślny scrypt
    // z better-auth wyglądałby zupełnie inaczej, więc ten test pilnuje,
    // że nasza konfiguracja hashowania naprawdę weszła w życie.
    expect(konto?.skrot).toContain("$argon2id$");
    expect(konto?.skrot).not.toContain(HASLO);
  });
});

describe("limity prób logowania", () => {
  /**
   * Każdy test dostaje własny adres IP i własne konto, bo licznik żyje w bazie
   * i przeżywa koniec testu. Bez tego drugie uruchomienie zestawu w tym samym
   * kwadransie zaczynałoby z wyczerpanym limitem.
   */
  async function probujZalogowac(email: string, ip: string, haslo = "zle-haslo-zupelnie") {
    try {
      await auth.api.signInEmail({
        body: { email, password: haslo },
        headers: new Headers({ "x-forwarded-for": ip }),
      });
      return { status: 200 };
    } catch (blad) {
      const status = (blad as { status?: string | number }).status;
      return { status };
    }
  }

  it("po limicie prób do jednego konta logowanie jest blokowane", async () => {
    const znacznik = Date.now();
    const email = `limit-konto-${znacznik}@przyklad.pl`;
    const ip = `198.51.100.${znacznik % 200}`;

    // LIMIT_PO_KONCIE to pięć prób w oknie. Szósta ma zostać odrzucona.
    const wyniki = [];
    for (let i = 0; i < 6; i += 1) {
      wyniki.push(await probujZalogowac(email, ip));
    }

    const ostatni = wyniki[5];
    expect(String(ostatni?.status)).toMatch(/429|TOO_MANY_REQUESTS/);
  });

  it("limit po koncie działa niezależnie od adresu IP", async () => {
    // Atak rozproszony: każde żądanie z innego adresu, wciąż jedno konto.
    // Sam limit po IP by tego nie złapał.
    const znacznik = Date.now() + 1;
    const email = `limit-rozproszony-${znacznik}@przyklad.pl`;

    const wyniki = [];
    for (let i = 0; i < 6; i += 1) {
      wyniki.push(await probujZalogowac(email, `203.0.113.${i + 1}`));
    }

    expect(String(wyniki[5]?.status)).toMatch(/429|TOO_MANY_REQUESTS/);
  });

  it("blokada nie zdradza, czy konto istnieje", async () => {
    const znacznik = Date.now() + 2;
    const nieistniejace = `nie-ma-takiego-${znacznik}@przyklad.pl`;
    const ip = `192.0.2.${znacznik % 200}`;

    const wyniki = [];
    for (let i = 0; i < 6; i += 1) {
      wyniki.push(await probujZalogowac(nieistniejace, ip));
    }

    // Nieistniejące konto dostaje dokładnie to samo co istniejące: najpierw
    // odmowę logowania, potem blokadę. Różnica w zachowaniu byłaby darmową
    // wyszukiwarką zarejestrowanych adresów.
    expect(String(wyniki[5]?.status)).toMatch(/429|TOO_MANY_REQUESTS/);
  });
});

/**
 * Autorstwo nie znika przez członkostwo w firmie.
 *
 * Klasa błędu: człowiek, któremu coś zabrano przez zmianę niezwiązaną z nim.
 * Właściciel sali bywa jednocześnie klientem, bo organizuje komunię córki.
 * Pierwsza wersja podnosiła do autora wyłącznie widza rozpoznanego jako klient,
 * więc taki człowiek przestawał widzieć własny opis i budżet w chwili, w której
 * dopisano go do jakiejkolwiek firmy.
 *
 * Błąd był niewidoczny, dopóki zasiew nie dał tej samej osobie konta klienta
 * i członkostwa w firmie. To jest dokładnie ten rodzaj usterki, którego nie
 * znajdzie się przez czytanie kodu.
 */
describe("autorstwo nie znika przez członkostwo w firmie", () => {
  it("widz rozpoznany jako firma jest autorem własnego zlecenia", () => {
    const firmowy: Widz = {
      rodzaj: "firma",
      userId: "u-7",
      companyId: "f-1",
      abonament: true,
    };

    expect(widzWKontekscieZlecenia(firmowy, "u-7")).toEqual({ rodzaj: "autor", userId: "u-7" });
  });

  it("widz rozpoznany jako klient nadal jest autorem własnego zlecenia", () => {
    const klient: Widz = { rodzaj: "klient", userId: "u-8" };
    expect(widzWKontekscieZlecenia(klient, "u-8")).toEqual({ rodzaj: "autor", userId: "u-8" });
  });

  it("cudze zlecenie nie podnosi nikogo do autora", () => {
    const firmowy: Widz = {
      rodzaj: "firma",
      userId: "u-7",
      companyId: "f-1",
      abonament: true,
    };
    expect(widzWKontekscieZlecenia(firmowy, "ktos-inny")).toEqual(firmowy);
  });

  it("anonim nie staje się autorem nigdy", () => {
    const anonim: Widz = { rodzaj: "anonim" };
    expect(widzWKontekscieZlecenia(anonim, "cokolwiek")).toEqual(anonim);
  });
});

describe("reguła: autor widzi swoje, obcy nie widzi nic ponad jawne", () => {
  it("autor dostaje własny opis i budżet", async () => {
    const { status, tekst } = await pobierzZlecenieJako(idZlecenia, autor.ciasteczko);

    expect(status).toBe(200);
    expect(tekst).toContain(OPIS);
    expect(tekst).toContain(String(BUDZET_MIN));
    expect(tekst).toContain(String(BUDZET_MAX));

    const dane = JSON.parse(tekst);
    expect(dane.zakres).toBe("autor");
    // Liczbę ofert widzi wyłącznie autor.
    expect(dane.zlecenie).toHaveProperty("liczbaOfert");
  });

  it("zalogowany klient, który nie jest autorem, nie widzi opisu ani budżetu", async () => {
    const { status, tekst } = await pobierzZlecenieJako(idZlecenia, obcyKlient.ciasteczko);

    expect(status).toBe(200);
    expect(tekst).not.toContain(OPIS);
    expect(tekst).not.toContain(String(BUDZET_MIN));
    expect(tekst).not.toContain(String(BUDZET_MAX));

    const dane = JSON.parse(tekst);
    expect(dane.zakres).toBe("jawny");
    for (const pole of ["opis", "description", "budzetMin", "budzetMax", "liczbaOfert"]) {
      expect(Object.keys(dane.zlecenie)).not.toContain(pole);
    }
  });

  it("anonim widzi dokładnie tyle co zalogowany obcy klient", async () => {
    const anonim = await pobierzZlecenieJako(idZlecenia, null);
    const obcy = await pobierzZlecenieJako(idZlecenia, obcyKlient.ciasteczko);

    expect(anonim.status).toBe(200);
    expect(JSON.parse(anonim.tekst)).toEqual(JSON.parse(obcy.tekst));
  });

  it("podrobione ciasteczko sesji nie podnosi widza do autora", async () => {
    const podrobione = autor.ciasteczko.replace(/=([^;]+)/, "=podrobionywartosc123");
    const { tekst } = await pobierzZlecenieJako(idZlecenia, podrobione);

    expect(tekst).not.toContain(OPIS);
    expect(JSON.parse(tekst).zakres).toBe("jawny");
  });
});

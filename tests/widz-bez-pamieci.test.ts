/**
 * Deduplikacja widza kończy się wraz z żądaniem.
 *
 * `widzZZadania` jest owinięte w `cache()` z Reacta, bo layout panelu i strona
 * pod nim ustalają widza osobno i bez tego jedno wejście na `/panel` liczyło
 * jedenaście zapytań tożsamościowych zamiast sześciu.
 *
 * To jest dokładnie ta zmiana, która potrafi po cichu złamać model przychodowy.
 * `maAktywnyAbonament` z lib/auth/firma.ts rozstrzyga abonament porównaniem
 * daty **przy tym** żądaniu i komentarz przy niej mówi wprost, dlaczego: stan
 * zapamiętany gdziekolwiek dalej zostawia firmę z dostępem, za który nie płaci,
 * i nikt się o tym nie dowie. Pamięć między żądaniami wyglądałaby w kodzie
 * identycznie jak `cache()`, a różnicę widać wyłącznie wtedy, gdy stan bazy
 * zmieni się między dwoma pytaniami.
 *
 * Dlatego ten plik zadaje to samo pytanie dwa razy i zmienia bazę pomiędzy.
 * Zastąpienie `cache()` własną mapą po ciasteczku albo po identyfikatorze
 * użytkownika przechodzi każdy inny test w tym repozytorium i pada tutaj.
 *
 * Firma jest **z zasiewu**, nie z tego testu: z zasiewu korzystamy przy każdej
 * pracy ręcznej, a test budujący stan własną ścieżką jest ślepy na jego błędy.
 *
 * Wymaga bazy z danymi: pnpm db:reset.
 */
import { and, eq, gt, inArray, notExists, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { widzZZadania } from "@/lib/auth/widz";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema/abonament";
import { companyMembers } from "@/lib/db/schema/katalog";
import { rateLimits } from "@/lib/db/schema/sesje";
import { users } from "@/lib/db/schema/tozsamosc";
import { HASLO_ZASIEWOWE } from "@/lib/db/seed";

type Abonent = { userId: string; email: string };

/**
 * Członek firmy, która **w tej chwili** ma opłacony abonament.
 *
 * Oba warunki, nie tylko status: pozostałe pliki zestawu przestawiają daty
 * wygaśnięcia i przywracają je po sobie, więc firma ze statusem `active`
 * i datą w przeszłości jest w tej bazie normalnym stanem. Wybór po samym
 * statusie dawał test padający raz na dwa pełne przebiegi, i to nie z powodu
 * zmiany, której pilnuje.
 *
 * Szukamy zapytaniem, a nie po wpisanym slugu, żeby test nie zgadł firmy,
 * której zasiew akurat abonamentu nie dał.
 */
async function abonentZZasiewu(): Promise<Abonent> {
  const [wiersz] = await db
    .select({ userId: users.id, email: users.email })
    .from(subscriptions)
    .innerJoin(companyMembers, eq(companyMembers.companyId, subscriptions.companyId))
    .innerJoin(users, eq(users.id, companyMembers.userId))
    .where(
      and(
        eq(subscriptions.status, "active"),
        gt(subscriptions.expiresAt, sql`now()`),
        eq(users.emailVerified, true),
      ),
    )
    .limit(1);

  if (!wiersz) throw new Error("Zasiew nie dał żadnej firmy z opłaconym abonamentem.");
  return wiersz;
}

/**
 * Cofa datę wygaśnięcia **wszystkich** ważnych abonamentów firm, do których
 * należy ten człowiek, i zwraca sposób przywrócenia poprzednich dat.
 *
 * Wszystkich, nie jednej firmy: `czlonkostwoUzytkownika` wybiera za człowieka
 * firmę z aktywnym abonamentem, więc dopóki została mu choć jedna, widz nadal
 * ma abonament i test nie dowodziłby niczego.
 *
 * Cofamy datę, nie kasujemy wiersza i nie ruszamy statusu. O stanie
 * rozstrzygają dwa warunki naraz, a zasiew ustawia oba na „tak”, więc test,
 * który przestawiłby status, dowodziłby czegoś o statusie, a nie o dacie
 * liczonej przy żądaniu. Zasada 5 i tak zabrania kasowania.
 */
async function wygasAbonamentyCzlonka(userId: string): Promise<() => Promise<void>> {
  const firmy = db
    .select({ companyId: companyMembers.companyId })
    .from(companyMembers)
    .where(eq(companyMembers.userId, userId));

  const wczoraj = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const przed = await db
    .update(subscriptions)
    .set({ expiresAt: wczoraj })
    .where(
      and(
        inArray(subscriptions.companyId, firmy),
        eq(subscriptions.status, "active"),
        gt(subscriptions.expiresAt, sql`now()`),
      ),
    )
    .returning({ id: subscriptions.id });

  // Daty sprzed zmiany odczytane po niej byłyby już te nowe, więc datę
  // przywracamy z zapasem: dla tego zestawu liczy się tylko to, że firma
  // znów ma abonament ważny, a nie co do sekundy do kiedy.
  const zaRok = new Date();
  zaRok.setFullYear(zaRok.getFullYear() + 1);

  return async () => {
    for (const wiersz of przed) {
      await db
        .update(subscriptions)
        .set({ expiresAt: zaRok })
        .where(eq(subscriptions.id, wiersz.id));
    }
  };
}

/**
 * Limity prób logowania obowiązują też testy, a licznik przeżywa kolejne
 * uruchomienia zestawu. Okno przesuwamy w przeszłość, zamiast kasować wiersz:
 * tak wygląda wygaśnięcie okna naprawdę, a zasada 5 i tak zabrania kasowania.
 */
async function przesunOknoLimitu(email: string): Promise<void> {
  const godzineTemu = new Date(Date.now() - 60 * 60 * 1000);
  await db
    .update(rateLimits)
    .set({ windowStart: godzineTemu })
    .where(eq(rateLimits.key, `logowanie:konto:${email.toLowerCase()}`));
}

/** Ciasteczko sesji tą samą drogą co człowiek: przez logowanie. */
async function ciasteczkoSesji(email: string): Promise<string> {
  await przesunOknoLimitu(email);

  const logowanie = await auth.api.signInEmail({
    body: { email, password: HASLO_ZASIEWOWE },
    returnHeaders: true,
    // Własny adres na wywołanie, żeby wspólny licznik po IP nie zliczał
    // wszystkich testów w tym pliku do jednej puli.
    headers: new Headers({ "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200)}` }),
  });

  const ciasteczko = logowanie.headers.get("set-cookie");
  if (!ciasteczko) throw new Error(`Logowanie ${email} nie zwróciło ciasteczka.`);
  return ciasteczko;
}

/** Nowy obiekt nagłówków, czyli to, co dostaje każde kolejne żądanie. */
function naglowkiZadania(ciasteczko: string): Headers {
  return new Headers({ cookie: ciasteczko });
}

const przywrocenia: (() => Promise<void>)[] = [];

afterAll(async () => {
  for (const przywroc of przywrocenia) await przywroc();
});

describe("widz ustalany na nowo w każdym żądaniu", () => {
  it("wygaśnięcie abonamentu między żądaniami jest widoczne w następnym", async () => {
    const { userId, email } = await abonentZZasiewu();
    const ciasteczko = await ciasteczkoSesji(email);

    const przed = await widzZZadania(naglowkiZadania(ciasteczko));
    expect(przed.rodzaj).toBe("firma");
    if (przed.rodzaj !== "firma") return;
    expect(przed.abonament).toBe(true);

    przywrocenia.push(await wygasAbonamentyCzlonka(userId));

    const po = await widzZZadania(naglowkiZadania(ciasteczko));
    expect(po.rodzaj).toBe("firma");
    if (po.rodzaj !== "firma") return;
    expect(po.abonament).toBe(false);
  });

  it("dwa różne konta dają dwóch różnych widzów", async () => {
    /*
     * Instancja pozytywna obok negatywnej: gdyby deduplikacja trzymała
     * jeden wynik na proces, drugie konto dostałoby tożsamość pierwszego,
     * a to jest poważniejszy błąd niż nieaktualny abonament.
     */
    const { email: mailFirmy } = await abonentZZasiewu();

    /*
     * Konto bez **żadnego** członkostwa, nie samo `role = 'client'`.
     * Zasiew celowo daje tej samej osobie rolę klienta i członkostwo w firmie
     * (właściciel sali organizujący komunię córki), a o rodzaju widza
     * rozstrzyga `company_members`, nie kolumna `role`. Pierwsza wersja tego
     * testu brała pierwszego klienta z bazy i dostawała widza firmowego.
     */
    const [klient] = await db
      .select({ email: users.email })
      .from(users)
      .where(
        and(
          eq(users.emailVerified, true),
          notExists(
            db
              .select({ jeden: sql`1` })
              .from(companyMembers)
              .where(eq(companyMembers.userId, users.id)),
          ),
        ),
      )
      .limit(1);

    if (!klient) throw new Error("Zasiew nie dał żadnego konta bez członkostwa w firmie.");

    const widzFirmy = await widzZZadania(naglowkiZadania(await ciasteczkoSesji(mailFirmy)));
    const widzKlienta = await widzZZadania(naglowkiZadania(await ciasteczkoSesji(klient.email)));

    expect(widzFirmy.rodzaj).toBe("firma");
    expect(widzKlienta.rodzaj).toBe("klient");
  });

  it("brak ciasteczka to anonim", async () => {
    expect(await widzZZadania(new Headers())).toEqual({ rodzaj: "anonim" });
  });
});

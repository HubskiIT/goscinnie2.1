/**
 * Ustalenie kontekstu firmowego: do jakiej firmy należy ten człowiek
 * i czy ta firma ma **w tej chwili** aktywny abonament.
 *
 * DLACZEGO TO NIE LEŻY W lib/db/queries/
 *
 * Konwencja tamtego katalogu mówi, że każde zapytanie przyjmuje widza jako
 * pierwszy argument. Te funkcje są wywoływane właśnie po to, żeby widza dopiero
 * ustalić, więc nie mają go skąd wziąć. Tak samo jak odczyt sesji, należą do
 * warstwy rozpoznania tożsamości, nie do warstwy danych.
 *
 * DLACZEGO STAN, A NIE PŁATNOŚĆ
 *
 * Warstwa uprawnień pyta wyłącznie o stan: aktywny czy nie. Skąd ten stan się
 * wziął, czy z przelewu, z faktury, z okresu próbnego, czy z ręcznego wpisu
 * przy stoisku na targach, jest jej całkowicie obojętne. Gdyby uprawnienia
 * pytały o płatność, każda zmiana w rozliczeniach ruszałaby regułę „co kto widzi”.
 */
import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema/abonament";
import { companyMembers } from "@/lib/db/schema/katalog";

/**
 * Czy firma ma aktywny abonament **w momencie zadania pytania**.
 *
 * Dwa warunki, oba konieczne:
 *
 *   status = 'active'      ktoś nie odwołał abonamentu
 *   expires_at > now()     okres jeszcze nie minął
 *
 * Porównanie daty dzieje się tutaj, przy każdym żądaniu, a **nie** w zadaniu
 * cyklicznym przestawiającym status. Zadanie cykliczne, które nie zadziała,
 * zostawia firmę z dostępem, za który nie płaci, i nikt się o tym nie dowie,
 * dopóki ktoś nie porówna tabel ręcznie. Porównanie daty przy żądaniu nie ma
 * jak nie zadziałać.
 *
 * `now()` liczy baza, nie Node. Zegar aplikacji potrafi się rozjechać
 * z zegarem bazy, a wtedy moment wygaśnięcia zależałby od tego, który proces
 * obsłużył żądanie.
 */
export async function maAktywnyAbonament(companyId: string): Promise<boolean> {
  const wiersze = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.companyId, companyId),
        eq(subscriptions.status, "active"),
        gt(subscriptions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return wiersze.length > 0;
}

export type CzlonkostwoFirmowe = {
  companyId: string;
  abonament: boolean;
};

/**
 * Firma, w kontekście której działa ten użytkownik.
 *
 * Człowiek może należeć do kilku firm: prowadzi salę i dorabia jako fotograf.
 * Przełącznika firm w panelu jeszcze nie ma, więc wybieramy za niego. Kolejność:
 *
 *   1. firma z aktywnym abonamentem
 *   2. firma, w której jest właścicielem
 *   3. najstarsze członkostwo
 *   4. identyfikator, wyłącznie jako rozstrzygnięcie remisu
 *
 * Punkt pierwszy nie jest kosmetyką. Przy samym „najstarsze członkostwo”
 * właściciel firmy z opłaconym abonamentem, dopisany wcześniej do firmy kolegi,
 * dostawał zajawkę zamiast pełnego opisu. Płacił i nie widział, za co.
 * Wyszło to dopiero przy ręcznym przejściu ścieżki curlem, bo testy budowały
 * widza wprost i omijały tę funkcję.
 *
 * Bezpieczeństwa to nie narusza: każda z tych firm jest firmą, do której ten
 * człowiek należy, a abonament dotyczy tej właśnie wybranej.
 *
 * Punkt czwarty jest konieczny, bo członkostwa wstawione jednym poleceniem mają
 * identyczny `created_at`. Bez niego ta sama osoba widziałaby raz jedno, raz
 * drugie, a nikt by tego nie odtworzył ze zgłoszenia błędu.
 *
 * Zwraca `null`, gdy człowiek nie należy do żadnej firmy. Wtedy jest zwykłym
 * klientem i widzi tyle co anonim.
 */
export async function czlonkostwoUzytkownika(userId: string): Promise<CzlonkostwoFirmowe | null> {
  const czlonkostwa = await db
    .select({
      companyId: companyMembers.companyId,
      role: companyMembers.role,
      createdAt: companyMembers.createdAt,
      id: companyMembers.id,
    })
    .from(companyMembers)
    .where(eq(companyMembers.userId, userId))
    .orderBy(asc(companyMembers.createdAt), asc(companyMembers.id));

  if (czlonkostwa.length === 0) return null;

  /*
   * Aktywność każdej firmy sprawdzamy tą samą funkcją, której używa reszta
   * systemu, zamiast powtarzać jej warunki w podzapytaniu.
   *
   * Pierwsza wersja miała tu `exists` wpisane ręcznie w szablonie SQL. Nie
   * skorelowało się z wierszem członkostwa i zwracało prawdę, gdy jakakolwiek
   * firma w bazie miała abonament. Każdy użytkownik firmowy dostawał pełny
   * zakres. Jedno zapytanie na członkostwo jest wolniejsze o tyle, ile ich jest,
   * czyli o dwa, a nie ma jak się rozjechać z regułą.
   */
  const wiersze = await Promise.all(
    czlonkostwa.map(async (czlonkostwo) => ({
      ...czlonkostwo,
      abonament: await maAktywnyAbonament(czlonkostwo.companyId),
    })),
  );

  // Sortowanie w kodzie, nie w SQL: kryteria są tu czytelniejsze niż
  // wielopoziomowy ORDER BY z CASE, a członkostw jest garść, nie tysiące.
  const posortowane = [...wiersze].sort((a, b) => {
    if (a.abonament !== b.abonament) return a.abonament ? -1 : 1;
    const wlascicielA = a.role === "owner";
    const wlascicielB = b.role === "owner";
    if (wlascicielA !== wlascicielB) return wlascicielA ? -1 : 1;
    const poDacie = a.createdAt.getTime() - b.createdAt.getTime();
    if (poDacie !== 0) return poDacie;
    return a.id.localeCompare(b.id);
  });

  const wybrane = posortowane[0];
  if (!wybrane) return null;

  return { companyId: wybrane.companyId, abonament: wybrane.abonament };
}

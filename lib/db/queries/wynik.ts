/**
 * Wynik zapisu w warstwie zapytań: udało się albo odmowa z powodem.
 *
 * Same typy, zero logiki. Wydzielone z `lib/db/queries/kreator.ts`, bo
 * potrzebuje ich też moduł zleceń, a import z modułu kreatora tylko po dwa
 * aliasy typów sugerowałby zależność, której nie ma.
 *
 * Dlaczego odmowa jest zwracana, a nie rzucana: odmowa uprawnień to zwykły,
 * przewidziany wynik, który front zamienia na ekran sprzedażowy albo na
 * komunikat. Wyjątki zostawiamy dla gałęzi uprawnień, której nikt jeszcze
 * nie napisał, czyli dla sytuacji, w której cisza byłaby groźna.
 */
import type { PowodOdmowy } from "@/lib/permissions";

export type Odmowa = { ok: false; powod: PowodOdmowy };
export type Wynik<T> = { ok: true; dane: T } | Odmowa;

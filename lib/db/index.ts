import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { leniwy } from "@/lib/leniwy";
import * as schema from "./schema";

/**
 * Czy łączymy się przez pulę połączeń w trybie transakcyjnym.
 *
 * Supabase i większość zarządzanych Postgresów wystawia dwa adresy: bezpośredni
 * (port 5432) i przez pulę (port 6543, pgBouncer w trybie transakcyjnym).
 * Na Vercelu trzeba użyć puli, bo każda funkcja bezserwerowa otwiera własne
 * połączenie i baza kończy się limity szybciej, niż zdąży się zorientować.
 *
 * Pula w trybie transakcyjnym **nie obsługuje instrukcji przygotowanych**:
 * połączenie wraca do puli po każdej transakcji, więc przygotowana instrukcja
 * przestaje istnieć, a kolejne żądanie dostaje błąd o nieznanym identyfikatorze.
 * Objawia się to losowymi awariami pod obciążeniem, nigdy przy pierwszym
 * uruchomieniu, czyli najgorzej jak się da.
 *
 * Wykrywamy to po porcie zamiast po osobnej zmiennej, bo jedna zmienna mniej
 * to jedna rzecz mniej do zapomnienia przy nowym środowisku.
 */
function przezPuleTransakcyjna(adres: string): boolean {
  try {
    return new URL(adres).port === "6543";
  } catch {
    return false;
  }
}

function polacz() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Brak DATABASE_URL. Lokalnie: cp .env.example do .env i pnpm db:up. " +
        "Na produkcji: ustaw tę zmienną w konfiguracji projektu, adresem puli " +
        "połączeń (u Supabase port 6543). Patrz docs/decyzje/007.",
    );
  }

  const client = postgres(url, {
    // Instrukcje przygotowane wyłączone za pulą. Poza nią zostają włączone,
    // bo lokalnie i przy migracjach nic ich nie psuje, a są szybsze.
    prepare: !przezPuleTransakcyjna(url),
    /*
     * Limit połączeń na jedną instancję funkcji.
     *
     * Domyślne dziesięć razy liczba instancji bezserwerowych to prosta droga
     * do wyczerpania limitu bazy. Przy puli po drugiej stronie jedno połączenie
     * na instancję w zupełności wystarcza.
     */
    max: przezPuleTransakcyjna(url) ? 1 : 10,
  });
  return drizzle(client, { schema, casing: "snake_case" });
}

/** Połączenie powstaje przy pierwszym użyciu, nie przy wczytaniu modułu. */
export const db = leniwy(polacz);
export { schema };

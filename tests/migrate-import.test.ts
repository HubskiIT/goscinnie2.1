/**
 * Import `scripts/migrate.ts` nie uruchamia migracji.
 *
 * Reguła wdrożeniowa: `scripts/vercel-build.ts` najpierw importuje runner,
 * a dopiero potem woła `wPrzod()`. Dopóki runner wykonywał migracje w ciele
 * modułu, cały zestaw szedł już przy imporcie, `finally` zamykał połączenie,
 * a jawne wywołanie linijkę dalej trafiało na zamkniętego klienta. Wdrożenie
 * kończyło się wtedy `CONNECTION_ENDED` **po** ostatniej udanej migracji,
 * czyli w logach wyglądało na awarię bazy, a było błędem kolejności.
 *
 * Czułość: zdejmij warunek `import.meta.url === ...` z końca `migrate.ts`
 * i ten test padnie. Adres bazy podstawiony niżej nie istnieje, więc import,
 * który spróbuje cokolwiek zrobić, wywróci się na połączeniu zamiast po cichu
 * ruszyć na prawdziwej bazie.
 */
import { afterAll, beforeAll, expect, test, vi } from "vitest";

const PIERWOTNY = process.env.DATABASE_URL_MIGRACJE;
const NIEISTNIEJACY = "postgres://nikt:nic@baza.nieistnieje.invalid:5432/nic";

beforeAll(() => {
  process.env.DATABASE_URL_MIGRACJE = NIEISTNIEJACY;
  vi.resetModules();
});

afterAll(() => {
  if (PIERWOTNY === undefined) {
    delete process.env.DATABASE_URL_MIGRACJE;
  } else {
    process.env.DATABASE_URL_MIGRACJE = PIERWOTNY;
  }
  vi.resetModules();
});

test("import runnera nie dotyka bazy i udostępnia wPrzod oraz zamknij", async () => {
  const runner = await import("../scripts/migrate");

  expect(typeof runner.wPrzod).toBe("function");
  expect(typeof runner.zamknij).toBe("function");

  // Klient nigdy się nie połączył, więc zamknięcie jest bezbolesne.
  // Robimy je mimo to, żeby nie zostawiać otwartego uchwytu po przebiegu.
  await runner.zamknij();
});

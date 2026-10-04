/**
 * Globalne przygotowanie bazy przed każdym uruchomieniem zestawu.
 *
 * Testy integracyjne dzielą jedną bazę i **zmieniają w niej dane**: zamykają
 * zlecenia, wycofują oferty, przepisują autorów. Po pełnym przebiegu baza nie
 * jest już tym, czym była na starcie, więc drugie uruchomienie bez zasiewu
 * zaczynało od innego stanu i padało w losowych miejscach.
 *
 * Próbowałem to załatać po stronie testów: jawne ustawianie liczników,
 * deterministyczne sortowanie, osobne zlecenia dla osobnych bloków. Każda z tych
 * poprawek była sensowna sama w sobie i żadna nie wystarczyła, bo problem nie
 * leży w pojedynczym teście, tylko w tym, że zestaw dziedziczy stan po sobie.
 *
 * To jest właściwe miejsce na rozwiązanie: każdy przebieg zaczyna od schematu
 * i zasiewu, dokładnie tak jak CI. Kosztuje kilka sekund i usuwa całą klasę
 * awarii, które wyglądają na przypadkowe.
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Liczba migracji liczona z katalogu, nie wpisana na sztywno.
 *
 * Wpisana liczba zestarzała się przy pierwszej nowej migracji: cofnięcie
 * zatrzymywało się w połowie, a zasiew wykładał się na duplikatach. Objaw
 * wyglądał na błąd testów, a był błędem w ich przygotowaniu.
 */
function ileMigracji(): number {
  return readdirSync(join(process.cwd(), "drizzle")).filter((p) => p.endsWith(".sql")).length;
}

export default function przygotujBaze(): void {
  const srodowisko = { ...process.env };

  if (!srodowisko.DATABASE_URL) {
    throw new Error("Brak DATABASE_URL. Testy integracyjne wymagają bazy: pnpm db:up, potem .env.");
  }

  const uruchom = (argumenty: string[]) =>
    execFileSync("pnpm", ["exec", "tsx", ...argumenty], {
      env: srodowisko,
      stdio: "pipe",
    });

  // Schemat w dół i z powrotem w górę: czyści wszystkie dane, nie tylko te,
  // o których pamiętamy. Cofnięcia i tak muszą działać, bo wymaga tego CI.
  uruchom(["scripts/migrate.ts", "down", String(ileMigracji())]);
  uruchom(["scripts/migrate.ts", "up"]);
  uruchom(["lib/db/seed.ts"]);
}

/**
 * Test odmowy zasiewu na produkcji w osobnym pliku.
 * 
 * Moduł lib/db/seed.ts w tests/slowniki.test.ts jest już załadowany
 * w beforeAll, więc vi.stubEnv tam nie działa. Ten test ładuje moduł
 * dopiero po ustawieniu NODE_ENV, więc odmowNaProdukcji() czyta
 * właściwą wartość.
 */
import { describe, expect, it, vi } from "vitest";

describe("zasiew pokazowy", () => {
  it("odmawia działania na produkcji", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { zasiej } = await import("@/lib/db/seed");
    await expect(zasiej()).rejects.toThrow(/nie działa na produkcji/);
    vi.unstubAllEnvs();
  });
});

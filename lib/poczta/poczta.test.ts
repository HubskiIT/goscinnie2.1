import { afterEach, describe, expect, it, vi } from "vitest";
import { pobierzNadawce } from "./index";

describe("nadawca poczty", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("na produkcji bez klucza Resend odmawia, zamiast pisać kody do konsoli", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "");
    await expect(pobierzNadawce()).rejects.toThrow(/RESEND_API_KEY/);
  });

  it("na produkcji z kluczem wybiera Resend", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "re_testowy");
    const nadawca = await pobierzNadawce();
    expect(nadawca.constructor.name).toBe("ResendNadawca");
  });

  it("poza produkcją pisze do konsoli, także bez klucza", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RESEND_API_KEY", "");
    const nadawca = await pobierzNadawce();
    expect(nadawca.constructor.name).toBe("KonsolaNadawca");
  });
});

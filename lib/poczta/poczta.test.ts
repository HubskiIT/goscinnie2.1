import { afterEach, describe, expect, it, vi } from "vitest";
import { KONTAKT_EMAIL } from "@/lib/serwis";
import { BladWysylki } from "./bledy";
import { domenaNadawcy, pobierzNadawce } from "./index";
import { DOMYSLNY_NADAWCA, ResendNadawca } from "./resend";

/** Odpowiedź Resend bez sieci. Szew `pobierz` w konstruktorze nadawcy. */
function odpowiedz(status: number, cialo: string): typeof fetch {
  return (async () =>
    new Response(cialo, {
      status,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;
}

describe("nadawca poczty", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("na produkcji bez klucza Resend odmawia, zamiast pisać kody do konsoli", async () => {
    await expect(pobierzNadawce({ NODE_ENV: "production", RESEND_API_KEY: "" })).rejects.toThrow(
      /RESEND_API_KEY/,
    );
  });

  it("odmowa z braku klucza jest naszą konfiguracją, więc wolno ją pokazać", async () => {
    /*
     * Rodzaj odmowy rozstrzyga, czy formularz może powiedzieć prawdę.
     * Gdyby to był goły Error, wywołujący musiałby zgadywać z treści.
     */
    const blad = await pobierzNadawce({ NODE_ENV: "production", RESEND_API_KEY: "" }).catch(
      (b: unknown) => b,
    );

    expect(blad).toBeInstanceOf(BladWysylki);
    expect((blad as BladWysylki).rodzaj).toBe("konfiguracja");
    expect((blad as BladWysylki).zaleznyOdOdbiorcy).toBe(false);
  });

  it("na produkcji z kluczem wybiera Resend", async () => {
    const nadawca = await pobierzNadawce({ NODE_ENV: "production", RESEND_API_KEY: "re_testowy" });
    expect(nadawca.constructor.name).toBe("ResendNadawca");
  });

  it("poza produkcją pisze do konsoli, także bez klucza", async () => {
    const nadawca = await pobierzNadawce({ NODE_ENV: "development", RESEND_API_KEY: "" });
    expect(nadawca.constructor.name).toBe("KonsolaNadawca");
  });

  it("czyta środowisko procesu, gdy nikt nie poda własnego", async () => {
    // Szew do testów nie może zmienić zachowania produkcyjnego.
    vi.stubEnv("NODE_ENV", "development");
    const nadawca = await pobierzNadawce();
    expect(nadawca.constructor.name).toBe("KonsolaNadawca");
  });
});

describe("adres nadawcy", () => {
  it("domyślny nadawca to adres kontaktowy serwisu", async () => {
    /*
     * Jeden adres do wysyłki i do odbierania odpowiedzi. Rozjazd między
     * nadawcą a adresem w stopce znaczy skrzynkę, do której ktoś pisze,
     * a nikt jej nie czyta.
     */
    expect(DOMYSLNY_NADAWCA).toContain(KONTAKT_EMAIL);
  });

  it("wysyła z domyślnego nadawcy, gdy zmienna jest pusta", async () => {
    let wyslane: unknown;
    const pobierz = (async (_adres: string, opcje: RequestInit) => {
      wyslane = JSON.parse(String(opcje.body));
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    await new ResendNadawca("re_testowy", undefined, pobierz).wyslij({
      do: "ktos@przyklad.pl",
      temat: "Temat",
      html: "<p>treść</p>",
    });

    expect((wyslane as { from: string }).from).toBe(DOMYSLNY_NADAWCA);
  });

  it("domena nadawcy wychodzi z obu zapisów adresu", () => {
    expect(domenaNadawcy("Gościnnie <kontakt@goscinnie.pl>")).toBe("goscinnie.pl");
    expect(domenaNadawcy("kontakt@goscinnie.pl")).toBe("goscinnie.pl");
    expect(domenaNadawcy("bez malpy")).toBeNull();
  });
});

describe("odmowy Resend docierają do wywołującego jako BladWysylki", () => {
  const email = { do: "ktos@przyklad.pl", temat: "Temat", html: "<p>treść</p>" };

  it("nie rzuca, gdy Resend przyjął wiadomość", async () => {
    const nadawca = new ResendNadawca("re_testowy", undefined, odpowiedz(200, '{"id":"abc"}'));

    await expect(nadawca.wyslij(email)).resolves.toBeUndefined();
  });

  it("niezweryfikowana domena wraca jako konfiguracja niezależna od odbiorcy", async () => {
    const cialo = JSON.stringify({
      name: "validation_error",
      message: "The goscinnie.pl domain is not verified.",
    });
    const nadawca = new ResendNadawca("re_testowy", undefined, odpowiedz(403, cialo));

    const blad = await nadawca.wyslij(email).catch((b: unknown) => b);

    expect(blad).toBeInstanceOf(BladWysylki);
    expect((blad as BladWysylki).rodzaj).toBe("konfiguracja");
    expect((blad as BladWysylki).zaleznyOdOdbiorcy).toBe(false);
    expect((blad as BladWysylki).status).toBe(403);
  });

  it("tryb testowy konta wraca jako odmowa zależna od odbiorcy", async () => {
    const cialo = JSON.stringify({
      name: "validation_error",
      message: "You can only send testing emails to your own email address (ktos@example.com).",
    });
    const nadawca = new ResendNadawca("re_testowy", undefined, odpowiedz(403, cialo));

    const blad = (await nadawca.wyslij(email).catch((b: unknown) => b)) as BladWysylki;

    expect(blad.zaleznyOdOdbiorcy).toBe(true);
  });

  it("surowa treść odpowiedzi zostaje w błędzie, do logu", async () => {
    const nadawca = new ResendNadawca(
      "re_testowy",
      undefined,
      odpowiedz(500, "coś poszło nie tak"),
    );

    const blad = (await nadawca.wyslij(email).catch((b: unknown) => b)) as BladWysylki;

    expect(blad.tresc).toBe("coś poszło nie tak");
  });
});

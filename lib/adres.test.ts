/**
 * Adres aplikacji dla sitemapy.
 *
 * Reguła, która ma tu własny test: **literówka w zmiennej środowiskowej nie
 * wywraca wdrożenia**. Wpisanie w panelu Vercela „domena.vercel.app" zamiast
 * „https://domena.vercel.app" kończyło się `TypeError: Invalid URL` przy
 * prerenderowaniu /sitemap.xml i zatrzymywało całe budowanie, a komunikat
 * wskazywał na kod sitemapy zamiast na zmienną, która była winna.
 */
import { describe, expect, it, vi } from "vitest";
import { adresAplikacji } from "./adres";

const LOKALNY = "http://localhost:3000";

describe("brakujący protokół", () => {
  it("uzupełnia https, gdy adres go nie ma", () => {
    // Dokładnie wartość, na której padło wdrożenie.
    expect(adresAplikacji({ APP_URL: "goscinnie2-1-m8j7.vercel.app" })).toBe(
      "https://goscinnie2-1-m8j7.vercel.app",
    );
  });

  it("adres z brakującym protokołem nadaje się potem dla new URL", () => {
    // To jest właściwa reguła: sitemapa składa adresy przez new URL(ścieżka, adres).
    const adres = adresAplikacji({ APP_URL: "goscinnie.pl" });
    expect(new URL("/lokale", adres).toString()).toBe("https://goscinnie.pl/lokale");
  });

  it("nie dokłada protokołu temu, kto go ma", () => {
    expect(adresAplikacji({ APP_URL: "https://goscinnie.pl" })).toBe("https://goscinnie.pl");
    expect(adresAplikacji({ APP_URL: "http://localhost:3000" })).toBe(LOKALNY);
  });
});

describe("skąd bierzemy adres", () => {
  it("APP_URL ma pierwszeństwo przed adresem wdrożenia", () => {
    const adres = adresAplikacji({
      APP_URL: "https://goscinnie.pl",
      VERCEL_URL: "podglad-xyz.vercel.app",
    });
    expect(adres).toBe("https://goscinnie.pl");
  });

  it("bez APP_URL bierze adres wdrożenia, który Vercel podaje bez protokołu", () => {
    expect(adresAplikacji({ VERCEL_URL: "podglad-xyz.vercel.app" })).toBe(
      "https://podglad-xyz.vercel.app",
    );
  });

  it("bez niczego schodzi na localhost, żeby praca lokalna nie wymagała konfiguracji", () => {
    expect(adresAplikacji({})).toBe(LOKALNY);
  });

  it("pusta zmienna liczy się jak brak zmiennej, a nie jak adres", () => {
    // Zmienna ustawiona na pusty ciąg to w panelu Vercela zwykła pomyłka.
    expect(adresAplikacji({ APP_URL: "" })).toBe(LOKALNY);
    expect(adresAplikacji({ APP_URL: "   " })).toBe(LOKALNY);
    expect(adresAplikacji({ APP_URL: "  ", VERCEL_URL: "podglad.vercel.app" })).toBe(
      "https://podglad.vercel.app",
    );
  });
});

describe("normalizacja", () => {
  it("ucina ścieżkę i końcowy ukośnik, żeby adresy nie dublowały separatora", () => {
    expect(adresAplikacji({ APP_URL: "https://goscinnie.pl/" })).toBe("https://goscinnie.pl");
    expect(adresAplikacji({ APP_URL: "https://goscinnie.pl/jakas/sciezka" })).toBe(
      "https://goscinnie.pl",
    );
  });

  it("zachowuje port", () => {
    expect(adresAplikacji({ APP_URL: "https://goscinnie.pl:8443" })).toBe(
      "https://goscinnie.pl:8443",
    );
  });

  it("obcina spacje z obu stron", () => {
    expect(adresAplikacji({ APP_URL: "  https://goscinnie.pl  " })).toBe("https://goscinnie.pl");
  });
});

describe("wartość nie do uratowania", () => {
  it("schodzi na localhost i mówi dlaczego, zamiast zatrzymywać budowanie", () => {
    const ostrzezenie = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      // Spacja w środku: po doklejeniu https:// nadal nie jest adresem.
      expect(adresAplikacji({ APP_URL: "to nie jest adres" })).toBe(LOKALNY);
      expect(ostrzezenie).toHaveBeenCalledOnce();
      // Komunikat ma nazwać zmienną, bo poprzedni wskazywał na kod sitemapy.
      expect(ostrzezenie.mock.calls[0]?.[0]).toContain("APP_URL");
    } finally {
      ostrzezenie.mockRestore();
    }
  });

  it("żadna wartość nie powoduje wyjątku", () => {
    const ostrzezenie = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      for (const wartosc of ["https://", "://", "\\", "a b c", "%", "https://[", ":"]) {
        expect(
          () => adresAplikacji({ APP_URL: wartosc }),
          `dla ${JSON.stringify(wartosc)}`,
        ).not.toThrow();
      }
    } finally {
      ostrzezenie.mockRestore();
    }
  });
});

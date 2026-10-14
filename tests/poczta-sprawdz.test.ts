/**
 * Polecenie `pnpm poczta:sprawdz`.
 *
 * Reguła, której pilnuje ten plik: polecenie ma mówić prawdę o tym, czy
 * wysyłka zadziała. Diagnoza, która odpowiada „wszystko gra" przy
 * niezweryfikowanej domenie, jest gorsza od braku diagnozy, bo odsyła
 * szukającego w złą stronę.
 */
import { describe, expect, it } from "vitest";
import { DOMYSLNY_NADAWCA } from "@/lib/poczta/resend";
import { type DomenaResend, ocenaPoczty, odpowiedzDomen, pobierzDomeny } from "@/scripts/poczta";

const NADAWCA = "Gościnnie <kontakt@goscinnie.pl>";

function domena(name: string, status: string): DomenaResend {
  return { id: "dom_1", name, status };
}

describe("ocena możliwości wysyłki", () => {
  it("zweryfikowana domena nadawcy znaczy wysyłkę na dowolny adres", () => {
    const wynik = ocenaPoczty(NADAWCA, [domena("goscinnie.pl", "verified")]);

    expect(wynik.mozna).toBe("dowolne");
    expect(wynik.domena).toBe("goscinnie.pl");
  });

  it("domena czekająca na weryfikację znaczy wysyłkę tylko do siebie", () => {
    /*
     * To jest stan, w którym serwis wygląda na działający, a obcy człowiek
     * nie dostanie kodu. Polecenie ma go nazwać wprost.
     */
    const wynik = ocenaPoczty(NADAWCA, [domena("goscinnie.pl", "pending")]);

    expect(wynik.mozna).toBe("tylko-wlasny");
    expect(wynik.powod).toContain("pending");
  });

  it("brak domeny w koncie Resend też znaczy wysyłkę tylko do siebie", () => {
    const wynik = ocenaPoczty(NADAWCA, [domena("zupelnie-inna.pl", "verified")]);

    expect(wynik.mozna).toBe("tylko-wlasny");
    expect(wynik.coZrobic).toContain("goscinnie.pl");
  });

  it("adres bez czytelnej domeny to brak wysyłki", () => {
    const wynik = ocenaPoczty("to nie jest adres", [domena("goscinnie.pl", "verified")]);

    expect(wynik.mozna).toBe("zadne");
    expect(wynik.domena).toBeNull();
  });

  it("domena podszywająca się pod naszą NIE uchodzi za zweryfikowaną", () => {
    /*
     * Dopasowanie przez `includes` uznałoby `goscinnie.pl.evil.com` za
     * `goscinnie.pl` i polecenie powiedziałoby, że wszystko gra.
     */
    const wynik = ocenaPoczty(NADAWCA, [domena("goscinnie.pl.evil.com", "verified")]);

    expect(wynik.mozna).toBe("tylko-wlasny");
  });

  it("stan domeny czytamy niezależnie od wielkości liter i spacji", () => {
    const wynik = ocenaPoczty(NADAWCA, [domena("  GOSCINNIE.PL  ", "Verified")]);

    expect(wynik.mozna).toBe("dowolne");
  });

  it("ocena domyślnego nadawcy szuka domeny z adresu kontaktowego", () => {
    // Pada razem z testem z lib/poczta, gdy ktoś zmieni KONTAKT_EMAIL
    // i zapomni o wpisach DNS dla nowej domeny.
    const wynik = ocenaPoczty(DOMYSLNY_NADAWCA, [domena("goscinnie.pl", "verified")]);

    expect(wynik.mozna).toBe("dowolne");
  });
});

describe("odpowiedź Resend jest granicą", () => {
  it("odpowiedź bez pola data jest odrzucana", () => {
    expect(odpowiedzDomen.safeParse({ cokolwiek: [] }).success).toBe(false);
  });

  it("wpis bez stanu domeny jest odrzucany", () => {
    const wynik = odpowiedzDomen.safeParse({ data: [{ id: "x", name: "goscinnie.pl" }] });

    expect(wynik.success).toBe(false);
  });

  it("pobieranie domen przepuszcza odmowę Resend, zamiast ją połykać", async () => {
    const pobierz = (async () => new Response("brak dostępu", { status: 401 })) as typeof fetch;

    await expect(pobierzDomeny("re_zly", pobierz)).rejects.toThrow(/401/);
  });

  it("pobieranie domen zwraca listę z poprawnej odpowiedzi", async () => {
    const cialo = JSON.stringify({
      data: [{ id: "dom_1", name: "goscinnie.pl", status: "verified", region: "eu-west-1" }],
    });
    const pobierz = (async () => new Response(cialo, { status: 200 })) as typeof fetch;

    const domeny = await pobierzDomeny("re_dobry", pobierz);

    expect(domeny).toHaveLength(1);
    expect(domeny[0]?.name).toBe("goscinnie.pl");
  });
});

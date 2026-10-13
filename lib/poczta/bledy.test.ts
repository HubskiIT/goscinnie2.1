/**
 * Klasyfikacja odmów Resend.
 *
 * Reguła, na której to stoi: komunikat wolno uzależnić wyłącznie od faktów
 * niezależnych od wpisanego adresu. Pole `zaleznyOdOdbiorcy` niesie tę
 * różnicę, więc jego wartość dla każdego rodzaju odmowy jest regułą
 * biznesową, nie szczegółem.
 *
 * Ciała odpowiedzi niżej są prawdziwe: pierwsze z nich przyszło
 * z produkcji 13 października 2026 i jest powodem, dla którego ten plik
 * powstał.
 */
import { describe, expect, it } from "vitest";
import { BladWysylki, sklasyfikujOdmowe, toNaszaKonfiguracja } from "./bledy";

/** Konto Resend bez zweryfikowanej domeny: wysyła tylko do właściciela konta. */
const TRYB_TESTOWY = JSON.stringify({
  statusCode: 403,
  name: "validation_error",
  message:
    "You can only send testing emails to your own email address (grzybowski.it@gmail.com). " +
    "To send emails to other recipients, please verify a domain at resend.com/domains",
});

/** Domena nadawcy niezweryfikowana. Dotyczy nas, nie odbiorcy. */
const DOMENA_NIEZWERYFIKOWANA = JSON.stringify({
  statusCode: 403,
  name: "validation_error",
  message: "The goscinnie.pl domain is not verified. Please verify your domain at resend.com",
});

const ZLY_KLUCZ = JSON.stringify({
  statusCode: 401,
  name: "missing_api_key",
  message: "Missing API key in the authorization header.",
});

const ZLY_ODBIORCA = JSON.stringify({
  statusCode: 422,
  name: "validation_error",
  message: "Invalid `to` field. The recipient address is not a valid email.",
});

const ZLY_NADAWCA = JSON.stringify({
  statusCode: 422,
  name: "validation_error",
  message: "Invalid `from` field. The sender address must use a verified domain.",
});

const LIMIT = JSON.stringify({
  statusCode: 429,
  name: "rate_limit_exceeded",
  message: "Too many requests. You can only make 2 requests per second.",
});

describe("rodzaj odmowy", () => {
  it("brak klucza to nasza konfiguracja", () => {
    const wynik = sklasyfikujOdmowe(401, ZLY_KLUCZ);

    expect(wynik.rodzaj).toBe("konfiguracja");
    expect(wynik.kodResend).toBe("missing_api_key");
  });

  it("niezweryfikowana domena nadawcy to nasza konfiguracja", () => {
    expect(sklasyfikujOdmowe(403, DOMENA_NIEZWERYFIKOWANA).rodzaj).toBe("konfiguracja");
  });

  it("limit żądań jest chwilowy, nie konfiguracyjny", () => {
    // Inaczej awaria na minutę wyglądałaby jak zepsuta konfiguracja
    // i ktoś zacząłby przestawiać zmienne, które są w porządku.
    expect(sklasyfikujOdmowe(429, LIMIT).rodzaj).toBe("chwilowy");
  });

  it("awaria po stronie Resend jest chwilowa", () => {
    expect(sklasyfikujOdmowe(503, "service unavailable").rodzaj).toBe("chwilowy");
  });

  it("zarzut wobec pola to dotyczy odbiorcy", () => {
    expect(sklasyfikujOdmowe(422, ZLY_ODBIORCA).rodzaj).toBe("adres");
  });

  it("zarzut wobec pola from dotyczy nas", () => {
    expect(sklasyfikujOdmowe(422, ZLY_NADAWCA).rodzaj).toBe("konfiguracja");
  });

  it("nierozpoznana odmowa zostaje nieznana, zamiast być zgadywana", () => {
    const wynik = sklasyfikujOdmowe(418, "<html>coś od pośrednika</html>");

    expect(wynik.rodzaj).toBe("nieznany");
    expect(wynik.kodResend).toBeNull();
  });
});

describe("czy odmowa zdradza cokolwiek o odbiorcy", () => {
  it("tryb testowy konta Resend ZDRADZA, bo pojawia się tylko dla obcych adresów", () => {
    /*
     * To jest najważniejszy przypadek w tym pliku. Odmowa „możesz pisać tylko
     * na własny adres" nie pojawia się przy wysyłce na adres właściciela konta,
     * więc jej pokazanie mówi, na jaki adres szła wiadomość. Przy formularzu,
     * w którym adres wpisuje obcy człowiek, to jest wyciek.
     */
    expect(sklasyfikujOdmowe(403, TRYB_TESTOWY).zaleznyOdOdbiorcy).toBe(true);
  });

  it("niezweryfikowana domena NIE zdradza niczego, bo dotyczy każdej wysyłki", () => {
    expect(sklasyfikujOdmowe(403, DOMENA_NIEZWERYFIKOWANA).zaleznyOdOdbiorcy).toBe(false);
  });

  it("brak klucza i limit nie zdradzają niczego", () => {
    expect(sklasyfikujOdmowe(401, ZLY_KLUCZ).zaleznyOdOdbiorcy).toBe(false);
    expect(sklasyfikujOdmowe(429, LIMIT).zaleznyOdOdbiorcy).toBe(false);
  });

  it("zarzut wobec odbiorcy zdradza, wobec nadawcy nie", () => {
    expect(sklasyfikujOdmowe(422, ZLY_ODBIORCA).zaleznyOdOdbiorcy).toBe(true);
    expect(sklasyfikujOdmowe(422, ZLY_NADAWCA).zaleznyOdOdbiorcy).toBe(false);
  });

  it("nierozpoznana odmowa domyślnie nie jest uznawana za bezpieczną do pokazania", () => {
    // Ostrożność w tę stronę kosztuje gorszy komunikat, w drugą kosztuje wyciek.
    expect(sklasyfikujOdmowe(418, "nie wiadomo co").zaleznyOdOdbiorcy).toBe(false);
  });
});

describe("toNaszaKonfiguracja", () => {
  it("przepuszcza wyłącznie awarie, które wolno pokazać przy dowolnym adresie", () => {
    const naszaDomena = new BladWysylki({
      komunikat: "x",
      klasyfikacja: sklasyfikujOdmowe(403, DOMENA_NIEZWERYFIKOWANA),
    });
    const trybTestowy = new BladWysylki({
      komunikat: "x",
      klasyfikacja: sklasyfikujOdmowe(403, TRYB_TESTOWY),
    });

    expect(toNaszaKonfiguracja(naszaDomena)).toBe(true);
    // Mimo że rodzaj jest ten sam, ten nie przechodzi — decyduje zależność od odbiorcy.
    expect(trybTestowy.rodzaj).toBe("konfiguracja");
    expect(toNaszaKonfiguracja(trybTestowy)).toBe(false);
  });
});

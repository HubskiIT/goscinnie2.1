/**
 * Interfejs nadawcy poczty. Lokalnie i w testach wysyła do konsoli,
 * na produkcji przez Resend.
 */

export interface Email {
  do: string;
  temat: string;
  html: string;
}

export interface Nadawca {
  wyslij(email: Email): Promise<void>;
}

/**
 * Brak klucza na produkcji to błąd, a nie powód, żeby pisać do konsoli.
 *
 * Wcześniej produkcja bez `RESEND_API_KEY` po cichu wracała do konsoli. Kod
 * potwierdzający adres trafiał wtedy do logów serwera zamiast do skrzynki,
 * rejestracja wyglądała na udaną, a nikt nie był w stanie jej dokończyć.
 * Głośny błąd przy pierwszej próbie wysyłki da się zauważyć od razu.
 */
export async function pobierzNadawce(): Promise<Nadawca> {
  if (process.env.NODE_ENV === "production") {
    const klucz = process.env.RESEND_API_KEY;
    if (!klucz) {
      throw new Error(
        "Brak RESEND_API_KEY na produkcji. Bez niego kody i linki z maili nie docierają " +
          "do ludzi. Ustaw zmienną w Vercel, patrz README.",
      );
    }
    const { ResendNadawca } = await import("./resend");
    return new ResendNadawca(klucz, process.env.POCZTA_NADAWCA);
  }

  const { KonsolaNadawca } = await import("./konsola");
  return new KonsolaNadawca();
}

/**
 * Interfejs nadawcy poczty. Lokalnie i w testach wysyła do konsoli,
 * na produkcji przez Resend.
 */
import { BladWysylki } from "./bledy";

export interface Email {
  do: string;
  temat: string;
  html: string;
}

export interface Nadawca {
  wyslij(email: Email): Promise<void>;
}

/**
 * Zmienne, z których czyta `pobierzNadawce`.
 *
 * Zapis przez `Partial<Record<…>>`, a nie `{ NODE_ENV?: string }`, bo typ
 * z samymi polami opcjonalnymi jest w TypeScripcie „słaby” i `process.env`
 * do niego nie pasuje. Ten sam zabieg co w `lib/adres.ts`.
 */
export type SrodowiskoPoczty = Readonly<
  Partial<Record<"NODE_ENV" | "RESEND_API_KEY" | "POCZTA_NADAWCA", string>>
>;

/**
 * Brak klucza na produkcji to błąd, a nie powód, żeby pisać do konsoli.
 *
 * Wcześniej produkcja bez `RESEND_API_KEY` po cichu wracała do konsoli. Kod
 * potwierdzający adres trafiał wtedy do logów serwera zamiast do skrzynki,
 * rejestracja wyglądała na udaną, a nikt nie był w stanie jej dokończyć.
 * Głośny błąd przy pierwszej próbie wysyłki da się zauważyć od razu.
 *
 * Rzuca `BladWysylki` rodzaju `konfiguracja`, a nie goły `Error`, bo
 * wywołujący rozstrzyga po rodzaju, czy wolno mu ten błąd pokazać.
 * Brak klucza nie zależy od tego, do kogo piszemy, więc wolno.
 *
 * Oba parametry są szwami do testów. W produkcji nikt ich nie podaje.
 */
export async function pobierzNadawce(
  srodowisko: SrodowiskoPoczty = process.env,
  pobierz: typeof fetch = globalThis.fetch,
): Promise<Nadawca> {
  if (srodowisko.NODE_ENV === "production") {
    const klucz = srodowisko.RESEND_API_KEY;
    if (!klucz) {
      throw new BladWysylki({
        komunikat:
          "Brak RESEND_API_KEY na produkcji. Bez niego kody i linki z maili nie docierają " +
          "do ludzi. Ustaw zmienną w Vercel, patrz README.",
        klasyfikacja: { rodzaj: "konfiguracja", kodResend: null, zaleznyOdOdbiorcy: false },
      });
    }
    const { ResendNadawca } = await import("./resend");
    return new ResendNadawca(klucz, srodowisko.POCZTA_NADAWCA, pobierz);
  }

  const { KonsolaNadawca } = await import("./konsola");
  return new KonsolaNadawca();
}

/**
 * Domena z adresu nadawcy, w obu zapisach: „Nazwa <adres@domena>” i „adres@domena”.
 *
 * `null`, gdy adresu nie da się odczytać. Używane przez `pnpm poczta:sprawdz`
 * do dopasowania nadawcy do listy domen zweryfikowanych w Resend.
 */
export function domenaNadawcy(nadawca: string): string | null {
  // Nawias kątowy, gdy jest, a cały ciąg, gdy go nie ma.
  const wNawiasie = nadawca.match(/<([^>]+)>/);
  const adres = (wNawiasie?.[1] ?? nadawca).trim();

  const malpa = adres.lastIndexOf("@");
  if (malpa === -1) return null;

  const domena = adres
    .slice(malpa + 1)
    .trim()
    .toLowerCase();
  return domena === "" ? null : domena;
}

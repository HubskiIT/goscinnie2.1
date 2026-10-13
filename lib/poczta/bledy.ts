/**
 * Odmowy wysyłki i ich klasyfikacja. Jedyne miejsce, w którym żyje wiedza
 * o tym, co znaczą odpowiedzi Resend.
 *
 * PO CO TA KLASYFIKACJA. Wszystkie odmowy wyglądały wcześniej tak samo:
 * `Error` z numerem i surowym ciałem odpowiedzi. Dla wywołującego znaczyło to,
 * że albo pokazuje wszystko, albo nic. A to są dwie różne sprawy: brak klucza
 * dotyczy serwisu i nie zależy od tego, do kogo piszemy, natomiast odmowa
 * dotycząca konkretnego odbiorcy jest informacją o nim.
 *
 * Pole `zaleznyOdOdbiorcy` niesie dokładnie tę różnicę i na nim stoi reguła
 * z docs/decyzje/011: komunikat wolno uzależnić wyłącznie od faktów
 * niezależnych od wpisanego adresu.
 */
import { z } from "zod";

export type RodzajOdmowy =
  /** Nasza konfiguracja: brak klucza, niezweryfikowana domena, zły nadawca. */
  | "konfiguracja"
  /** Coś z konkretnym odbiorcą: zły adres, odbiorca poza dozwoloną listą. */
  | "adres"
  /** Przejdzie samo: limit na minutę, awaria po stronie Resend. */
  | "chwilowy"
  /** Nie wiemy. Traktujemy ostrożnie i logujemy w całości. */
  | "nieznany";

/** Ciało odpowiedzi Resend przy odmowie. Granica, więc Zod. */
export const odpowiedzOdmowy = z.object({
  name: z.string().optional(),
  message: z.string().optional(),
});

export type Klasyfikacja = {
  rodzaj: RodzajOdmowy;
  /** Nazwa błędu od Resend, gdy ciało dało się odczytać. */
  kodResend: string | null;
  /**
   * Czy pojawienie się tej odmowy mówi cokolwiek o odbiorcy.
   *
   * `true` znaczy „nie pokazuj tego tam, gdzie adres podaje obcy człowiek”,
   * bo sama obecność takiego błędu zdradza, że próba wysyłki w ogóle nastąpiła.
   */
  zaleznyOdOdbiorcy: boolean;
};

/**
 * Co znaczy odmowa Resend.
 *
 * Czysta funkcja: żadnej sieci, żadnego czytania środowiska. Dzięki temu
 * da się ją sprawdzić na prawdziwych ciałach odpowiedzi bez udawania HTTP.
 *
 * Rozpoznajemy najpierw po polu `name` z JSON-a, bo ono jest stabilne.
 * Dopasowanie po angielskim zdaniu jest kruche i służy wyłącznie tam, gdzie
 * `name` nie rozróżnia dwóch bardzo różnych sytuacji pod jednym kodem 403.
 */
export function sklasyfikujOdmowe(status: number, cialo: string): Klasyfikacja {
  const nazwa = nazwaBledu(cialo);
  const tekst = cialo.toLowerCase();

  if (status === 401) {
    return { rodzaj: "konfiguracja", kodResend: nazwa, zaleznyOdOdbiorcy: false };
  }

  if (status === 429) {
    return { rodzaj: "chwilowy", kodResend: nazwa, zaleznyOdOdbiorcy: false };
  }

  if (status >= 500) {
    return { rodzaj: "chwilowy", kodResend: nazwa, zaleznyOdOdbiorcy: false };
  }

  if (status === 403) {
    /*
     * Dwie bardzo różne sytuacje pod jednym kodem, obie konfiguracyjne:
     *
     * 1. konto Resend bez zweryfikowanej domeny wysyła wyłącznie na adres
     *    właściciela konta. Komunikat wymienia ten adres, więc pojawia się
     *    tylko dla odbiorców spoza niego — a to już jest informacja o odbiorcy.
     * 2. domena nadawcy niezweryfikowana: odmowa dotyczy nas, nie odbiorcy.
     */
    const trybTestowy = tekst.includes("testing emails");
    return { rodzaj: "konfiguracja", kodResend: nazwa, zaleznyOdOdbiorcy: trybTestowy };
  }

  if (status === 422 || status === 400) {
    // Resend nazywa pole, którego dotyczy zarzut. „to” to odbiorca, „from” my.
    const oOdbiorcy = /\bto\b/.test(tekst) && !tekst.includes("from");
    return {
      rodzaj: oOdbiorcy ? "adres" : "konfiguracja",
      kodResend: nazwa,
      zaleznyOdOdbiorcy: oOdbiorcy,
    };
  }

  /*
   * Gałąź domyślna jest ostrożna celowo: `nieznany` i `zaleznyOdOdbiorcy`
   * równe fałsz. Zgadywanie w tym miejscu kończy się albo ukryciem awarii,
   * którą dałoby się pokazać, albo wyciekiem. Pełna treść idzie do logu.
   */
  return { rodzaj: "nieznany", kodResend: nazwa, zaleznyOdOdbiorcy: false };
}

function nazwaBledu(cialo: string): string | null {
  try {
    const wynik = odpowiedzOdmowy.safeParse(JSON.parse(cialo));
    return wynik.success ? (wynik.data.name ?? null) : null;
  } catch {
    // Resend oddaje przy awariach także czysty tekst i HTML od pośrednika.
    return null;
  }
}

/**
 * Nieudana wysyłka.
 *
 * Osobna klasa, a nie `Error`, żeby wywołujący mógł zapytać o rodzaj zamiast
 * czytać treść komunikatu wyrażeniem regularnym.
 */
export class BladWysylki extends Error {
  readonly rodzaj: RodzajOdmowy;
  readonly zaleznyOdOdbiorcy: boolean;
  readonly status: number | null;
  readonly kodResend: string | null;
  /** Surowa treść odpowiedzi. Do logu, nigdy na ekran. */
  readonly tresc: string;

  constructor(opis: {
    komunikat: string;
    klasyfikacja: Klasyfikacja;
    status?: number | null;
    tresc?: string;
  }) {
    super(opis.komunikat);
    this.name = "BladWysylki";
    this.rodzaj = opis.klasyfikacja.rodzaj;
    this.zaleznyOdOdbiorcy = opis.klasyfikacja.zaleznyOdOdbiorcy;
    this.status = opis.status ?? null;
    this.kodResend = opis.klasyfikacja.kodResend;
    this.tresc = opis.tresc ?? "";
  }
}

/** Czy ten błąd to nasza konfiguracja, niezależna od tego, do kogo piszemy. */
export function toNaszaKonfiguracja(blad: BladWysylki): boolean {
  return blad.rodzaj === "konfiguracja" && !blad.zaleznyOdOdbiorcy;
}

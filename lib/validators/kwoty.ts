/**
 * Kwoty wpisywane przez człowieka.
 *
 * Człowiek wpisuje złotówki, baza trzyma grosze. Przeliczenie dzieje się
 * **na granicy, w jednym miejscu**, a nie w komponencie i osobno w zapytaniu.
 * Drugi `Math.round(x * 100)` w innym pliku to pierwszy krok do rozjazdu,
 * w którym jedna droga mnoży, a druga już nie.
 *
 * Pusta wartość znaczy „nie podano”, a nie „zero”. Zero złotych to oferta
 * za darmo, brak wartości to brak informacji i w bazie ma być `null`.
 */
import { z } from "zod";

/** Górna granica kwoty. Chroni przed pomyłką o trzy zera przy wpisywaniu. */
export const MAKS_KWOTA_ZLOTOWKI = 1_000_000;

/**
 * Opcjonalna kwota w złotówkach, przeliczona na grosze.
 *
 * `nazwa` wchodzi do komunikatów, bo ten sam schemat obsługuje „cenę od”
 * w kreatorze i „budżet” w zleceniu, a komunikat „Cena musi być liczbą”
 * pod polem budżetu wygląda na błąd ekranu, nie na podpowiedź.
 */
export function kwotaZlotowkiOpcjonalna(nazwa: string) {
  return z
    .union([
      z.literal(""),
      z.coerce
        .number({ message: `${nazwa} musi być liczbą.` })
        .positive(`${nazwa} musi być większa od zera.`)
        .max(MAKS_KWOTA_ZLOTOWKI, `Ta kwota wygląda na pomyłkę.`),
    ])
    .transform((wartosc) => (wartosc === "" ? null : Math.round(wartosc * 100)));
}

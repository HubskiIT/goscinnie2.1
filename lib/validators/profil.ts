/**
 * Walidacja edycji profilu firmy.
 *
 * Nazwy i sluga tu nie ma i nie ma go tu przez pomyłkę: decyzja 005 mówi,
 * że slug jest niezmienny, bo jego zmiana kosztuje połowę ruchu na kilka
 * miesięcy. Nazwa pójdzie z osobnym plastrem, razem z moderacją.
 */
import { z } from "zod";

/** Górna granica ceny. Chroni przed pomyłką o trzy zera przy wpisywaniu. */
export const MAKS_CENA_ZLOTOWKI = 1_000_000;

export const daneProfilu = z.object({
  opis: z.string().trim().max(4000, "Opis jest za długi.").default(""),

  /**
   * Cena w **złotówkach**, bo tyle wpisuje człowiek. Do groszy przeliczamy
   * na granicy, w jednym miejscu, a nie w komponencie i osobno w zapytaniu.
   * Pusta wartość znaczy „do uzupełnienia”, nie „za darmo”.
   */
  cenaOdZl: z
    .union([z.literal(""), z.coerce.number().positive().max(MAKS_CENA_ZLOTOWKI)])
    .transform((wartosc) => (wartosc === "" ? null : Math.round(wartosc * 100))),

  pojemnoscMin: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(100_000)])
    .transform((wartosc) => (wartosc === "" ? null : wartosc)),

  pojemnoscMax: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(100_000)])
    .transform((wartosc) => (wartosc === "" ? null : wartosc)),

  /** Slugi kategorii. Pusta lista jest dozwolona, choć nie jest mądra. */
  kategorie: z.array(z.string().trim().min(1)).max(10).default([]),
});

export type DaneProfilu = z.infer<typeof daneProfilu>;

export const daneZgloszenia = z.object({
  uzasadnienie: z.string().trim().max(1000, "Uzasadnienie jest za długie.").default(""),
});

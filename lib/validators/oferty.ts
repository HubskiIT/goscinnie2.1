/**
 * Walidacja ofert. Zod na granicy, ten sam schemat w formularzu i na serwerze.
 */
import { z } from "zod";

/** Cena w groszach. Górna granica chroni przed pomyłką o trzy zera. */
export const daneOferty = z.object({
  cena: z.coerce
    .number()
    .int("Cena w groszach, bez części dziesiętnych.")
    .min(1000, "Cena wygląda na zbyt niską. Podaj kwotę w groszach.")
    .max(100_000_000, "Cena wygląda na zbyt wysoką. Podaj kwotę w groszach."),
  wiadomosc: z
    .string()
    .trim()
    .min(20, "Napisz choć dwa zdania. Sama cena rzadko wygrywa.")
    .max(2000, "Wiadomość jest za długa."),
});

export type DaneOfertyWejscie = z.infer<typeof daneOferty>;

export const identyfikator = z.uuid();

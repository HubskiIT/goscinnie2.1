/**
 * Walidacja wejścia dla zleceń. Zod na granicy, zgodnie z zasadą 4.
 * Ten sam schemat daje walidację i typ, więc nie ma dwóch źródeł prawdy.
 */
import { z } from "zod";

/** Górny limit stronicowania. Chroni bazę przed żądaniem o dziesięć tysięcy wierszy. */
export const MAKS_LIMIT = 50;
export const DOMYSLNY_LIMIT = 20;

export const parametryListyZlecen = z.object({
  limit: z.coerce.number().int().min(1).max(MAKS_LIMIT).default(DOMYSLNY_LIMIT),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ParametryListyZlecen = z.infer<typeof parametryListyZlecen>;

/** Identyfikator zlecenia w ścieżce. UUID, nie dowolny tekst. */
export const identyfikatorZlecenia = z.uuid();

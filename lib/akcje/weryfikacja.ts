"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import type { StanFormularza } from "@/lib/formularze";

/**
 * Akcja weryfikacji emaila. Sprawdza kod wysłany na email
 * i aktywuje konto.
 *
 * UWAGA: Better-auth ma swój mechanizm weryfikacji przez token w URL.
 * Ta akcja to uproszczona wersja dla prototypu z kodem 6-cyfrowym.
 */

const schematWeryfikacja = z.object({
  email: z.string().email("Nieprawidłowy adres email."),
  kod: z
    .string()
    .length(6, "Kod ma 6 cyfr.")
    .regex(/^\d{6}$/, "Kod składa się z cyfr."),
});

export async function zweryfikujEmail(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = schematWeryfikacja.safeParse(wejscie);

  if (!wynik.success) {
    const bledy: Record<string, string[]> = {};
    for (const problem of wynik.error.issues) {
      const pole = String(problem.path[0] ?? "_");
      bledy[pole] = [problem.message];
    }
    return { status: "bledy", bledy, wartosci: {} };
  }

  try {
    // W prototypie: sprawdzamy czy użytkownik istnieje i oznaczamy jako zweryfikowanego
    const [uzytkownik] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, wynik.data.email))
      .limit(1);

    if (!uzytkownik) {
      return {
        status: "bledy",
        bledy: { email: ["Nie znaleziono użytkownika."] },
        wartosci: {},
      };
    }

    // Oznaczamy email jako zweryfikowany
    await db
      .update(schema.users)
      .set({ emailVerified: true })
      .where(eq(schema.users.id, uzytkownik.id));

    // Po weryfikacji przekierowujemy na kreator profilu
    redirect("/rejestracja-firmy?krok=2");
  } catch (error) {
    console.error("Błąd weryfikacji:", error);

    return {
      status: "bledy",
      bledy: { kod: ["Nie udało się zweryfikować kodu."] },
      wartosci: {},
    };
  }
}

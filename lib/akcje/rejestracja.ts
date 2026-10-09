"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import type { StanFormularza } from "@/lib/formularze";

/**
 * Akcja rejestracji firmy. Tworzy konto przez better-auth i wysyła
 * kod weryfikacyjny na email.
 */

const schematRejestracja = z.object({
  email: z.string().email("Nieprawidłowy adres email."),
  haslo: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków.")
    .regex(/[A-Z]/, "Hasło musi zawierać wielką literę.")
    .regex(/[a-z]/, "Hasło musi zawierać małą literę.")
    .regex(/[0-9]/, "Hasło musi zawierać cyfrę."),
});

export async function zarejestrujFirme(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = schematRejestracja.safeParse(wejscie);

  if (!wynik.success) {
    const bledy: Record<string, string[]> = {};
    for (const problem of wynik.error.issues) {
      const pole = String(problem.path[0] ?? "_");
      bledy[pole] = [problem.message];
    }
    return { status: "bledy", bledy, wartosci: {} };
  }

  try {
    // Rejestracja przez better-auth
    const odpowiedz = await auth.api.signUpEmail({
      body: {
        email: wynik.data.email,
        password: wynik.data.haslo,
        name: wynik.data.email.split("@")[0] ?? "Użytkownik",
      },
    });

    if (!odpowiedz) {
      return {
        status: "bledy",
        bledy: { _: ["Nie udało się utworzyć konta."] },
        wartosci: {},
      };
    }

    // Przekierowanie na stronę weryfikacji
    redirect(`/weryfikacja?email=${encodeURIComponent(wynik.data.email)}`);
  } catch (error) {
    console.error("Błąd rejestracji:", error);
    const komunikat = error instanceof Error ? error.message : "Nieznany błąd";

    if (komunikat.includes("already exists") || komunikat.includes("unique")) {
      return {
        status: "bledy",
        bledy: { email: ["Ten adres email jest już zarejestrowany."] },
        wartosci: {},
      };
    }

    return {
      status: "bledy",
      bledy: { _: [`Nie udało się zarejestrować: ${komunikat}`] },
      wartosci: {},
    };
  }
}

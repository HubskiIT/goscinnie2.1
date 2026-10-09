"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import type { StanFormularza } from "@/lib/formularze";

/**
 * Akcje profilu firmy. Każdy krok kreatora wywołuje osobną akcję,
 * która zapisuje dane i zwraca stan formularza.
 */

async function pobierzSesje() {
  const sesja = await auth.api.getSession({
    headers: await import("next/headers").then((m) => m.headers()),
  });

  if (!sesja?.user) {
    redirect("/logowanie");
  }

  return sesja;
}

async function pobierzFirme(userId: string) {
  const [czlonek] = await db
    .select({ companyId: schema.companyMembers.companyId })
    .from(schema.companyMembers)
    .where(eq(schema.companyMembers.userId, userId))
    .limit(1);

  if (!czlonek) {
    return null;
  }

  const [firma] = await db
    .select()
    .from(schema.companies)
    .where(eq(schema.companies.id, czlonek.companyId))
    .limit(1);

  return firma;
}

const schematKategoria = z.object({
  categoryId: z.string().uuid("Nieprawidłowy identyfikator kategorii."),
  rodzaj: z.enum(["lokal", "usluga"]),
});

export async function zapiszKrokKategoria(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = schematKategoria.safeParse(wejscie);

  if (!wynik.success) {
    const bledy: Record<string, string[]> = {};
    for (const problem of wynik.error.issues) {
      const pole = String(problem.path[0] ?? "_");
      bledy[pole] = [problem.message];
    }
    return { status: "bledy", bledy, wartosci: {} };
  }

  try {
    const sesja = await pobierzSesje();
    let firma = await pobierzFirme(sesja.user.id);

    if (!firma) {
      // Tworzymy nową firmę w stanie draft
      const [nowaFirma] = await db
        .insert(schema.companies)
        .values({
          ownerUserId: sesja.user.id,
          name: sesja.user.email.split("@")[0] ?? "Nowa firma",
          slug: `firma-${Date.now()}`, // Tymczasowy, nadpiszemy w kolejnym kroku
          cityId: "00000000-0000-0000-0000-000000000000", // Placeholder, nadpiszemy
          // biome-ignore lint/suspicious/noExplicitAny: geography point wymaga SQL literal
          point: sql`SRID=4326;POINT(0 0)` as any,
          status: "draft",
        })
        .returning();

      if (!nowaFirma) {
        throw new Error("Nie udało się utworzyć firmy.");
      }

      // Powiązanie z użytkownikiem
      await db.insert(schema.companyMembers).values({
        companyId: nowaFirma.id,
        userId: sesja.user.id,
        role: "owner",
      });

      firma = nowaFirma;
    }

    // Zapisujemy kategorię (nie mamy jeszcze pola w companies dla pojedynczej kategorii,
    // więc na razie to tylko placeholder - dopracujemy w migracji)

    return { status: "poczatkowy" };
  } catch (error) {
    console.error("Błąd zapisu kategorii:", error);
    return {
      status: "bledy",
      bledy: { _: ["Nie udało się zapisać. Spróbuj ponownie."] },
      wartosci: {},
    };
  }
}

const schematOpis = z.object({
  name: z.string().trim().min(2, "Nazwa musi mieć co najmniej 2 znaki.").max(120),
  description: z.string().trim().min(20, "Opis musi mieć co najmniej 20 znaków.").max(2000),
  priceFrom: z.coerce.number().int().min(0, "Cena nie może być ujemna."),
  capacityMin: z.coerce.number().int().min(1).optional(),
  capacityMax: z.coerce.number().int().min(1).optional(),
});

export async function zapiszKrokOpis(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = schematOpis.safeParse(wejscie);

  if (!wynik.success) {
    const bledy: Record<string, string[]> = {};
    for (const problem of wynik.error.issues) {
      const pole = String(problem.path[0] ?? "_");
      bledy[pole] = [problem.message];
    }
    return { status: "bledy", bledy, wartosci: {} };
  }

  try {
    const sesja = await pobierzSesje();
    const firma = await pobierzFirme(sesja.user.id);

    if (!firma) {
      return {
        status: "bledy",
        bledy: { _: ["Nie znaleziono firmy. Zacznij od początku."] },
        wartosci: {},
      };
    }

    await db
      .update(schema.companies)
      .set({
        name: wynik.data.name,
        description: wynik.data.description,
        priceFrom: wynik.data.priceFrom * 100, // W groszach
        capacityMin: wynik.data.capacityMin,
        capacityMax: wynik.data.capacityMax,
      })
      .where(eq(schema.companies.id, firma.id));

    return { status: "poczatkowy" };
  } catch (error) {
    console.error("Błąd zapisu opisu:", error);
    return {
      status: "bledy",
      bledy: { _: ["Nie udało się zapisać. Spróbuj ponownie."] },
      wartosci: {},
    };
  }
}

const schematLokalizacja = z.object({
  cityId: z.string().uuid("Nieprawidłowy identyfikator miasta."),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export async function zapiszKrokLokalizacja(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = schematLokalizacja.safeParse(wejscie);

  if (!wynik.success) {
    const bledy: Record<string, string[]> = {};
    for (const problem of wynik.error.issues) {
      const pole = String(problem.path[0] ?? "_");
      bledy[pole] = [problem.message];
    }
    return { status: "bledy", bledy, wartosci: {} };
  }

  try {
    const sesja = await pobierzSesje();
    const firma = await pobierzFirme(sesja.user.id);

    if (!firma) {
      return {
        status: "bledy",
        bledy: { _: ["Nie znaleziono firmy. Zacznij od początku."] },
        wartosci: {},
      };
    }

    // Generujemy slug z nazwy firmy
    const slug = firma.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const zSlugiem = slug || `firma-${Date.now()}`;

    const point =
      wynik.data.lat && wynik.data.lng
        ? sql`SRID=4326;POINT(${wynik.data.lng} ${wynik.data.lat})`
        : null;

    await db
      .update(schema.companies)
      .set({
        slug: zSlugiem,
        cityId: wynik.data.cityId,
        // biome-ignore lint/suspicious/noExplicitAny: geography point wymaga SQL literal
        point: point as any,
      })
      .where(eq(schema.companies.id, firma.id));

    return { status: "poczatkowy" };
  } catch (error) {
    console.error("Błąd zapisu lokalizacji:", error);
    return {
      status: "bledy",
      bledy: { _: ["Nie udało się zapisać. Spróbuj ponownie."] },
      wartosci: {},
    };
  }
}

const schematDaneKontaktowe = z.object({
  nip: z
    .string()
    .trim()
    .transform((w) => w.replace(/[\s-]/g, ""))
    .refine((w) => /^\d{10}$/.test(w), "NIP ma dziesięć cyfr.")
    .refine((w) => {
      const wagi = [6, 5, 7, 2, 3, 4, 5, 6, 7];
      const suma = wagi.reduce((acc, waga, i) => acc + waga * Number(w[i]), 0);
      return suma % 11 === Number(w[9]);
    }, "Ten NIP ma błędną cyfrę kontrolną."),
  telefon: z
    .string()
    .trim()
    .transform((w) => w.replace(/[\s-]/g, "").replace(/^\+48/, ""))
    .refine((w) => /^\d{9}$/.test(w), "Numer komórkowy ma dziewięć cyfr."),
});

export async function zapiszKrokDaneKontaktowe(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = schematDaneKontaktowe.safeParse(wejscie);

  if (!wynik.success) {
    const bledy: Record<string, string[]> = {};
    for (const problem of wynik.error.issues) {
      const pole = String(problem.path[0] ?? "_");
      bledy[pole] = [problem.message];
    }
    return { status: "bledy", bledy, wartosci: {} };
  }

  try {
    const sesja = await pobierzSesje();
    const firma = await pobierzFirme(sesja.user.id);

    if (!firma) {
      return {
        status: "bledy",
        bledy: { _: ["Nie znaleziono firmy. Zacznij od początku."] },
        wartosci: {},
      };
    }

    // NIP i telefon zapiszemy w osobnej tabeli company_verification gdy ją dodamy
    // Na razie oznaczamy firmę jako gotową do publikacji

    return { status: "poczatkowy" };
  } catch (error) {
    console.error("Błąd zapisu danych kontaktowych:", error);
    return {
      status: "bledy",
      bledy: { _: ["Nie udało się zapisać. Spróbuj ponownie."] },
      wartosci: {},
    };
  }
}

export async function wyslijDoZatwierdzenia(): Promise<void> {
  const sesja = await pobierzSesje();
  const firma = await pobierzFirme(sesja.user.id);

  if (!firma) {
    throw new Error("Nie znaleziono firmy.");
  }

  // W prototypie pomijamy moderację - od razu aktywujemy
  await db
    .update(schema.companies)
    .set({ status: "active" })
    .where(eq(schema.companies.id, firma.id));

  redirect(`/panel/profil?published=true`);
}

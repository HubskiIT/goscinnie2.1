/**
 * PATCH /api/firmy/:slug — edycja profilu przez członka firmy.
 *
 * Sprawdzenie uprawnień siedzi w warstwie zapytań, nie w ukryciu formularza.
 * Wniosek o przejęcie, nawet oczekujący, nie daje tu niczego: człowiek
 * z wnioskiem dostaje to samo, co zupełnie obcy.
 *
 * Nazwy i sluga nie da się zmienić przez ten endpoint i to jest zamierzone,
 * patrz docs/decyzje/005.
 */
import { NextResponse } from "next/server";
import { odpowiedzNaOdmowe } from "@/lib/api/odmowy";
import { widzZZadania } from "@/lib/auth/widz";
import { zaktualizujProfil } from "@/lib/db/queries/firmy";
import { daneProfilu } from "@/lib/validators/profil";

export async function PATCH(
  zadanie: Request,
  kontekst: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await kontekst.params;

  let cialo: unknown;
  try {
    cialo = await zadanie.json();
  } catch {
    return NextResponse.json({ blad: "Nieprawidłowa treść żądania." }, { status: 400 });
  }

  const dane = daneProfilu.safeParse(cialo);
  if (!dane.success) {
    return NextResponse.json(
      { blad: "Sprawdź dane profilu.", szczegoly: dane.error.issues },
      { status: 400 },
    );
  }

  try {
    const widz = await widzZZadania(zadanie.headers);
    const wynik = await zaktualizujProfil(widz, slug, {
      opis: dane.data.opis,
      cenaOd: dane.data.cenaOdZl,
      pojemnoscMin: dane.data.pojemnoscMin,
      pojemnoscMax: dane.data.pojemnoscMax,
      kategorie: dane.data.kategorie,
    });

    if (!wynik.ok) return odpowiedzNaOdmowe(wynik.powod);
    return NextResponse.json({ zapisano: true });
  } catch (blad) {
    console.error("PATCH /api/firmy/:slug", blad);
    return NextResponse.json({ blad: "Nie udało się zapisać profilu." }, { status: 500 });
  }
}

/**
 * POST /api/firmy/:slug/przejecie — zgłoszenie, że profil należy do mnie.
 *
 * Zgłoszenie NIE daje żadnego dostępu. Tworzy wniosek do ręcznego rozpatrzenia
 * przez `scripts/przejecia.ts`. Do czasu weryfikacji po numerze NIP to jedyne,
 * co stoi między konkurencją zza rogu a cudzym profilem.
 *
 *   201  wniosek przyjęty
 *   403  brak sesji albo już należysz do tej firmy
 *   409  masz już oczekujący wniosek do tej firmy
 */
import { NextResponse } from "next/server";
import { odpowiedzNaOdmowe } from "@/lib/api/odmowy";
import { widzZZadania } from "@/lib/auth/widz";
import { zglosPrzejecie } from "@/lib/db/queries/firmy";
import { daneZgloszenia } from "@/lib/validators/profil";

export async function POST(
  zadanie: Request,
  kontekst: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await kontekst.params;

  let cialo: unknown = {};
  try {
    const tekst = await zadanie.text();
    if (tekst.trim()) cialo = JSON.parse(tekst);
  } catch {
    return NextResponse.json({ blad: "Nieprawidłowa treść żądania." }, { status: 400 });
  }

  const dane = daneZgloszenia.safeParse(cialo);
  if (!dane.success) {
    return NextResponse.json(
      { blad: "Sprawdź treść zgłoszenia.", szczegoly: dane.error.issues },
      { status: 400 },
    );
  }

  try {
    const widz = await widzZZadania(zadanie.headers);
    const wynik = await zglosPrzejecie(widz, slug, dane.data.uzasadnienie);
    if (!wynik.ok) return odpowiedzNaOdmowe(wynik.powod);

    return NextResponse.json(
      {
        wniosek: wynik.dane,
        komunikat: "Wniosek przyjęty. Sprawdzimy go ręcznie, zwykle w jeden dzień roboczy.",
      },
      { status: 201 },
    );
  } catch (blad) {
    console.error("POST /api/firmy/:slug/przejecie", blad);
    return NextResponse.json({ blad: "Nie udało się złożyć wniosku." }, { status: 500 });
  }
}

/**
 * DELETE /api/oferty/:id — wycofanie oferty przez firmę.
 *
 * Wycofanie to zmiana statusu na `withdrawn`, nigdy usunięcie wiersza.
 * Możliwe do momentu, w którym klient doda ofertę do krótkiej listy.
 *
 * Oferta cudza, nieistniejąca i już na krótkiej liście dają tę samą odmowę,
 * żeby po identyfikatorach nie dało się wyliczać, które oferty istnieją.
 */
import { NextResponse } from "next/server";
import { odpowiedzNaOdmowe } from "@/lib/api/odmowy";
import { widzZZadania } from "@/lib/auth/widz";
import { wycofajOferte } from "@/lib/db/queries/bids";
import { identyfikator } from "@/lib/validators/oferty";

export async function DELETE(
  zadanie: Request,
  kontekst: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await kontekst.params;

  const idOferty = identyfikator.safeParse(id);
  if (!idOferty.success) {
    return NextResponse.json({ blad: "Nieprawidłowy identyfikator oferty." }, { status: 400 });
  }

  try {
    const widz = await widzZZadania(zadanie.headers);
    const wynik = await wycofajOferte(widz, idOferty.data);
    if (!wynik.ok) return odpowiedzNaOdmowe(wynik.powod);

    return NextResponse.json({ wycofana: true });
  } catch (blad) {
    console.error("DELETE /api/oferty/:id", blad);
    return NextResponse.json({ blad: "Nie udało się wycofać oferty." }, { status: 500 });
  }
}

/**
 * POST /api/oferty/:id/krotka-lista — klient dodaje ofertę do krótkiej listy.
 *
 * To jest moment, w którym firma dostaje dane kontaktowe klienta. Akcja należy
 * wyłącznie do autora zlecenia: gdyby mogła ją wywołać firma, cała ochrona
 * kontaktu byłaby pozorna.
 *
 * Odblokowanie dotyczy tej jednej oferty. Pozostałe firmy na tym samym zleceniu
 * nadal nie mają kontaktu i nie dostaną go w przyszłości.
 */
import { NextResponse } from "next/server";
import { odpowiedzNaOdmowe } from "@/lib/api/odmowy";
import { widzWKontekscieZlecenia, widzZZadania } from "@/lib/auth/widz";
import { dodajDoKrotkiejListy, zlecenieOferty } from "@/lib/db/queries/bids";
import { autorZlecenia } from "@/lib/db/queries/requests";
import { identyfikator } from "@/lib/validators/oferty";

export async function POST(
  zadanie: Request,
  kontekst: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await kontekst.params;

  const idOferty = identyfikator.safeParse(id);
  if (!idOferty.success) {
    return NextResponse.json({ blad: "Nieprawidłowy identyfikator oferty." }, { status: 400 });
  }

  try {
    const widzPodstawowy = await widzZZadania(zadanie.headers);

    // Autorem jest się względem zlecenia, nie względem oferty, więc najpierw
    // ustalamy, do którego zlecenia ta oferta należy.
    const requestId = await zlecenieOferty(widzPodstawowy, idOferty.data);
    const autor = requestId ? await autorZlecenia(widzPodstawowy, requestId) : null;
    const widz = autor ? widzWKontekscieZlecenia(widzPodstawowy, autor) : widzPodstawowy;

    const wynik = await dodajDoKrotkiejListy(widz, idOferty.data);
    if (!wynik.ok) return odpowiedzNaOdmowe(wynik.powod);

    return NextResponse.json({ naKrotkiejLiscie: true });
  } catch (blad) {
    console.error("POST /api/oferty/:id/krotka-lista", blad);
    return NextResponse.json({ blad: "Nie udało się dodać do krótkiej listy." }, { status: 500 });
  }
}

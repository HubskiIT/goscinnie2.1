/**
 * Oferty na zleceniu.
 *
 *   POST  składa ofertę (firma z aktywnym abonamentem)
 *   GET   autor widzi wszystkie, firma wyłącznie swoją
 *
 * Kody i ich znaczenie biznesowe:
 *
 *   201  oferta przyjęta
 *   402  firma bez aktywnego abonamentu, front pokazuje ekran sprzedażowy
 *   409  ta firma już złożyła ofertę na to zlecenie (z polem `powod`)
 *   409  zlecenie nie przyjmuje ofert (BEZ pola `powod`, patrz niżej)
 *   429  wyczerpany limit ofert w planie
 */
import { NextResponse } from "next/server";
import { odpowiedzNaOdmowe } from "@/lib/api/odmowy";
import { widzWKontekscieZlecenia, widzZZadania } from "@/lib/auth/widz";
import { pobierzOfertyZlecenia, zlozOferte } from "@/lib/db/queries/bids";
import { autorZlecenia } from "@/lib/db/queries/requests";
import { daneOferty, identyfikator } from "@/lib/validators/oferty";

export async function POST(
  zadanie: Request,
  kontekst: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await kontekst.params;

  const idZlecenia = identyfikator.safeParse(id);
  if (!idZlecenia.success) {
    return NextResponse.json({ blad: "Nieprawidłowy identyfikator zlecenia." }, { status: 400 });
  }

  let cialo: unknown;
  try {
    cialo = await zadanie.json();
  } catch {
    return NextResponse.json({ blad: "Nieprawidłowa treść żądania." }, { status: 400 });
  }

  const dane = daneOferty.safeParse(cialo);
  if (!dane.success) {
    return NextResponse.json(
      { blad: "Sprawdź dane oferty.", szczegoly: dane.error.issues },
      { status: 400 },
    );
  }

  try {
    const widz = await widzZZadania(zadanie.headers);
    const wynik = await zlozOferte(widz, {
      requestId: idZlecenia.data,
      cena: dane.data.cena,
      wiadomosc: dane.data.wiadomosc,
    });

    if (!wynik.ok) return odpowiedzNaOdmowe(wynik.powod);
    return NextResponse.json({ oferta: wynik.dane }, { status: 201 });
  } catch (blad) {
    console.error("POST /api/zlecenia/:id/oferty", blad);
    return NextResponse.json({ blad: "Nie udało się złożyć oferty." }, { status: 500 });
  }
}

export async function GET(
  zadanie: Request,
  kontekst: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await kontekst.params;

  const idZlecenia = identyfikator.safeParse(id);
  if (!idZlecenia.success) {
    return NextResponse.json({ blad: "Nieprawidłowy identyfikator zlecenia." }, { status: 400 });
  }

  try {
    const widzPodstawowy = await widzZZadania(zadanie.headers);
    const autor = await autorZlecenia(widzPodstawowy, idZlecenia.data);
    const widz = autor ? widzWKontekscieZlecenia(widzPodstawowy, autor) : widzPodstawowy;

    const wynik = await pobierzOfertyZlecenia(widz, idZlecenia.data);
    if (!wynik.ok) return odpowiedzNaOdmowe(wynik.powod);

    return NextResponse.json({ zakres: wynik.dane.zakres, oferty: wynik.dane.oferty });
  } catch (blad) {
    console.error("GET /api/zlecenia/:id/oferty", blad);
    return NextResponse.json({ blad: "Nie udało się pobrać ofert." }, { status: 500 });
  }
}

/**
 * GET /api/zlecenia/:id — pojedyncze zlecenie.
 *
 * Autor dostaje pełny zakres: opis, budżet, miasto, własny kontakt i liczbę
 * ofert. Każdy inny, zalogowany czy nie, dostaje zakres jawny bez opisu
 * i bez budżetu. O tym, który to przypadek, rozstrzyga warstwa zapytań
 * przez lib/permissions.ts, a nie ten plik.
 *
 * Zlecenie zamknięte albo wygasłe daje dla obcych 404, tak samo jak
 * nieistniejące. Rozróżnianie tych przypadków byłoby kanałem informacji.
 */
import { NextResponse } from "next/server";
import { widzWKontekscieZlecenia, widzZZadania } from "@/lib/auth/widz";
import { pobierzZlecenieDlaWidza } from "@/lib/db/queries/requests";
import { identyfikatorZlecenia } from "@/lib/validators/zlecenia";

export async function GET(
  zadanie: Request,
  kontekst: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await kontekst.params;

  const wynikWalidacji = identyfikatorZlecenia.safeParse(id);
  if (!wynikWalidacji.success) {
    return NextResponse.json({ blad: "Nieprawidłowy identyfikator zlecenia." }, { status: 400 });
  }

  try {
    const widz = await widzZZadania(zadanie.headers);
    const wynik = await pobierzZlecenieDlaWidza(widz, wynikWalidacji.data, widzWKontekscieZlecenia);

    if (!wynik.zlecenie) {
      return NextResponse.json({ blad: "Nie ma takiego zlecenia." }, { status: 404 });
    }

    return NextResponse.json({ zlecenie: wynik.zlecenie, zakres: wynik.zakres });
  } catch (blad) {
    console.error("GET /api/zlecenia/:id", blad);
    return NextResponse.json({ blad: "Nie udało się pobrać zlecenia." }, { status: 500 });
  }
}

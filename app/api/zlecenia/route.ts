/**
 * GET /api/zlecenia — publiczna lista zleceń.
 *
 * Zakres odpowiedzi zależy od widza i rozstrzyga o nim warstwa zapytań przez
 * lib/permissions.ts, nie ten plik:
 *
 *   anonim i zalogowany klient   bez opisu i bez budżetu
 *   firma bez abonamentu         zajawka opisu, bez budżetu
 *   firma z abonamentem          cały opis i budżet
 */
import { NextResponse } from "next/server";
import { widzZZadania } from "@/lib/auth/widz";
import { pobierzListeDlaWidza } from "@/lib/db/queries/requests";
import { parametryListyZlecen } from "@/lib/validators/zlecenia";

export async function GET(zadanie: Request): Promise<NextResponse> {
  const adres = new URL(zadanie.url);

  const wynikWalidacji = parametryListyZlecen.safeParse({
    limit: adres.searchParams.get("limit") ?? undefined,
    offset: adres.searchParams.get("offset") ?? undefined,
  });

  if (!wynikWalidacji.success) {
    return NextResponse.json(
      { blad: "Nieprawidłowe parametry listy.", szczegoly: wynikWalidacji.error.issues },
      { status: 400 },
    );
  }

  const parametry = wynikWalidacji.data;

  try {
    const widz = await widzZZadania(zadanie.headers);
    const wynik = await pobierzListeDlaWidza(widz, parametry);
    return NextResponse.json({
      zlecenia: wynik.zlecenia,
      // Zakres jest częścią odpowiedzi, bo front musi wiedzieć, czy pokazać
      // ekran sprzedażowy obok zajawki, czy pełną treść.
      zakres: wynik.zakres,
      limit: parametry.limit,
      offset: parametry.offset,
    });
  } catch (blad) {
    console.error("GET /api/zlecenia", blad);
    return NextResponse.json({ blad: "Nie udało się pobrać listy zleceń." }, { status: 500 });
  }
}

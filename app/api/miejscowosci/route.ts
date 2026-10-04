import { type NextRequest, NextResponse } from "next/server";
import { podpowiedzMiejscowosci } from "@/content/miejscowosci";

/**
 * GET /api/miejscowosci?q=wro — do ośmiu podpowiedzi do pola miejscowości.
 * Indeks żyje w pamięci procesu, więc kolejne zapytania nie czytają pliku.
 */
export function GET(zadanie: NextRequest) {
  const fraza = zadanie.nextUrl.searchParams.get("q") ?? "";
  const wyniki = podpowiedzMiejscowosci(fraza).map((m) => ({
    slug: m.slug,
    nazwa: m.nazwa,
    rodzaj: m.rodzaj,
    gmina: m.gmina,
    powiat: m.powiat,
  }));
  return NextResponse.json(wyniki, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}

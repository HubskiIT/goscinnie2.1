/**
 * GET /api/zdrowie — czy aplikacja umie rozmawiać z bazą.
 *
 * Sprawdza połączenie prawdziwym zapytaniem, nie samym faktem, że proces
 * wstał. Aplikacja, która odpowiada 200 bez działającej bazy, jest gorsza
 * od aplikacji, która nie odpowiada wcale: monitoring milczy, a użytkownik
 * dostaje błędy.
 *
 * Nie zwraca niczego o wnętrzu systemu. Wersja Postgresa, nazwa bazy ani liczba
 * rekordów nie mają się tu pojawić: to endpoint publiczny i pierwsza rzecz,
 * którą ktoś obcy wywoła.
 */
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const zaczeto = Date.now();

  try {
    await db.execute(sql`select 1`);
    return NextResponse.json(
      { stan: "ok", bazaMs: Date.now() - zaczeto },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (blad) {
    console.error("GET /api/zdrowie", blad);
    return NextResponse.json(
      { stan: "baza niedostepna" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}

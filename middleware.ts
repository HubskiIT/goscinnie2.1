/**
 * Nagłówek noindex na **każdej** odpowiedzi, dopóki indeksowanie jest wyłączone.
 *
 * Nagłówek, nie znacznik w treści strony, bo nagłówek obejmuje też odpowiedzi
 * API, pliki i przekierowania, a znacznik w `<head>` tylko HTML. Przy zamykaniu
 * serwisu przed robotami luka w jednym formacie wystarczy, żeby zaindeksowali
 * resztę przez linki.
 */
import { type NextRequest, NextResponse } from "next/server";
import { indeksowanieWlaczone, NAGLOWEK_ROBOTOW, WARTOSC_NAGLOWKA } from "@/lib/indeksowanie";

export function middleware(_zadanie: NextRequest): NextResponse {
  const odpowiedz = NextResponse.next();

  if (!indeksowanieWlaczone()) {
    odpowiedz.headers.set(NAGLOWEK_ROBOTOW, WARTOSC_NAGLOWKA);
  }

  return odpowiedz;
}

export const config = {
  // Wszystko poza zasobami budowania Next.js. Celowo obejmuje /api,
  // bo odpowiedzi API też bywają indeksowane, gdy ktoś je gdzieś podlinkuje.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

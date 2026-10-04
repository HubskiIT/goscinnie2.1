/**
 * Zamiana odmowy z `lib/permissions.ts` na odpowiedź HTTP.
 *
 * Jedno miejsce, bo treść odpowiedzi przy odmowie jest częścią reguły
 * biznesowej, nie kosmetyką. Rozproszona po endpointach prędzej czy później
 * rozjedzie się w tym jednym miejscu, w którym rozjechać się nie może.
 */
import { NextResponse } from "next/server";
import { KOD_HTTP, type PowodOdmowy } from "@/lib/permissions";

/**
 * Komunikaty widoczne dla wywołującego.
 *
 * `zlecenie-nie-przyjmuje-ofert` jest tu celowo ogólne. Zwija trzy przyczyny
 * (zlecenie pełne, zamknięte, wygasłe) w jedno zdanie, bo firma nie widzi
 * liczby ofert. Komunikat „zlecenie ma już dziesięć ofert” oddałby jej dokładnie
 * tę liczbę, a wystarczyłoby próbować, aż odpowiedź się zmieni.
 */
const KOMUNIKATY: Record<PowodOdmowy, string> = {
  "brak-abonamentu": "Składanie ofert i podgląd szczegółów wymagają aktywnego abonamentu.",
  "oferta-juz-zlozona": "Twoja firma złożyła już ofertę na to zlecenie.",
  "zlecenie-nie-przyjmuje-ofert": "To zlecenie nie przyjmuje już ofert.",
  "limit-planu-wyczerpany": "Wykorzystałeś limit ofert w swoim planie.",
  "brak-dostepu": "Nie masz dostępu do tej operacji.",
};

/**
 * Powody, przy których **nie** zdradzamy przyczyny w polu `powod`.
 *
 * Front i tak nie ma co z nim zrobić, a obecność pola byłaby kanałem, przez
 * który firma odróżniłaby zlecenie pełne od zamkniętego. Odpowiedź ma być
 * identyczna co do bajtu niezależnie od przyczyny.
 */
const BEZ_PODANIA_PRZYCZYNY: ReadonlySet<PowodOdmowy> = new Set(["zlecenie-nie-przyjmuje-ofert"]);

export function odpowiedzNaOdmowe(powod: PowodOdmowy): NextResponse {
  if (BEZ_PODANIA_PRZYCZYNY.has(powod)) {
    return NextResponse.json({ blad: KOMUNIKATY[powod] }, { status: KOD_HTTP[powod] });
  }

  return NextResponse.json({ blad: KOMUNIKATY[powod], powod }, { status: KOD_HTTP[powod] });
}

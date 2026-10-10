import { sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cities } from "@/lib/db/schema/geografia";
import { MIN_ZNAKOW_PODPOWIEDZI, PODPOWIEDZI } from "@/lib/miejscowosci";

/**
 * GET /api/miejscowosci?q=wro — do ośmiu podpowiedzi do pola miejscowości.
 *
 * Czyta z tabeli `cities`, a nie z content/miejscowosci.json.gz, bo formularz
 * potrzebuje `cities.id`: bez niego nie ma czym wypełnić `companies.city_id`
 * i firma zostaje bez lokalizacji. W pliku żadnych identyfikatorów nie ma,
 * bo powstaje z danych TERYT przed zasiewem bazy.
 *
 * Dopasowanie i kolejność są **takie same jak w pliku**, bo to samo pole
 * obsługuje wyszukiwarkę katalogu i nie ma się zmienić pod ludźmi:
 *
 *   - bez polskich znaków, więc „lodz" znajduje „Łódź"
 *   - fragment w środku, więc „nwa" znajduje „Nowa Wieś"
 *   - najpierw trafienia od początku nazwy, potem miasta przed wsiami,
 *     potem krótsze nazwy, na końcu alfabetycznie
 */
export async function GET(zadanie: NextRequest) {
  const fraza = zadanie.nextUrl.searchParams.get("q") ?? "";
  const szukana = fraza.trim();

  // Jedna litera pasuje do kilkudziesięciu tysięcy miejscowości i nie zawęża
  // niczego, więc nie ma po co pytać bazy.
  if (szukana.length < MIN_ZNAKOW_PODPOWIEDZI) {
    return NextResponse.json([], { headers: { "Cache-Control": "public, max-age=300" } });
  }

  /*
   * To samo przekształcenie po obu stronach porównania i dokładnie to, na
   * którym stoi indeks cities_nazwa_bez_znakow_trgm_idx z migracji 0009.
   * Rozjazd między tym wyrażeniem a indeksem nie zepsuje wyników, tylko
   * po cichu zamieni dopasowanie na przeglądanie całej tabeli.
   */
  const nazwaBezZnakow = sql`translate(lower(${cities.name}), 'ąćęłńóśźż', 'acelnoszz')`;
  const frazaBezZnakow = sql`translate(lower(${szukana}), 'ąćęłńóśźż', 'acelnoszz')`;

  const wyniki = await db
    .select({
      // Powód istnienia tego endpointu: identyfikator, którego nie ma w pliku.
      id: cities.id,
      slug: cities.slug,
      nazwa: cities.name,
      rodzaj: cities.rodzaj,
      gmina: cities.gmina,
      powiat: cities.powiat,
    })
    .from(cities)
    .where(sql`${nazwaBezZnakow} like '%' || ${frazaBezZnakow} || '%'`)
    .orderBy(
      // Trafienie od początku nazwy przed trafieniem w środku.
      sql`case when ${nazwaBezZnakow} like ${frazaBezZnakow} || '%' then 0 else 1 end`,
      // Waga rodzaju: miasto przed wsią, wieś przed częścią miejscowości.
      sql`case ${cities.rodzaj}
        when 'miasto' then 0
        when 'wieś' then 1
        when 'osada' then 2
        when 'kolonia' then 2
        when 'przysiółek' then 2
        when 'dzielnica Warszawy' then 3
        when 'część miasta' then 4
        when 'część miejscowości' then 5
        else 9
      end`,
      sql`length(${cities.name})`,
      cities.name,
    )
    .limit(PODPOWIEDZI);

  return NextResponse.json(wyniki, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}

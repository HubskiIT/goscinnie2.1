/**
 * Zdjęcia firm. Cały SQL dotyczący `company_photos` mieszka tutaj.
 *
 * KONWENCJA MODUŁU: każda eksportowana funkcja przyjmuje widza jako pierwszy
 * argument i odmawia, zanim dotknie pozostałych. Pilnuje tego
 * tests/konwencja-zapytan.test.ts.
 *
 * Prawo do zdjęć firmy jest tym samym prawem co do jej profilu: ma je członek
 * tej firmy. Dlatego przechodzi przez `mozeEdytowacProfil` z lib/permissions,
 * a nie przez własne sprawdzenie — jedno źródło prawdy, nie dwa.
 */
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Wynik } from "@/lib/db/queries/wynik";
import { companyMembers, companyPhotos } from "@/lib/db/schema/katalog";
import {
  mozeEdytowacProfil,
  upewnijSieZeGalazUprawnienIstnieje,
  type Widz,
} from "@/lib/permissions";

/** Ile zdjęć może mieć jedna firma: jedno główne i dziewięć w galerii. */
export const MAKS_ZDJEC = 10;

export type ZdjecieFirmy = {
  id: string;
  sciezka: string;
  pozycja: number;
  szerokosc: number;
  wysokosc: number;
};

/** Czy ten widz może zmieniać zdjęcia tej firmy. */
async function dostepDoZdjec(widz: Widz, companyId: string): Promise<Wynik<null>> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "zdjecia");

  if (widz.rodzaj === "anonim") return { ok: false, powod: "brak-dostepu" };

  const [czlonkostwo] = await db
    .select({ companyId: companyMembers.companyId })
    .from(companyMembers)
    .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.userId, widz.userId)))
    .limit(1);

  const rozstrzygniecie = mozeEdytowacProfil(widz, czlonkostwo !== undefined);
  if (!rozstrzygniecie.wolno) return { ok: false, powod: rozstrzygniecie.powod };

  return { ok: true, dane: null };
}

/**
 * Zdjęcia firmy, w kolejności od głównego.
 *
 * Czytanie jest publiczne: karta w katalogu pokazuje zdjęcie każdemu, także
 * niezalogowanemu. Ograniczeniem jest tu wyłącznie gałąź uprawnień, która
 * musi istnieć.
 */
export async function pobierzZdjeciaFirmy(widz: Widz, companyId: string): Promise<ZdjecieFirmy[]> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "pobierzZdjeciaFirmy");

  return db
    .select({
      id: companyPhotos.id,
      sciezka: companyPhotos.path,
      pozycja: companyPhotos.position,
      szerokosc: companyPhotos.width,
      wysokosc: companyPhotos.height,
    })
    .from(companyPhotos)
    .where(and(eq(companyPhotos.companyId, companyId), isNull(companyPhotos.archivedAt)))
    .orderBy(asc(companyPhotos.position));
}

export type OdmowaZdjecia = "brak-dostepu" | "limit-zdjec";

/**
 * Dopisuje zdjęcie na pierwszej wolnej pozycji.
 *
 * Pozycja liczona jest w bazie, nie w kodzie: dwa równoległe wysłania
 * policzone w aplikacji dostałyby ten sam numer, a ograniczenie unikalności
 * odrzuciłoby drugie. Pierwsza wolna, a nie „ostatnia plus jeden”, bo po
 * usunięciu zdjęcia z galerii dziura ma się wypełnić, a nie zostać na zawsze.
 */
export async function dodajZdjecie(
  widz: Widz,
  companyId: string,
  zdjecie: { sciezka: string; szerokosc: number; wysokosc: number },
): Promise<
  { ok: true; dane: { id: string; pozycja: number } } | { ok: false; powod: OdmowaZdjecia }
> {
  const dostep = await dostepDoZdjec(widz, companyId);
  if (!dostep.ok) return { ok: false, powod: "brak-dostepu" };

  const wstawione = await db.execute<{ id: string; position: number }>(sql`
    insert into company_photos (company_id, path, position, width, height)
    select
      ${companyId},
      ${zdjecie.sciezka},
      wolna.pozycja,
      ${zdjecie.szerokosc},
      ${zdjecie.wysokosc}
    from (
      select min(kandydat) as pozycja
      from generate_series(0, ${MAKS_ZDJEC - 1}) as kandydat
      where not exists (
        select 1 from company_photos
        where company_id = ${companyId}
          and position = kandydat
          and archived_at is null
      )
    ) as wolna
    where wolna.pozycja is not null
    returning id, position
  `);

  const wiersz = wstawione[0];
  // Brak wiersza znaczy, że wszystkie pozycje są zajęte.
  if (!wiersz) return { ok: false, powod: "limit-zdjec" };

  return { ok: true, dane: { id: wiersz.id, pozycja: Number(wiersz.position) } };
}

/**
 * Usuwa zdjęcie z profilu.
 *
 * `archived_at`, nie `delete` — zasada 5. Plik zostaje w Storage, więc
 * pomyłkę da się cofnąć, a pozycja zwalnia się dla nowego zdjęcia, bo
 * ograniczenie unikalności liczy tylko nieusunięte.
 */
export async function usunZdjecie(
  widz: Widz,
  companyId: string,
  zdjecieId: string,
): Promise<Wynik<null>> {
  const dostep = await dostepDoZdjec(widz, companyId);
  if (!dostep.ok) return dostep;

  const zmienione = await db
    .update(companyPhotos)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(companyPhotos.id, zdjecieId),
        // Identyfikator firmy w warunku, nie tylko identyfikator zdjęcia:
        // bez tego członek jednej firmy skasowałby zdjęcie innej, podając
        // sam identyfikator zdjęcia.
        eq(companyPhotos.companyId, companyId),
        isNull(companyPhotos.archivedAt),
      ),
    )
    .returning({ id: companyPhotos.id });

  if (zmienione.length === 0) return { ok: false, powod: "brak-dostepu" };

  return { ok: true, dane: null };
}

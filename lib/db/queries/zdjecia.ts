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
import { MAKS_ZDJEC } from "@/lib/zdjecia/granice";

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
 *
 * ZAPIS JEST IDEMPOTENTNY WZGLĘDEM `kluczWysylki`. Ponowienie tego samego
 * żądania nie tworzy drugiego zdjęcia, tylko oddaje to, które już powstało,
 * jako wynik udany. Wołający nie ma jak odróżnić pierwszego przejścia od
 * powtórki i to jest zamierzone: dla niego oba znaczą „zdjęcie jest na
 * miejscu”.
 *
 * `on conflict` celuje **wyłącznie** w indeks klucza wysyłki. Kolizja na
 * pozycji dalej rzuca wyjątkiem i tak ma zostać: pozycję wybiera baza, więc
 * kolizja na niej znaczy, że coś jest nie tak z zapytaniem, a nie z wejściem.
 * Cicha zamiana takiej kolizji na „udało się” ukryłaby prawdziwy błąd.
 */
export async function dodajZdjecie(
  widz: Widz,
  companyId: string,
  zdjecie: {
    sciezka: string;
    szerokosc: number;
    wysokosc: number;
    /** Klucz jednej próby wysyłki, sprawdzony Zodem w akcji. */
    kluczWysylki: string;
  },
): Promise<
  { ok: true; dane: { id: string; pozycja: number } } | { ok: false; powod: OdmowaZdjecia }
> {
  const dostep = await dostepDoZdjec(widz, companyId);
  if (!dostep.ok) return { ok: false, powod: "brak-dostepu" };

  const wstawione = await db.execute<{ id: string; position: number }>(sql`
    insert into company_photos (company_id, path, position, width, height, upload_key)
    select
      ${companyId},
      ${zdjecie.sciezka},
      wolna.pozycja,
      ${zdjecie.szerokosc},
      ${zdjecie.wysokosc},
      ${zdjecie.kluczWysylki}
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
    on conflict (company_id, upload_key) where archived_at is null do nothing
    returning id, position
  `);

  const wiersz = wstawione[0];
  if (wiersz) return { ok: true, dane: { id: wiersz.id, pozycja: Number(wiersz.position) } };

  /*
   * Brak wiersza ma teraz dwie możliwe przyczyny i trzeba je rozdzielić,
   * bo znaczą co innego dla człowieka przy formularzu:
   *
   *   1. ta próba już się zapisała, czyli to powtórka tego samego żądania,
   *   2. wszystkie pozycje są zajęte, czyli limit zdjęć.
   *
   * Bez tego rozdzielenia powtórka pokazywałaby „masz już 10 zdjęć”, nawet
   * przy jednym zdjęciu w galerii.
   */
  const [juzZapisane] = await db
    .select({ id: companyPhotos.id, pozycja: companyPhotos.position })
    .from(companyPhotos)
    .where(
      and(
        eq(companyPhotos.companyId, companyId),
        eq(companyPhotos.uploadKey, zdjecie.kluczWysylki),
        isNull(companyPhotos.archivedAt),
      ),
    )
    .limit(1);

  if (juzZapisane) {
    return { ok: true, dane: { id: juzZapisane.id, pozycja: juzZapisane.pozycja } };
  }

  return { ok: false, powod: "limit-zdjec" };
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

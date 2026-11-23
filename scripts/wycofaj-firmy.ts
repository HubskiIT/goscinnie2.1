/**
 * Wycofanie firm z katalogu.
 *
 * PO CO. Katalog zaczyna się od wpisów wprowadzonych ręcznie na próbę.
 * Przed prawdziwym startem trzeba je uprzątnąć, a przy bazie produkcyjnej
 * „uprzątnąć” nie znaczy „skasować”.
 *
 * CZEGO TEN SKRYPT NIE ROBI I NIE BĘDZIE ROBIĆ. Nie wykonuje `DELETE`
 * ani `DROP`. Zasada 5 z CLAUDE.md zakazuje twardego usuwania danych
 * biznesowych i nie ma tu dla niej wyjątku: wiersz firmy wiąże się ze
 * zdjęciami, kategoriami, zgłoszeniami przejęcia i rozliczeniami, więc
 * jego zniknięcie zostawia po sobie dziury w miejscach, w których nikt
 * nie będzie ich szukał.
 *
 * CO ROBI ZAMIAST TEGO. Przestawia status na `suspended`. Dla świata
 * zewnętrznego to jest usunięcie i działa natychmiast:
 *
 *   - lista katalogu pobiera wyłącznie `status = 'active'`
 *     (lib/db/queries/katalog.ts),
 *   - profil zawieszonej firmy zwraca prawdziwe 404, nie pustą stronę
 *     (widocznoscProfilu w lib/permissions.ts).
 *
 * Różnica wobec `DELETE` jest taka, że pomyłka kosztuje jedno polecenie,
 * a nie kopię zapasową.
 *
 * NA SUCHO Z DOMYŚLENIA. Bez `--na-serio` skrypt niczego nie zapisuje,
 * tylko wypisuje, co by zmienił. Przy poleceniu, które jednym przebiegiem
 * zdejmuje cały katalog, odwrotna domyślność jest proszeniem się o wypadek.
 *
 * Użycie:
 *   tsx scripts/wycofaj-firmy.ts                      wypisuje, co by zrobił
 *   tsx scripts/wycofaj-firmy.ts --na-serio           wycofuje wszystkie firmy
 *   tsx scripts/wycofaj-firmy.ts --slug=bar-u-bozenki --na-serio
 *   tsx scripts/wycofaj-firmy.ts --przywroc --na-serio    z powrotem na active
 *
 * Bazę lokalną czyści się prościej i taniej: `pnpm db:reset` stawia ją od
 * zera razem z zasiewem. Ten skrypt jest dla bazy, której nie da się
 * postawić od nowa.
 */
import { eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema/katalog";

type Argumenty = {
  naSerio: boolean;
  przywroc: boolean;
  slugi: readonly string[];
};

function odczytajArgumenty(wejscie: readonly string[]): Argumenty {
  const slugi: string[] = [];
  let naSerio = false;
  let przywroc = false;

  for (const argument of wejscie) {
    if (argument === "--na-serio") {
      naSerio = true;
    } else if (argument === "--przywroc") {
      przywroc = true;
    } else if (argument.startsWith("--slug=")) {
      const slug = argument.slice("--slug=".length).trim();
      if (slug === "") {
        throw new Error("Pusty --slug=. Podaj slug firmy albo pomiń ten argument.");
      }
      slugi.push(slug);
    } else {
      /*
       * Nieznany argument zatrzymuje skrypt, zamiast zostać pominięty.
       * Literówka w „--na-serio” przy cichym pominięciu dałaby przebieg
       * na sucho wyglądający jak wykonany, a przy „--przywroc” odwrotnie:
       * wycofanie zamiast przywrócenia.
       */
      throw new Error(`Nieznany argument: ${argument}`);
    }
  }

  return { naSerio, przywroc, slugi };
}

async function main(): Promise<void> {
  const { naSerio, przywroc, slugi } = odczytajArgumenty(process.argv.slice(2));

  const docelowy = przywroc ? "active" : "suspended";
  const warunek =
    slugi.length > 0 ? inArray(companies.slug, slugi) : ne(companies.status, docelowy);

  const doZmiany = await db
    .select({
      id: companies.id,
      slug: companies.slug,
      nazwa: companies.name,
      status: companies.status,
    })
    .from(companies)
    .where(warunek);

  const dotkniete = doZmiany.filter((firma) => firma.status !== docelowy);

  if (slugi.length > 0) {
    const znalezione = new Set(doZmiany.map((firma) => firma.slug));
    const brakujace = slugi.filter((slug) => !znalezione.has(slug));
    if (brakujace.length > 0) {
      /*
       * Brak dopasowania to błąd, nie brak zmian. Cicho pominięty slug
       * z literówką dałby komunikat „gotowe” przy nietkniętej firmie.
       */
      throw new Error(`Nie ma firm o slugach: ${brakujace.join(", ")}`);
    }
  }

  if (dotkniete.length === 0) {
    console.log(`Nie ma czego zmieniać: żadna firma nie czeka na status ${docelowy}.`);
    return;
  }

  console.log(`Firmy do przestawienia na ${docelowy}: ${dotkniete.length}`);
  for (const firma of dotkniete) {
    console.log(`  ${firma.status} -> ${docelowy}  ${firma.slug}  (${firma.nazwa})`);
  }

  if (!naSerio) {
    console.log("");
    console.log("Przebieg na sucho. Nic nie zapisano. Dopisz --na-serio, żeby wykonać.");
    return;
  }

  // Jedna transakcja: albo cały katalog schodzi, albo nie schodzi nic.
  // Przerwane w połowie wycofanie zostawia katalog w stanie, którego nikt
  // nie umie opisać, a odtworzenie go wymaga pamiętania kolejności.
  await db.transaction(async (tx) => {
    for (const firma of dotkniete) {
      await tx
        .update(companies)
        .set({ status: docelowy, updatedAt: new Date() })
        .where(eq(companies.id, firma.id));
    }
  });

  console.log("");
  console.log(`Zrobione: ${dotkniete.length} firm ma teraz status ${docelowy}.`);
  console.log(
    przywroc
      ? "Firmy wróciły do katalogu."
      : "Firmy zniknęły z katalogu i wyszukiwania. Wiersze zostały w bazie, " +
          "więc przywracasz je przez --przywroc.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((blad: unknown) => {
    console.error(blad instanceof Error ? blad.message : String(blad));
    process.exit(1);
  });

import type { MetadataRoute } from "next";
import { OKAZJE } from "@/content/okazje";
import { adresAplikacji } from "@/lib/adres";
import { pobierzSlugiFirmDoSitemapy } from "@/lib/db/queries/katalog";
import type { Widz } from "@/lib/permissions";
import { PLATNOSCI_WLACZONE } from "@/lib/serwis";
import { firma, okazja, TRASY } from "@/lib/trasy";

/**
 * Mapa witryny.
 *
 * Widz jest **anonimowy i wpisany wprost**, a nie czytany z żądania. Mapa
 * witryny jest jedna dla wszystkich i ma pokazywać dokładnie to, co widzi
 * ktoś bez konta. Gdyby brała widza z sesji, treść zależałaby od tego, kto
 * akurat ją pobrał, a wyszukiwarka dostałaby adresy, do których nie ma wstępu.
 *
 * Profile firm pochodzą z bazy. Wcześniej stały tu trzy przykładowe wpisy
 * z `content/`, wskazujące na ogłoszenia pokazowe — mapa witryny obiecywała
 * wyszukiwarkom treść, która nie jest niczyją prawdziwą firmą.
 *
 * Czego tu nie ma i nie ma mieć: `/moje`, `/panel`, `/wiadomosci`,
 * `/weryfikacja` i `/nowe-haslo`. Wymagają sesji albo tokenu z maila,
 * a `app/robots.ts` zabrania ich indeksowania wprost.
 */
const ANONIM: Widz = { rodzaj: "anonim" };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Liczone przy wywołaniu, nie przy wczytaniu modułu: stała na górze pliku
  // zamarzała na wartości z momentu budowania.
  const adres = adresAplikacji();
  const teraz = new Date();

  const sciezki = [
    TRASY.glowna,
    TRASY.lokale,
    TRASY.uslugodawcy,
    TRASY.zlecenia,
    TRASY.dodajZlecenie,
    TRASY.imprezy,
    TRASY.dlaFirm,
    ...(PLATNOSCI_WLACZONE ? [TRASY.cennik] : []),
    TRASY.kontakt,
    TRASY.logowanie,
    TRASY.rejestracja,
    TRASY.rejestracjaKlienta,
    TRASY.rejestracjaFirmy,
    ...OKAZJE.map((o) => okazja(o.slug)),
  ];

  /*
   * Awaria bazy nie może wywrócić mapy witryny.
   *
   * `sitemap.xml` bez profili jest niekompletny, ale `sitemap.xml`, które
   * oddaje 500, znika z indeksu w całości razem ze stronami statycznymi.
   * Tańszy błąd wygrywa.
   */
  let profile: { slug: string; zmieniono: Date }[] = [];
  try {
    profile = await pobierzSlugiFirmDoSitemapy(ANONIM);
  } catch (blad) {
    console.error("Mapa witryny: nie udało się pobrać profili firm:", blad);
  }

  return [
    ...sciezki.map((sciezka) => ({
      url: new URL(sciezka, adres).toString(),
      lastModified: teraz,
    })),
    ...profile.map((p) => ({
      url: new URL(firma(p.slug), adres).toString(),
      lastModified: p.zmieniono,
    })),
  ];
}

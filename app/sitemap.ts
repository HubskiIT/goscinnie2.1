import type { MetadataRoute } from "next";
import { OKAZJE } from "@/content/okazje";
import { adresAplikacji } from "@/lib/adres";
import { firma, impreza, okazja, PRZYKLADY, TRASY } from "@/lib/trasy";

export default function sitemap(): MetadataRoute.Sitemap {
  // Liczone przy wywołaniu, nie przy wczytaniu modułu: stała na górze pliku
  // zamarzała na wartości z momentu budowania.
  const adres = adresAplikacji();

  const sciezki = [
    TRASY.glowna,
    TRASY.lokale,
    TRASY.uslugodawcy,
    TRASY.zlecenia,
    TRASY.dodajZlecenie,
    TRASY.imprezy,
    TRASY.dlaFirm,
    TRASY.cennik,
    TRASY.kontakt,
    TRASY.logowanie,
    TRASY.rejestracjaFirmy,
    firma(PRZYKLADY.lokal),
    firma(PRZYKLADY.wpisBezProfilu),
    impreza(PRZYKLADY.impreza),
    ...OKAZJE.map((o) => okazja(o.slug)),
  ];

  return sciezki.map((sciezka) => ({
    url: new URL(sciezka, adres).toString(),
    lastModified: new Date(),
  }));
}

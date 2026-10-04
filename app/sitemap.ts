import type { MetadataRoute } from "next";
import { OKAZJE } from "@/content/okazje";
import { firma, impreza, okazja, PRZYKLADY, TRASY } from "@/lib/trasy";

const ADRES = process.env.APP_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
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
    url: new URL(sciezka, ADRES).toString(),
    lastModified: new Date(),
  }));
}

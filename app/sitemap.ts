import type { MetadataRoute } from "next";
import { firma, impreza, PRZYKLADY, TRASY } from "@/lib/trasy";

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
  ];

  return sciezki.map((sciezka) => ({
    url: new URL(sciezka, ADRES).toString(),
    lastModified: new Date(),
  }));
}

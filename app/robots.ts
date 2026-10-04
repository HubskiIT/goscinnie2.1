import type { MetadataRoute } from "next";

/**
 * Serwis jest zamknięty dla wyszukiwarek do czasu wejścia pierwszej prawdziwej
 * firmy. Punkt 6.5 planu: przykładowe ogłoszenia nie mogą trafić do Google.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}

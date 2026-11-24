import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { adresAplikacji } from "@/lib/adres";
import { robotyWMetadanych } from "@/lib/indeksowanie";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin", "latin-ext"],
  variable: "--font-figtree",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  display: "swap",
});

const OPIS =
  "Miejsca i ludzie na każdą okazję, od chrzcin po firmową wigilię. Zero prowizji od umów.";

/**
 * Metadane wspólne dla całego serwisu.
 *
 * Funkcja, nie stała na górze modułu, bo czyta dwie rzeczy, które stała
 * zamroziłaby na wartości z momentu budowania: adres aplikacji i flagę
 * indeksowania. Dokładnie ten błąd opisuje komentarz w `app/sitemap.ts`,
 * a tutaj kosztowałby więcej: zdjęcie blokady indeksowania wymagałoby
 * wdrożenia, choć `lib/indeksowanie.ts` obiecuje jedną zmienną bez wdrożenia.
 *
 * CZEGO TU CELOWO NIE MA
 *
 * `alternates.canonical` i `openGraph.url`. Metadane w App Routerze są
 * dziedziczone, a strona, która nie poda swojego adresu, odziedziczyłaby
 * adres podany tutaj. Canonical wskazujący stronę główną na każdej podstronie
 * mówi wyszukiwarce, że cały serwis to jedna strona, czyli kasuje katalog
 * z indeksu skuteczniej niż `noindex`. Adres własny podaje każda strona
 * osobno, przez `kanoniczne()` z `lib/metadane.ts`.
 */
export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(adresAplikacji()),
    title: {
      default: "Gościnnie, sale i usługodawcy na każdą okazję",
      // Podstrony podają samą swoją nazwę, markę dokłada szablon.
      template: "%s | Gościnnie",
    },
    description: OPIS,
    applicationName: "Gościnnie",
    robots: robotyWMetadanych(),
    openGraph: {
      type: "website",
      locale: "pl_PL",
      siteName: "Gościnnie",
      title: "Gościnnie, sale i usługodawcy na każdą okazję",
      description: OPIS,
    },
    twitter: {
      // `summary_large_image`, nie `summary`: przy samym `summary` obrazek
      // jedzie w odpowiedzi, a podgląd pokazuje kwadracik przy tekście.
      card: "summary_large_image",
      title: "Gościnnie, sale i usługodawcy na każdą okazję",
      description: OPIS,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${figtree.variable} ${fraunces.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  );
}

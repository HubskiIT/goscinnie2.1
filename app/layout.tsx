import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Gościnnie - Lokale, Usługodawcy, Zlecenia, Imprezy",
  description:
    "Miejsca i ludzie na każdą okazję, od chrzcin po firmową wigilię. Zero prowizji od umów.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Gościnnie",
    description: "Miejsca i ludzie na każdą okazję.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${figtree.variable} ${fraunces.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  );
}

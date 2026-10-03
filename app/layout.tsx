import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gościnnie, prototyp serwisu - Lokale, Usługodawcy, Zlecenia, Imprezy',
  description: 'Miejsca i ludzie na każdą okazję, od chrzcin po firmową wigilię. Zero prowizji od umów.',
  openGraph: {
    title: 'Gościnnie, prototyp serwisu',
    description: 'Miejsca i ludzie na każdą okazję. Prototyp platformy Gościnnie.',
    type: 'website',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pl">
      <body suppressHydrationWarning className="antialiased">{children}</body>
    </html>
  );
}

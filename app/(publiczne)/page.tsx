import type { Metadata } from "next";
import { headers } from "next/headers";
import { MainScreen } from "@/components/screens/MainScreen";
import { widzZZadania } from "@/lib/auth/widz";
import { pobierzImprezy } from "@/lib/db/queries/imprezy";
import { lokaleZBazy } from "@/lib/katalog";
import { TRASY } from "@/lib/trasy";

/*
 * Tytuł `absolute`, nie zwykły napis: szablon z `app/layout.tsx` dokleja
 * „| Gościnnie", więc tytuł „Gościnnie" dałby „Gościnnie | Gościnnie".
 * Strona główna jest jedynym miejscem, gdzie marka stoi w tytule sama.
 */
export const metadata: Metadata = {
  title: { absolute: "Gościnnie, sale i usługodawcy na każdą okazję" },
  description:
    "Sale, lokale i usługodawcy na wesela, komunie, chrzciny, osiemnastki i przyjęcia firmowe. Wystaw zlecenie i odbierz oferty. Klient nie płaci prowizji.",
  alternates: { canonical: TRASY.glowna },
  openGraph: { url: TRASY.glowna },
};

export default async function Strona() {
  const widz = await widzZZadania(await headers());
  const [lokale, imprezy] = await Promise.all([
    lokaleZBazy(widz),
    pobierzImprezy(widz, { okazja: null, miejscowosc: null, od: null, do: null }),
  ]);

  return <MainScreen lokale={lokale.slice(0, 6)} imprezy={imprezy.slice(0, 6)} />;
}

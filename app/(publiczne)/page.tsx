import type { Metadata } from "next";
import { MainScreen } from "@/components/screens/MainScreen";
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

export default function Strona() {
  return <MainScreen />;
}

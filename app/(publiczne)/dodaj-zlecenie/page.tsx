import type { Metadata } from "next";
import { headers } from "next/headers";
import { NoweZlecenieScreen } from "@/components/screens/NoweZlecenieScreen";
import { widzZZadania } from "@/lib/auth/widz";

export const metadata: Metadata = {
  title: "Wystaw zlecenie",
  description: "Opisz raz, czego szukasz, a firmy same przyślą oferty. Bezpłatnie.",
};

/**
 * Strona jest dostępna dla niezalogowanych i to jest decyzja, nie przeoczenie:
 * wejścia z wyszukiwarki prowadzą wprost tutaj, a ekran zaczynający się od
 * żądania konta odbija większość z nich. Zapis i tak wymaga konta, czego
 * pilnują dwie bariery w `lib/akcje/zlecenia.ts` i `lib/db/queries/requests.ts`.
 */
export default async function Strona() {
  const widz = await widzZZadania(await headers());

  return <NoweZlecenieScreen zalogowany={widz.rodzaj !== "anonim"} />;
}

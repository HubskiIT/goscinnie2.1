import type { Metadata } from "next";
import { Suspense } from "react";
import { LogowanieScreen } from "@/components/screens/LogowanieScreen";
import { metadaneBezIndeksu } from "@/lib/metadane";

export const metadata: Metadata = metadaneBezIndeksu("Logowanie", "Zaloguj się do Gościnnie.");

/**
 * Granica Suspense, bo ekran czyta `?haslo=zmienione` z adresu.
 *
 * Bez niej budowanie produkcyjne przerywa się na prerenderowaniu tej strony
 * komunikatem „useSearchParams() should be wrapped in a suspense boundary".
 * To samo wywaliło wcześniej wdrożenie na stronie /weryfikacja.
 */
export default function Strona() {
  return (
    <Suspense fallback={null}>
      <LogowanieScreen />
    </Suspense>
  );
}

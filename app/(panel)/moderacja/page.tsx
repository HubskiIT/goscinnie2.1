import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ModeracjaScreen } from "@/components/screens/ModeracjaScreen";
import { widzZZadania } from "@/lib/auth/widz";
import { pobierzKolejke } from "@/lib/db/queries/moderacja";

export const metadata: Metadata = {
  title: "Moderacja",
  description: "Wpisy czekające na decyzję.",
};

/**
 * Panel moderacji.
 *
 * DLACZEGO `notFound`, A NIE PRZEKIEROWANIE NA LOGOWANIE ANI EKRAN „BRAK
 * UPRAWNIEŃ”. Dla kogoś bez roli ten adres ma nie istnieć. Strona mówiąca
 * „nie masz uprawnień” potwierdza, że panel moderacji jest pod tym adresem,
 * a przekierowanie na logowanie sugeruje, że wystarczy się zalogować.
 * Jedno i drugie to wskazówka dla kogoś, kto szuka drzwi.
 *
 * Layout panelu odsyła anonima na logowanie, więc tutaj zostają zalogowani
 * bez roli i oni dostają czyste 404.
 */
export default async function Strona() {
  const widz = await widzZZadania(await headers());
  const kolejka = await pobierzKolejke(widz);

  if (!kolejka.ok) notFound();

  return <ModeracjaScreen pozycje={kolejka.dane} />;
}

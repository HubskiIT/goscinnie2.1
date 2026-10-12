import type { Metadata } from "next";
import { headers } from "next/headers";
import { StanPusty } from "@/components/StanPusty";
import { MojeScreen } from "@/components/screens/MojeScreen";
import { widzZZadania } from "@/lib/auth/widz";
import { pobierzProfilKlienta } from "@/lib/db/queries/konto";
import { pobierzMojeZlecenia } from "@/lib/db/queries/requests";

export const metadata: Metadata = {
  title: "Moje zlecenia",
  description: "Twoje zlecenia, oferty i dane kontaktowe w Gościnnie.",
};

export default async function Strona() {
  const widz = await widzZZadania(await headers());
  const [profil, zlecenia] = await Promise.all([
    pobierzProfilKlienta(widz),
    pobierzMojeZlecenia(widz),
  ]);

  /*
   * Stan błędu, nie pusty ekran: layout panelu odsyła anonima do logowania,
   * więc brak profilu znaczy, że konto zniknęło w trakcie sesji albo baza
   * nie odpowiedziała. Jedno i drugie wymaga powiedzenia tego wprost.
   */
  if (!profil) {
    return (
      <StanPusty
        tytul="Nie udało się wczytać Twoich danych"
        opis="Zaloguj się jeszcze raz. Jeśli to się powtórzy, daj nam znać."
        akcja={{ etykieta: "Zaloguj się", adres: "/logowanie" }}
      />
    );
  }

  return <MojeScreen profil={profil} zlecenia={zlecenia} />;
}

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { widzZZadania } from "@/lib/auth/widz";

/**
 * Panel jest tylko dla zalogowanych.
 *
 * Sprawdzane w layoucie, bo obejmuje wszystkie trasy pod nim naraz: `/panel`,
 * `/moje` i `/wiadomosci`. Strona po stronie, każda nowa podstrona panelu
 * wymagałaby pamiętania o tym osobno, a pamięć człowieka nie jest mechanizmem
 * kontroli dostępu.
 *
 * Wcześniej panel otwierał się każdemu bez sesji. Nie wyciekało tędy nic
 * z bazy, bo ekrany czytają jeszcze z `content/`, ale to kwestia etapu prac,
 * nie zabezpieczenia: pierwszy ekran podłączony do zapytań pokazałby dane
 * firmy komukolwiek, kto zna adres.
 */
export default async function LayoutPanelu({ children }: { children: React.ReactNode }) {
  const widz = await widzZZadania(await headers());

  if (widz.rodzaj === "anonim") {
    redirect("/logowanie");
  }

  return (
    <>
      <Header zalogowany />
      {children}
    </>
  );
}

import type { Metadata } from "next";
import { headers } from "next/headers";
import { ZleceniaScreen } from "@/components/screens/ZleceniaScreen";
import { widzZZadania } from "@/lib/auth/widz";
import { odczytajKryteriaZlecen, wyszukajZlecenia } from "@/lib/filtry";
import { metadaneStrony } from "@/lib/metadane";
import { widocznoscZlecenia } from "@/lib/permissions";
import { TRASY } from "@/lib/trasy";
import { pelnyZakresGieldy, zlecenieDoPokazania } from "@/lib/zlecenia-widok";

export const metadata: Metadata = metadaneStrony({
  tytul: "Giełda zleceń",
  opis: "Zlecenia od klientów szukających lokalu i usług. Przeglądaj okazje w swojej okolicy.",
  sciezka: TRASY.zlecenia,
});

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Zakres widoczności ustala się tutaj, na serwerze, z sesji.
 *
 * Wcześniej rozstrzygał o tym przełącznik „Tryb podglądu giełdy” w pasku nad
 * stroną: ekran dostawał komplet danych, a stan `isSubscriber` decydował,
 * którą wersję narysować. To nie była ściana, tylko zasłonka — pełny opis
 * i budżet jechały do przeglądarki każdego, kto wszedł na adres.
 *
 * Strona jest publiczna, więc `widzZZadania` dla kogoś bez sesji odda anonima
 * i to jest właściwy kierunek pomyłki: anonim widzi najmniej.
 */
export default async function Strona({ searchParams }: Props) {
  const kryteria = odczytajKryteriaZlecen(await searchParams);
  const widz = await widzZZadania(await headers());
  const widocznosc = widocznoscZlecenia(widz);

  const zlecenia = wyszukajZlecenia(kryteria).map((zlecenie) =>
    zlecenieDoPokazania(zlecenie, widocznosc),
  );

  return (
    <ZleceniaScreen
      zlecenia={zlecenia}
      kryteria={kryteria}
      pelnyZakres={pelnyZakresGieldy(widocznosc)}
    />
  );
}

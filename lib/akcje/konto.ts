"use server";

/**
 * Edycja profilu klienta na /moje.
 *
 * SQL-u tu nie ma: zapis mieszka w `lib/db/queries/konto.ts`. Tutaj zostaje
 * walidacja wejścia, ustalenie widza i tłumaczenie wyniku na stan formularza.
 *
 * Identyfikatora użytkownika ta akcja nie przyjmuje i nie ma przyjmować.
 * Zapis idzie zawsze na konto tego, kto pyta.
 */
import { headers } from "next/headers";
import { widzZZadania } from "@/lib/auth/widz";
import { zapiszProfilKlienta as zapiszWBazie } from "@/lib/db/queries/konto";
import { bledyZod, type StanFormularza } from "@/lib/formularze";
import { daneProfiluKlienta } from "@/lib/validators/konto";

export async function zapiszProfilKlienta(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = daneProfiluKlienta.safeParse(wejscie);

  if (!wynik.success) return bledyZod(wynik.error, wejscie);

  const widz = await widzZZadania(await headers());
  const zapis = await zapiszWBazie(widz, wynik.data);

  if (!zapis.ok) {
    return {
      status: "bledy",
      bledy: { _: ["Nie udało się zapisać profilu. Zaloguj się jeszcze raz i spróbuj ponownie."] },
      wartosci: {},
    };
  }

  /*
   * „zapisano" nie renderuje nic, bo w kreatorze o udanym zapisie mówi
   * przejście do kolejnego kroku. Tutaj nic się nie przesuwa, więc człowiek
   * bez komunikatu nie wie, czy kliknięcie w ogóle zadziałało.
   */
  return { status: "informacja", tresc: "Zapisano zmiany w profilu." };
}

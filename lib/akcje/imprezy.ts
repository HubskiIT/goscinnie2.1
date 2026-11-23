"use server";

/**
 * Akcje imprez: dodanie zapowiedzi przez lokal.
 *
 * Co tu jest: ustalenie widza, walidacja wejścia, zgłoszenie do moderacji
 * i tłumaczenie wyniku na stan formularza. SQL-u nie ma ani jednej linii,
 * bo cały mieszka w `lib/db/queries/imprezy.ts` — zasada 3 z CLAUDE.md.
 *
 * FIRMY NIE BIERZEMY Z FORMULARZA. Bierze się z widza: `widzZZadania`
 * rozpoznaje członkostwo i oddaje `companyId`. Identyfikator przysłany
 * z przeglądarki byłby polem, które da się podmienić, czyli drogą do
 * dopisania imprezy do cudzej sali.
 */
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { widzZZadania } from "@/lib/auth/widz";
import { utworzImpreze } from "@/lib/db/queries/imprezy";
import { zglosDoModeracji } from "@/lib/db/queries/moderacja";
import { bledyZod, type StanFormularza } from "@/lib/formularze";
import { daneNowejImprezy } from "@/lib/validators/imprezy";

export async function dodajImpreze(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = daneNowejImprezy.safeParse(wejscie);
  if (!wynik.success) return bledyZod(wynik.error, wejscie);

  const widz = await widzZZadania(await headers());

  /*
   * Tylko widz rozpoznany jako firma ma `companyId`. Klient, anonim
   * i moderator dostają tę samą odmowę: żadne z nich nie działa
   * w imieniu lokalu.
   */
  if (widz.rodzaj !== "firma") {
    return {
      status: "informacja",
      waga: "ostrzezenie",
      tresc: "Imprezy dodaje lokal. Zaloguj się na konto firmy, która ją organizuje.",
    };
  }

  const zapis = await utworzImpreze(widz, widz.companyId, {
    nazwa: wynik.data.nazwa,
    okazja: wynik.data.okazja,
    innaOkazja: wynik.data.innaOkazja,
    data: wynik.data.data,
    godzinaOd: wynik.data.godzinaOd,
    godzinaDo: wynik.data.godzinaDo,
    cenaBiletu: wynik.data.cenaBiletu,
    opis: wynik.data.opis,
    dlaDoroslych: wynik.data.dlaDoroslych,
  });

  if (!zapis.ok) {
    if (zapis.powod === "nie-lokal") {
      return {
        status: "informacja",
        waga: "ostrzezenie",
        tresc:
          "Imprezy organizują lokale. Twój wpis jest wpisem usługodawcy, " +
          "więc nie ma gdzie się odbyć.",
      };
    }
    if (zapis.powod === "nieznana-okazja") {
      return {
        status: "bledy",
        bledy: { okazja: ["Wybierz okazję z listy."] },
        wartosci: Object.fromEntries(
          Object.entries(wejscie).map(([k, v]) => [k, typeof v === "string" ? v : ""]),
        ),
      };
    }
    return {
      status: "informacja",
      waga: "ostrzezenie",
      tresc: "Nie udało się zapisać imprezy. Odśwież stronę i spróbuj ponownie.",
    };
  }

  /*
   * Zgłoszenie do moderacji poza transakcją zapisu i to jest świadome.
   * Impreza bez zgłoszenia jest niewidoczna, czyli stan bezpieczny:
   * gość jej nie zobaczy, a lokal ma ją u siebie i może zgłosić ponownie.
   * Odwrotna kolejność, czyli zgłoszenie bez imprezy, zostawiłaby
   * w kolejce wiersz wskazujący w pustkę.
   */
  await zglosDoModeracji(widz, "event", zapis.dane.id);

  revalidatePath("/panel/imprezy");
  revalidatePath("/imprezy");

  return {
    status: "informacja",
    tresc:
      "Impreza zapisana i wysłana do sprawdzenia. Pokaże się w zapowiedziach, " +
      "gdy ją zatwierdzimy. Odezwiemy się mailem.",
  };
}

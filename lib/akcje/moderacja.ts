"use server";

import { revalidatePath } from "next/cache";
/**
 * Akcje panelu moderacji: przyjęcie wpisu i odesłanie go z komentarzem.
 *
 * Co tu jest: ustalenie widza, walidacja wejścia, zawiadomienie właściciela
 * i tłumaczenie wyniku na stan formularza. SQL-u nie ma ani jednej linii,
 * bo cały mieszka w `lib/db/queries/moderacja.ts` — zasada 3 z CLAUDE.md.
 *
 * KOLEJNOŚĆ JEST CZĘŚCIĄ PROJEKTU: najpierw decyzja, potem list. Decyzja ma
 * zapaść także wtedy, gdy poczta leży, bo wpis czekający w kolejce blokuje
 * człowieka po drugiej stronie. Nieudana wysyłka kończy się ostrzeżeniem
 * dla moderatora, a nie cofnięciem decyzji: cofnięta zgoda z powodu awarii
 * Resenda byłaby najgorszym z możliwych wyników.
 */
import { headers } from "next/headers";
import { adresAplikacji } from "@/lib/adres";
import { widzZZadania } from "@/lib/auth/widz";
import { type Decyzja, pobierzAdresataDecyzji, rozstrzygnij } from "@/lib/db/queries/moderacja";
import { bledyZod, type StanFormularza } from "@/lib/formularze";
import { pobierzNadawce } from "@/lib/poczta";
import { decyzjaModeracjiWpisu } from "@/lib/poczta/szablony";
import { daneDecyzjiModeracji } from "@/lib/validators/moderacja";

export async function rozstrzygnijZgloszenie(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = daneDecyzjiModeracji.safeParse(wejscie);
  if (!wynik.success) return bledyZod(wynik.error, wejscie);

  const widz = await widzZZadania(await headers());

  const decyzja: Decyzja =
    wynik.data.decyzja === "zgoda"
      ? { rodzaj: "zgoda" }
      : { rodzaj: "odmowa", powod: wynik.data.powod };

  const rozstrzygniete = await rozstrzygnij(widz, wynik.data.zgloszenieId, decyzja);
  if (!rozstrzygniete.ok) {
    /*
     * Jedna odpowiedź na brak uprawnień i na zgłoszenie rozstrzygnięte
     * przez kogoś innego w międzyczasie. Dla moderatora wniosek jest ten
     * sam: nie ma tu nic do zrobienia, odśwież listę.
     */
    return {
      status: "informacja",
      waga: "ostrzezenie",
      tresc: "Tego zgłoszenia już nie ma w kolejce. Odśwież listę.",
    };
  }

  const wpis = rozstrzygniete.dane;
  revalidatePath("/moderacja");

  const adresat = await pobierzAdresataDecyzji(widz, wpis.subjectKind, wpis.subjectId);
  if (!adresat.ok || adresat.dane === null) {
    /*
     * Decyzja zapadła, tylko nie ma komu o niej napisać: zgłoszenie dotyczy
     * przedmiotu, którego ta funkcja jeszcze nie rozpoznaje (impreza,
     * zlecenie). Mówimy o tym wprost, zamiast milczeć, bo moderator ma
     * wiedzieć, że właściciel się nie dowie.
     */
    return {
      status: "informacja",
      waga: "ostrzezenie",
      tresc: "Decyzja zapisana, ale nie wysłaliśmy powiadomienia: nie znaleźliśmy adresata.",
    };
  }

  try {
    const nadawca = await pobierzNadawce();
    await nadawca.wyslij(
      decyzjaModeracjiWpisu(
        adresat.dane.email,
        adresat.dane.nazwaFirmy,
        decyzja,
        `${adresAplikacji()}/panel`,
      ),
    );
  } catch {
    /*
     * Awaria poczty nie cofa decyzji. Właściciel i tak zobaczy stan wpisu
     * w panelu, bo panel czyta z bazy, a nie ze skrzynki. Moderator dostaje
     * ostrzeżenie, żeby wiedział, że list nie poszedł, i mógł napisać sam.
     */
    return {
      status: "informacja",
      waga: "ostrzezenie",
      tresc: `Decyzja zapisana, ale powiadomienie nie poszło na ${adresat.dane.email}. Napisz ręcznie.`,
    };
  }

  return {
    status: "informacja",
    tresc:
      decyzja.rodzaj === "zgoda"
        ? `„${adresat.dane.nazwaFirmy}” jest w katalogu. Właściciel dostał powiadomienie.`
        : `„${adresat.dane.nazwaFirmy}” wróciła do poprawki. Właściciel dostał Twój komentarz.`,
  };
}

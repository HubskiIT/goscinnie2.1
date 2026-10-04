/**
 * Ustalenie, kto pyta.
 *
 * Dwa poziomy, bo „autor” nie jest rolą globalną, tylko relacją do konkretnego
 * zlecenia. Ten sam człowiek jest autorem swojego zlecenia i zwykłym klientem
 * przy cudzym.
 *
 *   widzZZadania         kim jest ten człowiek w ogóle
 *   widzWKontekscieZlecenia   kim jest przy tym jednym zleceniu
 */
import { auth } from "@/lib/auth";
import type { Widz } from "@/lib/permissions";
import { czlonkostwoUzytkownika } from "./firma";

/**
 * Widz na podstawie ciasteczka sesji. Brak sesji, sesja wygasła albo
 * uszkodzona: anonim. To jest bezpieczny kierunek pomyłki, bo anonim
 * widzi najmniej.
 */
export async function widzZZadania(naglowki: Headers): Promise<Widz> {
  const sesja = await auth.api.getSession({ headers: naglowki });
  if (!sesja?.user?.id) {
    return { rodzaj: "anonim" };
  }

  // Przynależność do firmy rozstrzyga tabela company_members, nie kolumna
  // `role` w `users`. Kolumna mówi, kim ktoś jest z grubsza, a nie w czyim
  // imieniu działa w tym żądaniu.
  const czlonkostwo = await czlonkostwoUzytkownika(sesja.user.id);

  if (czlonkostwo) {
    return {
      rodzaj: "firma",
      userId: sesja.user.id,
      companyId: czlonkostwo.companyId,
      // Stan liczony datą przy tym żądaniu. Nie ma tu żadnej pamięci ani cache:
      // abonament, który wygasł minutę temu, jest wygasły od następnego żądania.
      abonament: czlonkostwo.abonament,
    };
  }

  // Moderator wejdzie razem z panelem moderacji.
  return { rodzaj: "klient", userId: sesja.user.id };
}

/**
 * Podnosi klienta do autora, gdy pyta o własne zlecenie.
 *
 * Kierunek jest tylko jeden: z klienta na autora. Nikogo nie da się tą funkcją
 * obniżyć ani przemianować na firmę, bo wtedy byłaby drugim, ukrytym miejscem
 * przyznawania uprawnień obok lib/permissions.ts.
 */
export function widzWKontekscieZlecenia(widz: Widz, autorZleceniaUserId: string): Widz {
  /*
   * Autorem jest się względem zlecenia, a nie względem roli w systemie.
   *
   * Uwzględniamy tu także widza rozpoznanego jako firma, bo właściciel sali
   * bywa jednocześnie klientem: organizuje komunię córki i wystawia własne
   * zlecenie. Pierwsza wersja podnosiła wyłącznie klienta, więc taki człowiek
   * przestawał widzieć własny opis i budżet w chwili, w której dopisano go
   * do jakiejkolwiek firmy.
   *
   * Wyszło to dopiero wtedy, gdy zasiew po raz pierwszy dał tej samej osobie
   * konto klienta i członkostwo w firmie. Wcześniej te dwa zbiory się nie
   * przecinały i błąd był niewidoczny.
   */
  const mozeBycAutorem = widz.rodzaj === "klient" || widz.rodzaj === "firma";

  if (mozeBycAutorem && widz.userId === autorZleceniaUserId) {
    return { rodzaj: "autor", userId: widz.userId };
  }
  return widz;
}

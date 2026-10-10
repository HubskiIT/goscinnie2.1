/**
 * Wspólny stan formularza odsyłany z akcji serwerowej do komponentu.
 *
 * Decyzja z 3 października 2026: zapis jeszcze nie istnieje. Poprawnie
 * wypełniony formularz kończy się komunikatem, że serwis jest w budowie.
 * Nic nigdzie nie trafia i niczego nie zapisujemy.
 */
export type StanFormularza =
  | { status: "poczatkowy" }
  | { status: "bledy"; bledy: Record<string, string[]>; wartosci: Record<string, string> }
  | { status: "wbudowie" }
  /**
   * Zapis się udał.
   *
   * Osobny stan, a nie powrót do „poczatkowy”: kreator przechodzi do kolejnego
   * kroku dopiero po udanym zapisie, a „poczatkowy” znaczy „nic się jeszcze nie
   * stało”. Gdy jedno i drugie wyglądało tak samo, nie dało się odróżnić zapisu
   * od jego braku i każdy kreator musiał zakładać, że cisza znaczy sukces.
   */
  | { status: "zapisano" };

export const STAN_POCZATKOWY: StanFormularza = { status: "poczatkowy" };

/** Po nieudanej walidacji wpisane dane wracają do pól, zamiast znikać. */
export function wartoscPola(stan: StanFormularza, pole: string): string {
  return stan.status === "bledy" ? (stan.wartosci[pole] ?? "") : "";
}

export const KOMUNIKAT_W_BUDOWIE =
  "Serwis jest w budowie, wysyłanie ruszy wkrótce. Twoje dane nie zostały nigdzie zapisane.";

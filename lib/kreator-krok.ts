/**
 * Na którym kroku wznowić kreator po odświeżeniu strony.
 *
 * Osobny moduł, bo liczy to serwer przy wejściu na stronę, a wynik czyta
 * komponent kliencki. Bez tego odświeżenie przeglądarki w połowie kreatora
 * cofało wszystko do kroku pierwszego, choć szkic firmy siedział już w bazie.
 */

/** Stan szkicu widziany przez kreator. Tyle, ile potrzeba do wznowienia. */
export type SzkicKreatora = {
  nazwa: string;
  opis: string;
  /** W groszach, jak w bazie. Komponent pokazuje złotówki. */
  cenaOd: number | null;
  pojemnoscMin: number | null;
  pojemnoscMax: number | null;
  kategoria: string | null;
  miejscowosc: string | null;
  cityId: string | null;
  maNip: boolean;
  /** Firma jest już w katalogu, a kreator służy do poprawek. */
  opublikowany: boolean;
};

export type Krok = 1 | 2 | 3 | 4 | 6;

/**
 * Pierwszy krok, na którym jest jeszcze coś do zrobienia.
 *
 * Kolejność sprawdzeń odpowiada kolejności kroków, więc człowiek wraca tam,
 * gdzie skończył, a nie na koniec kreatora z pustymi polami. Komplet danych
 * daje krok publikacji.
 *
 * `zalogowany` rozstrzyga o kroku pierwszym, bo krok pierwszy to zakładanie
 * konta, a nie zapis czegokolwiek o firmie. Kto ma już konto, ten ma ten krok
 * za sobą, choćby jeszcze nie tknął kreatora: inaczej zalogowany człowiek bez
 * firmy wracał na ekran rejestracji i nie miał jak z niego wyjść, bo jego
 * adres jest już zajęty.
 */
export function krokDlaSzkicu(szkic: SzkicKreatora | null, zalogowany: boolean): Krok {
  if (!zalogowany) return 1;
  if (!szkic) return 2;
  if (!szkic.kategoria) return 2;
  if (!szkic.nazwa.trim() || !szkic.opis.trim() || !szkic.cityId) return 3;
  if (!szkic.maNip) return 4;
  return 6;
}

/**
 * Krok, od którego zaczyna kreator, z uwzględnieniem `?krok=` z adresu.
 *
 * Adres traktujemy jako życzenie, które wolno spełnić **tylko w tył**. Wejście
 * wprost na `?krok=6` przeskakiwało cały kreator i pokazywało podsumowanie
 * firmy bez nazwy, kategorii i lokalizacji; serwer takiej firmy i tak nie
 * opublikuje, ale człowiek dowiadywał się o tym dopiero po kliknięciu.
 *
 * W tył wolno, bo poprawianie wcześniejszego kroku to normalna rzecz.
 */
export function krokPoczatkowy(
  zadany: string | null,
  szkic: SzkicKreatora | null,
  zalogowany: boolean,
): Krok {
  const osiagalny = krokDlaSzkicu(szkic, zalogowany);
  const minimalny = zalogowany ? 2 : 1;

  /*
   * Dopasowanie całego napisu, a nie `parseInt`.
   *
   * `parseInt` urywa, co nie pasuje: „2.9" czyta jako 2, a „2abc" też jako 2.
   * Adres, który nie jest wprost numerem kroku, jest śmieciem i ma zostać
   * zignorowany, a nie zaokrąglony do czegoś, czego nikt nie prosił.
   */
  const liczba = /^\d+$/.test(zadany ?? "") ? Number(zadany) : Number.NaN;

  const dozwolone: Krok[] = [1, 2, 3, 4, 6];
  const trafiony = dozwolone.find((krok) => krok === liczba);

  if (trafiony !== undefined && trafiony <= osiagalny && trafiony >= minimalny) {
    return trafiony;
  }
  return osiagalny;
}

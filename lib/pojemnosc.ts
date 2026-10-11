/**
 * Pojemność wpisana w kreatorze jednym polem tekstowym.
 *
 * Ludzie piszą to różnie: „140”, „do 140 osób”, „40-140”, „od 40 do 140”.
 * Wcześniej kreator brał pierwszą liczbę z tekstu jako maksimum, więc
 * „40-140” zapisywało salę na czterdzieści osób, a sala znikała z wyników
 * dla każdego przyjęcia powyżej czterdziestu gości.
 *
 * Jedna liczba to maksimum. Dwie liczby to przedział, mniejsza jest
 * minimum. Więcej liczb niż dwie albo żadnej: pole traktujemy jako puste.
 */
export type Pojemnosc = { min: number | null; max: number | null };

export function odczytajPojemnosc(tekst: string): Pojemnosc {
  const liczby = (tekst.match(/\d+/g) ?? []).map(Number);

  if (liczby.length === 1) return { min: null, max: liczby[0] ?? null };

  if (liczby.length === 2) {
    const [a, b] = liczby as [number, number];
    return { min: Math.min(a, b), max: Math.max(a, b) };
  }

  return { min: null, max: null };
}

/** Odwrotność: jak pokazać zapisaną pojemność z powrotem w polu kreatora. */
export function pojemnoscDoPola(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `${min}-${max}`;
  if (max !== null) return String(max);
  return "";
}

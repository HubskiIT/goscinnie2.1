/**
 * Reguły hasła. Jedyne miejsce, w którym żyją.
 *
 * Wcześniej minimalna długość była wpisana w czterech miejscach naraz:
 * w schemacie Zod, w konfiguracji better-auth, w atrybucie `minLength`
 * formularza i w zdaniu napisanym ręcznie pod polem. Zmiana jednej liczby
 * wymagała trafienia we wszystkie cztery, a rozjazd między nimi nie wywalał
 * się nigdzie: formularz ogłaszał jedno, serwer egzekwował drugie.
 *
 * Teraz reguła jest obiektem z opisem i predykatem. Zod iteruje po tej samej
 * tablicy, po której iteruje lista pod polem, więc dopisanie reguły działa
 * w obu miejscach albo w żadnym.
 *
 * Plik jest czystym TypeScriptem bez importów serwerowych, bo wczytuje go
 * też komponent kliencki.
 *
 * O SAMYCH REGUŁACH. Wymóg składu, czyli cyfra i wielka litera, jest decyzją
 * właściciela z 12 października 2026. Warto wiedzieć, co się za nią kryje:
 * ludzie odpowiadają na taki wymóg dopisaniem jedynki i wykrzyknika na końcu
 * albo zamianą „o" na zero, a to są pierwsze rzeczy, jakie sprawdza łamacz.
 * Realną odporność daje długość. Dlatego reguła długości zostaje pierwsza
 * na liście i to ona idzie do `minLength` w formularzu.
 */

/** Minimum, które musi być **nie większe** niż `minPasswordLength` w `lib/auth`. */
export const MINIMALNA_DLUGOSC_HASLA = 8;

/**
 * Górna granica chroni przed żądaniem, które każe argon2id przemielić
 * megabajt tekstu. Bez niej samo hashowanie staje się wektorem ataku.
 */
export const MAKSYMALNA_DLUGOSC_HASLA = 200;

export type RegulaHasla = {
  /** Klucz do testów i do atrybutu `key` w liście. Nie pokazywany człowiekowi. */
  readonly id: string;
  /** Dopełnienie zdania „Hasło musi mieć …". Bez kropki na końcu. */
  readonly opis: string;
  readonly spelnia: (haslo: string) => boolean;
};

export const REGULY_HASLA: readonly RegulaHasla[] = [
  {
    id: "dlugosc",
    opis: `co najmniej ${MINIMALNA_DLUGOSC_HASLA} znaków`,
    spelnia: (haslo) => haslo.length >= MINIMALNA_DLUGOSC_HASLA,
  },
  {
    id: "cyfra",
    opis: "co najmniej jedną cyfrę",
    spelnia: (haslo) => /\d/.test(haslo),
  },
  {
    /*
     * `\p{Lu}` zamiast `A-Z`, bo hasło „Żółw” ma wielką literę, tylko nie
     * z alfabetu angielskiego. Odrzucanie go byłoby komunikatem „twoje imię
     * nie liczy się jako litera”.
     */
    id: "wielka",
    opis: "co najmniej jedną wielką literę",
    spelnia: (haslo) => /\p{Lu}/u.test(haslo),
  },
];

/** Reguły, których dane hasło nie spełnia. Pusta tablica znaczy „w porządku”. */
export function niespelnioneReguly(haslo: string): readonly RegulaHasla[] {
  return REGULY_HASLA.filter((regula) => !regula.spelnia(haslo));
}

/**
 * Walidacja szczegółów wpisu: osobno dla lokalu, osobno dla usługodawcy.
 *
 * DWIE RÓŻNE RZECZY SĄ TU SPRAWDZANE i mylenie ich kosztowało już jeden
 * projekt kreatora:
 *
 *   1. CZY ODPOWIEDŹ JEST SENSOWNA. Liczba dodatnia, godzina to godzina,
 *      korkowe tylko przy alkoholu z korkowym. To pilnują schematy niżej
 *      i pilnują zawsze, przy każdym zapisie.
 *
 *   2. CZY ODPOWIEDZI WYSTARCZY DO PUBLIKACJI. Tego schematy NIE pilnują,
 *      bo kreator pozwala zapisać połowę i wrócić później. Gdyby wymóg
 *      kompletu siedział w schemacie, nie dałoby się zapisać niczego,
 *      dopóki nie wypełni się wszystkiego, czyli właśnie tego, czego ten
 *      podział miał uniknąć. Od kompletu jest `brakiLokalu`
 *      i `brakiUslugodawcy` niżej, wołane przy publikacji.
 *
 * Wszystkie pola są więc opcjonalne. Puste znaczy „jeszcze nie
 * odpowiedziano”, a nie „nie ma”, i to rozróżnienie jest widoczne na
 * profilu: pytanie bez odpowiedzi po prostu się nie pokazuje.
 */
import { z } from "zod";
import { kwotaZlotowkiOpcjonalna } from "@/lib/validators/kwoty";

/** Górna granica pojemności. Stadion to nie sala weselna. */
export const MAKS_POJEMNOSC = 100_000;
/** Górna granica zasięgu dojazdu. Dalej niż to, i jedzie się dobę. */
export const MAKS_ZASIEG_KM = 1000;
/** Ile pozycji „co w cenie” przyjmujemy od jednej firmy. */
export const MAKS_POZYCJI_W_CENIE = 15;

/**
 * Liczba całkowita albo nic.
 *
 * `preprocess`, nie `union` z pustym napisem: przy unii Zod zasłania
 * komunikaty gałęzi własnym „Invalid input”, gdy nie przechodzi żadna.
 * To samo rozwiązanie co przy pojemności w lib/validators/kreator.ts.
 */
function liczbaOpcjonalna(nazwa: string, min: number, maks: number) {
  return z
    .preprocess(
      (wartosc) => (typeof wartosc === "string" && wartosc.trim() === "" ? undefined : wartosc),
      z.coerce
        .number({ message: `${nazwa}: podaj liczbę.` })
        .int(`${nazwa}: podaj liczbę całkowitą.`)
        .min(min, `${nazwa}: ta wartość jest za mała.`)
        .max(maks, `${nazwa}: ta wartość wygląda na pomyłkę.`)
        .optional(),
    )
    .transform((wartosc) => (wartosc === undefined ? null : wartosc));
}

/** Wybór ze słownika albo nic. Puste pole to brak odpowiedzi, nie błąd. */
function wyborOpcjonalny<const T extends readonly [string, ...string[]]>(
  wartosci: T,
  nazwa: string,
) {
  return z
    .preprocess(
      (wartosc) => (typeof wartosc === "string" && wartosc.trim() === "" ? undefined : wartosc),
      z.enum(wartosci, { message: `${nazwa}: wybierz jedną z możliwości.` }).optional(),
    )
    .transform((wartosc) => (wartosc === undefined ? null : wartosc));
}

/**
 * Trójstan: tak, nie, albo jeszcze nie odpowiedziano.
 *
 * Nie pole wyboru, tylko lista z trzema pozycjami. Pole wyboru ma dwa
 * stany i nieodhaczone jest nieodróżnialne od niezadanego pytania, więc
 * profil każdej firmy, która nie doszła do tego kroku, twierdziłby, że
 * sala nie ma klimatyzacji i nie jest dostępna dla wózków.
 */
function trojstan(nazwa: string) {
  return z
    .preprocess(
      (wartosc) => (typeof wartosc === "string" && wartosc.trim() === "" ? undefined : wartosc),
      z.enum(["tak", "nie"], { message: `${nazwa}: wybierz tak albo nie.` }).optional(),
    )
    .transform((wartosc) => (wartosc === undefined ? null : wartosc === "tak"));
}

export const KUCHNIE = ["wlasna", "obcy-catering", "tylko-nasz"] as const;
export const ALKOHOLE = ["nie", "tak-bez-oplaty", "tak-z-korkowym"] as const;
export const PARKINGI = ["brak", "bezplatny", "platny", "uliczny"] as const;
export const NOCLEGI = ["brak", "na-miejscu", "w-poblizu"] as const;
export const TERENY = ["brak", "ogrod", "taras", "plener"] as const;
export const DLA_DZIECI = ["brak", "kacik", "plac-zabaw"] as const;
export const DOJAZDY = ["w-cenie", "w-cenie-do-limitu", "platny"] as const;
export const ZALICZKI = ["procent", "kwota"] as const;

export const szczegolyLokalu = z
  .object({
    miejscPrzyStolach: liczbaOpcjonalna("Miejsca przy stołach", 1, MAKS_POJEMNOSC),
    miejscNaStojaco: liczbaOpcjonalna("Miejsca na stojąco", 1, MAKS_POJEMNOSC),
    minimumGosci: liczbaOpcjonalna("Minimalna liczba gości", 1, MAKS_POJEMNOSC),
    minimumKwota: kwotaZlotowkiOpcjonalna("Minimalne obciążenie"),
    wylacznosc: trojstan("Wyłączność sali"),
    kuchnia: wyborOpcjonalny(KUCHNIE, "Kuchnia"),
    alkohol: wyborOpcjonalny(ALKOHOLE, "Własny alkohol"),
    korkowe: kwotaZlotowkiOpcjonalna("Korkowe"),
    parking: wyborOpcjonalny(PARKINGI, "Parking"),
    miejscParkingowych: liczbaOpcjonalna("Miejsca parkingowe", 0, 10_000),
    nocleg: wyborOpcjonalny(NOCLEGI, "Nocleg"),
    pokoi: liczbaOpcjonalna("Liczba pokoi", 0, 10_000),
    muzykaDo: z
      .preprocess(
        (w) => (typeof w === "string" && w.trim() === "" ? undefined : w),
        z
          .string()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Godzina w formacie 23:00.")
          .optional(),
      )
      .transform((w) => w ?? null),
    teren: wyborOpcjonalny(TERENY, "Teren zewnętrzny"),
    dlaDzieci: wyborOpcjonalny(DLA_DZIECI, "Dla dzieci"),
    wejscieBezSchodow: trojstan("Wejście bez schodów"),
    toaletaPrzystosowana: trojstan("Toaleta przystosowana"),
    winda: trojstan("Winda"),
    klimatyzacja: trojstan("Klimatyzacja"),
  })
  /*
   * Spójność między polami, te same trzy reguły co w CHECK-ach migracji
   * 0016. Dwa razy, bo baza broni się przed każdym zapisem, także spoza
   * formularza, a Zod mówi człowiekowi, co poprawić, zamiast rzucać mu
   * błędem bazy w twarz.
   */
  .refine((d) => d.korkowe === null || d.alkohol === "tak-z-korkowym", {
    message: "Kwotę korkowego podaje się tylko przy alkoholu za opłatą.",
    path: ["korkowe"],
  })
  .refine((d) => d.pokoi === null || d.nocleg === "na-miejscu", {
    message: "Liczbę pokoi podaje się tylko przy noclegu na miejscu.",
    path: ["pokoi"],
  })
  .refine((d) => d.miejscParkingowych === null || (d.parking !== null && d.parking !== "brak"), {
    message: "Liczbę miejsc podaje się tylko wtedy, gdy parking jest.",
    path: ["miejscParkingowych"],
  })
  .refine(
    (d) =>
      d.minimumGosci === null ||
      d.miejscPrzyStolach === null ||
      d.minimumGosci <= d.miejscPrzyStolach,
    {
      message: "Minimalna liczba gości nie może być większa niż liczba miejsc.",
      path: ["minimumGosci"],
    },
  );

export type SzczegolyLokalu = z.infer<typeof szczegolyLokalu>;

export const szczegolyUslugodawcy = z
  .object({
    zasiegKm: liczbaOpcjonalna("Zasięg dojazdu", 1, MAKS_ZASIEG_KM),
    dojazd: wyborOpcjonalny(DOJAZDY, "Dojazd"),
    stawkaZaKm: kwotaZlotowkiOpcjonalna("Stawka za kilometr"),
    godzinWPakiecie: liczbaOpcjonalna("Godziny w cenie", 1, 24 * 7),
    cenaNadgodziny: kwotaZlotowkiOpcjonalna("Cena nadgodziny"),
    rodzajZaliczki: wyborOpcjonalny(ZALICZKI, "Zaliczka"),
    wartoscZaliczki: liczbaOpcjonalna("Wartość zaliczki", 0, 10_000_000),
    zaliczkaWDni: liczbaOpcjonalna("Termin wpłaty zaliczki", 0, 365),
    zwrotZaliczki: z
      .string()
      .trim()
      .max(300, "Ten opis jest za długi.")
      .optional()
      .transform((w) => (w === undefined || w === "" ? null : w)),
    rezerwacjeNaMiesiecy: liczbaOpcjonalna("Horyzont rezerwacji", 1, 60),
    wydarzenDziennie: liczbaOpcjonalna("Wydarzenia dziennie", 1, 20),
    materialPoTygodniach: liczbaOpcjonalna("Czas dostarczenia materiału", 1, 104),
    zastepstwo: trojstan("Zastępstwo"),
    fakturaVat: trojstan("Faktura VAT"),
  })
  .refine((d) => d.stawkaZaKm === null || d.dojazd === "platny", {
    message: "Stawkę za kilometr podaje się tylko przy dojeździe płatnym.",
    path: ["stawkaZaKm"],
  })
  /*
   * Procent to procent. Bez tego warunku „50” w polu wartości znaczy raz
   * pięćdziesiąt procent, raz pięćdziesiąt groszy, a jedno i drugie
   * zapisuje się do tej samej kolumny.
   */
  .refine(
    (d) =>
      d.rodzajZaliczki !== "procent" ||
      d.wartoscZaliczki === null ||
      (d.wartoscZaliczki >= 1 && d.wartoscZaliczki <= 100),
    { message: "Zaliczka w procentach mieści się między 1 a 100.", path: ["wartoscZaliczki"] },
  )
  .refine((d) => d.wartoscZaliczki === null || d.rodzajZaliczki !== null, {
    message: "Wybierz, czy zaliczka jest w procentach, czy kwotowa.",
    path: ["rodzajZaliczki"],
  });

export type SzczegolyUslugodawcy = z.infer<typeof szczegolyUslugodawcy>;

/** Pozycja listy „co jest w cenie”. */
export const pozycjaWCenie = z
  .string()
  .trim()
  .min(2, "Pozycja jest za krótka.")
  .max(80, "Pozycja jest za długa.");

export const listaWCenie = z
  .array(pozycjaWCenie)
  .max(MAKS_POZYCJI_W_CENIE, `Najwyżej ${MAKS_POZYCJI_W_CENIE} pozycji.`);

/**
 * Czego brakuje lokalowi do publikacji.
 *
 * Lista pustych nazw pól, nie wartość logiczna, bo człowiek ma zobaczyć,
 * czego dokładnie brakuje, a nie „uzupełnij wpis”. Pusta lista znaczy:
 * można publikować.
 *
 * Miejsca liczą się łącznie: sala podaje przy stołach, na stojąco albo
 * jedno i drugie. Wymaganie obu wykluczyłoby plener, który nie ma stołów,
 * i salę konferencyjną, która nie przyjmuje gości na stojąco.
 */
export function brakiLokalu(dane: Partial<SzczegolyLokalu>): string[] {
  const braki: string[] = [];

  if (!dane.miejscPrzyStolach && !dane.miejscNaStojaco) {
    braki.push("liczba miejsc, przy stołach albo na stojąco");
  }
  if (dane.wylacznosc === null || dane.wylacznosc === undefined) braki.push("wyłączność sali");
  if (!dane.kuchnia) braki.push("kuchnia");
  if (!dane.alkohol) braki.push("zasady własnego alkoholu");
  if (!dane.parking) braki.push("parking");
  if (!dane.nocleg) braki.push("nocleg");
  if (!dane.muzykaDo) braki.push("godzina, do której można grać");

  return braki;
}

/**
 * Czego brakuje usługodawcy do publikacji.
 *
 * Godzin w pakiecie tu nie ma, choć są w formularzu: florysta i firma od
 * zaproszeń nie rozliczają się czasem, a wymóg wpisania godzin kazałby im
 * zmyślać liczbę, żeby przejść dalej.
 */
export function brakiUslugodawcy(
  dane: Partial<SzczegolyUslugodawcy>,
  pozycjiWCenie: number,
): string[] {
  const braki: string[] = [];

  if (!dane.zasiegKm) braki.push("zasięg dojazdu");
  if (!dane.dojazd) braki.push("sposób rozliczania dojazdu");
  if (pozycjiWCenie === 0) braki.push("co najmniej jedna pozycja „co jest w cenie”");
  if (!dane.rodzajZaliczki || dane.wartoscZaliczki === null) braki.push("zaliczka");
  if (dane.fakturaVat === null || dane.fakturaVat === undefined) braki.push("faktura VAT");

  return braki;
}

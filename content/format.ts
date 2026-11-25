const ZLOTE = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 0,
});

const DATA_DLUGA = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const DZIEN_TYGODNIA = new Intl.DateTimeFormat("pl-PL", { weekday: "long" });

/** Ceny trzymamy w groszach, tak jak zrobi to baza. Formatujemy dopiero na wyjściu. */
export function zlote(grosze: number): string {
  return ZLOTE.format(grosze / 100);
}

export function dataDluga(iso: string): string {
  return DATA_DLUGA.format(new Date(iso));
}

/**
 * Polska odmiana rzeczownika po liczbie: „1 obiekt”, „2 obiekty”, „0 obiektów”.
 *
 * Powstała z prostego `ile === 1 ? "obiekt" : "obiekty"`, rozsianego po
 * ekranach. Ten zapis jest poprawny dokładnie dla jedynki i dla dwójki, a
 * pusty katalog, czyli stan, w którym serwis startuje i w którym odwiedza go
 * pierwszy prawdziwy użytkownik, pokazywał **„0 obiekty”**.
 *
 * Reguła, wbrew wrażeniu, nie jest uznaniowa: forma mnoga druga wchodzi dla
 * końcówek 2, 3 i 4, ale nie dla nastek, bo „12 obiekty” jest błędne, a
 * „22 obiekty” poprawne.
 */
export function odmiana(ile: number, jeden: string, kilka: string, wiele: string): string {
  if (ile === 1) return jeden;

  const setki = ile % 100;
  if (setki >= 12 && setki <= 14) return wiele;

  const jednosci = ile % 10;
  return jednosci >= 2 && jednosci <= 4 ? kilka : wiele;
}

/** Dzień tygodnia liczony z daty, żeby nie rozjechał się z nią jak w prototypie. */
export function dzienTygodnia(iso: string): string {
  return DZIEN_TYGODNIA.format(new Date(iso));
}

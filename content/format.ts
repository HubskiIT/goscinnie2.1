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

/** Dzień tygodnia liczony z daty, żeby nie rozjechał się z nią jak w prototypie. */
export function dzienTygodnia(iso: string): string {
  return DZIEN_TYGODNIA.format(new Date(iso));
}

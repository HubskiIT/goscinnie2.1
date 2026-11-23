/**
 * Zdjęcie firmy albo puste miejsce po nim.
 *
 * Jeden komponent na trzy ekrany (karty lokali, karty usługodawców, profil),
 * bo wszystkie potrzebują tego samego: pokaż zdjęcie, a jak go nie ma, zostaw
 * beżowe tło w tym samym miejscu. Bez tego ekran bez zdjęcia zapadał się
 * i karty miały różną wysokość.
 *
 * Firma bez zdjęcia nie dostaje żadnego napisu w kafelku. Katalog startuje
 * bez zdjęć, więc „brak zdjęcia" na każdej karcie byłby szumem, a nie
 * informacją — i wyglądałby jak usterka serwisu.
 *
 * DLACZEGO `<img>`, A NIE `next/image`. Zdjęcie jest już przeskalowane do 1600
 * pikseli i zapisane jako WebP przez lib/zdjecia/obrobka.ts, więc `next/image`
 * nie ma czego optymalizować, a przepuszczałby je przez płatny limit
 * optymalizatora Vercela. Wymagałby też wpisania domeny z `SUPABASE_URL`
 * drugi raz, do `next.config.ts`, jako wzorca adresu zdalnego.
 */
/**
 * Jak zdjęcie ma się zachować w przydzielonym mu miejscu.
 *
 *   kadr   wypełnia ramkę i daje się przyciąć, żeby karty w siatce miały
 *          jednakową wysokość. Dobre przy miniaturach, gdzie liczy się rytm
 *          siatki, a nie to, co dokładnie widać.
 *   cale   mieści się w całości, bez ucinania czegokolwiek. Puste miejsce
 *          po bokach wypełnia tło.
 *
 * Wcześniej komponent wymuszał `kadr` na wszystkich ekranach naraz i nie dało
 * się tego nadpisać: dopisanie `object-contain` w `className` lądowało
 * w tej samej klasie obok `object-cover`, a wygrywała ta, która była dalej
 * w arkuszu, nie ta, którą dopisał ekran. Zdjęcie pionowe na profilu firmy
 * traciło przez to górę i dół, czyli zwykle głowy ludzi i podłogę sali.
 */
export type DopasowanieZdjecia = "kadr" | "cale";

interface ZdjecieFirmyProps {
  /** Publiczny adres zdjęcia. `null` znaczy „firma nie dodała żadnego”. */
  adres: string | null;
  /** Co czytnik ekranu ma powiedzieć. Zwykle nazwa firmy. */
  nazwaFirmy: string;
  /** Wymiary i zaokrąglenia zostają po stronie ekranu, bo każdy ma inne. */
  className: string;
  /**
   * Domyślnie `kadr`, bo tak zachowuje się większość miejsc: karty katalogu
   * i miniatury galerii. Profil firmy prosi o `cale`.
   */
  dopasowanie?: DopasowanieZdjecia;
}

export function ZdjecieFirmy({
  adres,
  nazwaFirmy,
  className,
  dopasowanie = "kadr",
}: ZdjecieFirmyProps) {
  if (!adres) return <div className={`${className} bg-[#E4D9CF]`} />;

  return (
    // biome-ignore lint/performance/noImgElement: powód w nagłówku pliku, sekcja o next/image
    <img
      src={adres}
      alt={`Zdjęcie: ${nazwaFirmy}`}
      loading="lazy"
      className={`${className} bg-[#E4D9CF] ${dopasowanie === "cale" ? "object-contain" : "object-cover"}`}
    />
  );
}

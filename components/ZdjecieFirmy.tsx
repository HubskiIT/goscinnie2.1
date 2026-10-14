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
interface ZdjecieFirmyProps {
  /** Publiczny adres zdjęcia. `null` znaczy „firma nie dodała żadnego”. */
  adres: string | null;
  /** Co czytnik ekranu ma powiedzieć. Zwykle nazwa firmy. */
  nazwaFirmy: string;
  /** Wymiary i zaokrąglenia zostają po stronie ekranu, bo każdy ma inne. */
  className: string;
}

export function ZdjecieFirmy({ adres, nazwaFirmy, className }: ZdjecieFirmyProps) {
  if (!adres) return <div className={`${className} bg-[#E4D9CF]`} />;

  return (
    // biome-ignore lint/performance/noImgElement: powód w nagłówku pliku, sekcja o next/image
    <img
      src={adres}
      alt={`Zdjęcie: ${nazwaFirmy}`}
      loading="lazy"
      className={`${className} bg-[#E4D9CF] object-cover`}
    />
  );
}

import type { StanFormularza } from "@/lib/formularze";

/**
 * Błąd pod konkretnym polem.
 *
 * `KomunikatFormularza` pokazuje wszystkie komunikaty w jednym panelu nad
 * formularzem i gubi przy tym przypisanie do pola: widać „Hasła nie są
 * identyczne”, ale nie widać, które z dwóch pól zaczerwienić. Przy jednym
 * polu to nie przeszkadza, przy trzech owszem.
 *
 * Panel zbiorczy zostaje, bo czytnik ekranu ogłasza go od razu po wysłaniu.
 * Ten komponent go uzupełnia, a nie zastępuje.
 */
export function idBledu(pole: string): string {
  return `blad-${pole}`;
}

/** Czy pole ma błąd. Do `aria-invalid` przy polu. */
export function maBlad(stan: StanFormularza, pole: string): boolean {
  return stan.status === "bledy" && (stan.bledy[pole]?.length ?? 0) > 0;
}

export function BladPola({ stan, pole }: { stan: StanFormularza; pole: string }) {
  if (stan.status !== "bledy") return null;

  const komunikaty = stan.bledy[pole];
  if (komunikaty === undefined || komunikaty.length === 0) return null;

  return (
    <p id={idBledu(pole)} className="m-0 mt-1.5 text-[13px] leading-[1.5] text-[#A33B12]">
      {komunikaty.join(" ")}
    </p>
  );
}

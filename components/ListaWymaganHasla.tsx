import { REGULY_HASLA } from "@/lib/haslo";

/**
 * Wymagania hasła wypisane pod polem.
 *
 * Lista powstaje z `REGULY_HASLA`, a nie z napisanego ręcznie zdania.
 * Zdanie żyło wcześniej w dwóch miejscach i w obu trzeba było pamiętać
 * o poprawieniu, gdy zmieniała się reguła. Tutaj zmiana reguły zmienia
 * listę sama.
 *
 * Komponent jest serwerowy: nie pokazuje, które wymagania są już spełnione.
 * Podświetlanie na bieżąco wymagałoby trzymania hasła w stanie komponentu
 * klienckiego po to, żeby pokazać ptaszki, a to nie jest cena, którą warto
 * płacić za tę jedną wygodę.
 */
export function ListaWymaganHasla({ id }: { id?: string }) {
  return (
    <div id={id} className="mt-1.5 text-[13px] leading-[1.6] text-[#6A5C70]">
      <p className="m-0">Hasło musi mieć:</p>
      <ul className="m-0 list-disc pl-5">
        {REGULY_HASLA.map((regula) => (
          <li key={regula.id}>{regula.opis}</li>
        ))}
      </ul>
    </div>
  );
}

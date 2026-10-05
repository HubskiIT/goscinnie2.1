import { pobierzOkazje } from "@/content/okazje";

interface Pole {
  nazwa: string;
  etykieta: string;
  rodzaj: "okazja" | "tekst" | "data";
  wartosc: string;
  podpowiedz?: string;
}

interface PasekFiltrowProps {
  /** Adres, pod który idzie formularz. Stan filtrów żyje w adresie. */
  adres: string;
  pola: readonly Pole[];
}

const ETYKIETA = "text-[12px] text-[#6A5C70]";
const POLE =
  "text-[15px] font-semibold text-[#241C2B] bg-transparent border-0 p-0 w-full focus:outline-none";

/**
 * Zwykły formularz GET. Bez JavaScriptu wybrane wartości trafiają do adresu,
 * a serwer filtruje listę, więc ten sam adres w nowej karcie daje ten sam wynik.
 */
export function PasekFiltrow({ adres, pola }: PasekFiltrowProps) {
  return (
    <form
      action={adres}
      method="get"
      className="border-[1.5px] border-[#D9CCC2] rounded-[16px] bg-white flex flex-col lg:flex-row items-stretch shadow-2xs"
    >
      {pola.map((pole) => (
        <div
          key={pole.nazwa}
          className="grow flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]"
        >
          <label className={ETYKIETA} htmlFor={`filtr-${pole.nazwa}`}>
            {pole.etykieta}
          </label>

          {pole.rodzaj === "okazja" ? (
            <select
              id={`filtr-${pole.nazwa}`}
              name={pole.nazwa}
              defaultValue={pole.wartosc}
              className={POLE}
            >
              <option value="">Wszystkie</option>
              {pobierzOkazje().map((okazja) => (
                <option key={okazja.slug} value={okazja.slug}>
                  {okazja.nazwa}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={`filtr-${pole.nazwa}`}
              name={pole.nazwa}
              type={pole.rodzaj === "data" ? "date" : "text"}
              defaultValue={pole.wartosc}
              placeholder={pole.podpowiedz}
              className={POLE}
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        className="shrink-0 p-4 px-7 bg-[#241C2B] text-[#FBF7F4] font-semibold text-[15px] cursor-pointer hover:bg-[#3E3344] transition-colors border-0 rounded-b-[14px] lg:rounded-b-none lg:rounded-r-[14px]"
      >
        Filtruj
      </button>
    </form>
  );
}

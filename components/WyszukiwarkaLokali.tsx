import { PoleMiejscowosci } from "@/components/PoleMiejscowosci";
import { pobierzRodzajeLokali } from "@/content/rodzaje-lokali";
import { type KryteriaLokali, PARAMETRY, PROMIENIE_KM } from "@/lib/wyszukiwanie";

interface WyszukiwarkaLokaliProps {
  kryteria: KryteriaLokali;
  /** Na stronie głównej formularz jest większy niż w pasku nad listą. */
  wariant?: "hero" | "pasek";
}

const ETYKIETA = "text-[12px] text-[#6A5C70]";
const POLE =
  "text-[15px] font-semibold text-[#241C2B] bg-transparent border-0 p-0 w-full focus:outline-none";

/**
 * Zwykły formularz GET. Bez JavaScriptu wpisane wartości trafiają do adresu,
 * a serwer filtruje listę. Stan wyszukiwarki żyje w adresie, nie w pamięci.
 *
 * Nagłówek nie odmienia nazw przez przypadki (punkt 3.1 planu): przy
 * wszystkich miejscowościach w Polsce nie ma wiarygodnego miejscownika
 * dla każdej nazwy, a „w Kobierzyce" wygląda źle.
 */
export function WyszukiwarkaLokali({ kryteria, wariant = "pasek" }: WyszukiwarkaLokaliProps) {
  const duzy = wariant === "hero";
  return (
    <form
      action="/lokale"
      method="get"
      className={`border-[1.5px] border-[#D9CCC2] rounded-[16px] bg-white flex flex-col lg:flex-row items-stretch shadow-sm ${
        duzy ? "max-w-[980px]" : ""
      }`}
    >
      <div className="grow flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
        <label className={ETYKIETA} htmlFor="szukaj-rodzaj">
          Rodzaj
        </label>
        <select
          id="szukaj-rodzaj"
          name={PARAMETRY.rodzaj}
          defaultValue={kryteria.rodzaj ?? ""}
          className={POLE}
        >
          <option value="">Dowolny</option>
          {pobierzRodzajeLokali().map((rodzaj) => (
            <option key={rodzaj.slug} value={rodzaj.slug}>
              {rodzaj.nazwa}
            </option>
          ))}
        </select>
      </div>

      <div className="grow flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
        <PoleMiejscowosci
          nazwaPola={PARAMETRY.miejscowosc}
          wartoscPoczatkowa={kryteria.miejscowosc ?? ""}
          klasaEtykiety={ETYKIETA}
          klasaPola={POLE}
        />
      </div>

      <div className="w-full lg:w-[130px] shrink-0 flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
        <label className={ETYKIETA} htmlFor="szukaj-promien">
          W promieniu
        </label>
        <select
          id="szukaj-promien"
          name={PARAMETRY.promien}
          defaultValue={String(kryteria.promienKm)}
          className={POLE}
        >
          {PROMIENIE_KM.map((km) => (
            <option key={km} value={km}>
              {km === 0 ? "tylko tu" : `${km} km`}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full lg:w-[120px] shrink-0 flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
        <label className={ETYKIETA} htmlFor="szukaj-goscie">
          Goście
        </label>
        <input
          id="szukaj-goscie"
          name={PARAMETRY.goscie}
          type="number"
          min="1"
          inputMode="numeric"
          defaultValue={kryteria.goscie ?? ""}
          placeholder="ile osób"
          className={POLE}
        />
      </div>

      <div className="w-full lg:w-[165px] shrink-0 flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
        <label className={ETYKIETA} htmlFor="szukaj-termin">
          Termin
        </label>
        <input
          id="szukaj-termin"
          name={PARAMETRY.termin}
          type="date"
          defaultValue={kryteria.termin ?? ""}
          className={POLE}
        />
      </div>

      <button
        type="submit"
        className={`shrink-0 text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 cursor-pointer rounded-b-[14px] lg:rounded-b-none lg:rounded-r-[14px] ${
          duzy ? "px-9 py-4" : "px-7 py-3.5"
        }`}
      >
        Pokaż miejsca
      </button>
    </form>
  );
}

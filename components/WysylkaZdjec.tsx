"use client";

/**
 * Pole wysyłki zdjęć firmy wraz z podglądem tego, co już jest.
 *
 * DLACZEGO NIE ZWYKŁY FORMULARZ. Zdjęć jest kilka, a każde jedzie osobnym
 * żądaniem: jedno duże żądanie z dziesięcioma plikami przekracza limit
 * wielkości ciała żądania akcji serwerowej, a przy odmowie nie dałoby się
 * powiedzieć, które zdjęcie jej nie przeszło. Wysyłamy po kolei i meldujemy
 * po każdym.
 *
 * DLACZEGO `<img>`, A NIE `next/image`. Adres zdjęcia składa się ze zmiennej
 * `SUPABASE_URL`, więc `next/image` wymagałby wpisania tej samej domeny
 * drugi raz do `next.config.ts` jako wzorca zdalnego. Dwa miejsca na jedną
 * wartość, z których jedno jest konfiguracją budowania, a drugie zmienną
 * środowiskową. Te zdjęcia są już przeskalowane do 1600 pikseli i zapisane
 * jako WebP, czyli robotę `next/image` zrobił serwer przy zapisie.
 */
import { useId, useRef, useState, useTransition } from "react";
import {
  dodajZdjecieFirmy,
  mojeZdjecia,
  usunZdjecieFirmy,
  type ZdjecieDoPokazania,
} from "@/lib/akcje/zdjecia";
import { STAN_POCZATKOWY } from "@/lib/formularze";
import { ACCEPT_ZDJEC, MAKS_MEGABAJTOW, MAKS_ZDJEC } from "@/lib/zdjecia/granice";

interface WysylkaZdjecProps {
  /** Zdjęcia odczytane na serwerze, żeby pierwsze wejście nie migało pustką. */
  poczatkowe: readonly ZdjecieDoPokazania[];
}

export function WysylkaZdjec({ poczatkowe }: WysylkaZdjecProps) {
  const [zdjecia, setZdjecia] = useState<readonly ZdjecieDoPokazania[]>(poczatkowe);
  const [bledy, setBledy] = useState<readonly string[]>([]);
  const [postep, setPostep] = useState<string | null>(null);
  const [czeka, startTransition] = useTransition();
  const pole = useRef<HTMLInputElement>(null);
  const idPola = useId();

  const wolnychMiejsc = MAKS_ZDJEC - zdjecia.length;

  /**
   * Wysyła wybrane pliki po kolei, nie równolegle.
   *
   * Pozycję zdjęcia wybiera baza, więc dwa równoległe żądania walczyłyby
   * o ten sam numer i jedno dostałoby odmowę bez winy człowieka.
   */
  const wyslij = (pliki: readonly File[]) => {
    const zebrane: string[] = [];

    startTransition(async () => {
      for (const [numer, plik] of pliki.entries()) {
        setPostep(
          pliki.length > 1
            ? `Wysyłam ${numer + 1} z ${pliki.length}: ${plik.name}`
            : `Wysyłam ${plik.name}`,
        );

        const dane = new FormData();
        dane.set("zdjecie", plik);
        const wynik = await dodajZdjecieFirmy(STAN_POCZATKOWY, dane);

        if (wynik.status === "bledy") {
          // Nazwa pliku przy komunikacie: przy pięciu zdjęciach naraz samo
          // „zdjęcie waży za dużo" nie mówi, które wyrzucić.
          const tresc = Object.values(wynik.bledy).flat().join(" ");
          zebrane.push(`${plik.name}: ${tresc}`);
        }
      }

      setPostep(null);
      setBledy(zebrane);
      setZdjecia(await mojeZdjecia());
      // Bez tego ponowny wybór tego samego pliku nie wywoła `onChange`.
      if (pole.current) pole.current.value = "";
    });
  };

  const usun = (id: string) => {
    startTransition(async () => {
      const dane = new FormData();
      dane.set("zdjecieId", id);
      const wynik = await usunZdjecieFirmy(STAN_POCZATKOWY, dane);

      setBledy(wynik.status === "bledy" ? Object.values(wynik.bledy).flat() : []);
      setZdjecia(await mojeZdjecia());
    });
  };

  return (
    <div>
      <p className="block text-[14px] font-medium text-[#241C2B] mb-1.5">
        Zdjęcia ({zdjecia.length} z {MAKS_ZDJEC})
      </p>

      {zdjecia.length === 0 ? (
        <p className="m-0 mb-3 rounded-[10px] border border-dashed border-[#D9CCC2] bg-[#F7F1EC] p-4 text-[14px] leading-[1.6] text-[#6A5C70]">
          Nie masz jeszcze żadnego zdjęcia. Pierwsze będzie tym z karty w katalogu, więc wybierz
          takie, które najlepiej pokazuje całość.
        </p>
      ) : (
        <ul className="m-0 mb-3 list-none grid grid-cols-2 sm:grid-cols-3 gap-3 p-0">
          {zdjecia.map((zdjecie, numer) => (
            <li key={zdjecie.id} className="relative">
              {/* biome-ignore lint/performance/noImgElement: zdjęcie jest już
              przeskalowane i w WebP, a `next/image` przepuszczałby je przez
              optymalizator Vercela, czyli przez płatny limit, za nic. Powód
              w nagłówku pliku. */}
              <img
                src={zdjecie.adres}
                alt={numer === 0 ? "Zdjęcie główne firmy" : `Zdjęcie firmy numer ${numer + 1}`}
                className="w-full h-[120px] object-cover rounded-[10px] border border-[#E2D5CA] bg-[#F2E9E2]"
              />
              {numer === 0 ? (
                <span className="absolute top-2 left-2 rounded-[6px] bg-[#241C2B] px-2 py-0.5 text-[11px] font-semibold text-white">
                  Główne
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => usun(zdjecie.id)}
                disabled={czeka}
                aria-label={`Usuń zdjęcie numer ${numer + 1}`}
                className="absolute top-2 right-2 h-7 w-7 rounded-full border-0 bg-white/90 text-[14px] font-bold text-[#A33B12] cursor-pointer shadow-xs disabled:opacity-50"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {wolnychMiejsc > 0 ? (
        <>
          <label
            htmlFor={idPola}
            className="block text-[14px] font-medium text-[#241C2B] mb-1.5 sr-only"
          >
            Dodaj zdjęcia
          </label>
          <input
            ref={pole}
            id={idPola}
            type="file"
            accept={ACCEPT_ZDJEC}
            multiple
            disabled={czeka}
            onChange={(e) => {
              const wybrane = Array.from(e.target.files ?? []);
              if (wybrane.length === 0) return;

              /*
               * Nadmiar odcinamy tutaj, zamiast puszczać go na serwer po
               * odmowę. Serwer i tak odmówi, ale człowiek czekałby na wysyłkę
               * plików, o których z góry wiadomo, że się nie zmieszczą.
               */
              if (wybrane.length > wolnychMiejsc) {
                setBledy([
                  `Wybrałeś ${wybrane.length} zdjęć, a zostało ${wolnychMiejsc} miejsc. Wysyłam pierwsze ${wolnychMiejsc}.`,
                ]);
              }
              wyslij(wybrane.slice(0, wolnychMiejsc));
            }}
            className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[14px] text-[#241C2B] outline-none focus:border-[#241C2B] disabled:opacity-50"
          />
          <p className="mt-1 text-[12px] text-[#6A5C70]">
            JPEG, PNG, WebP albo HEIC z iPhone'a, do {MAKS_MEGABAJTOW} MB za zdjęcie. Zmniejszamy je
            sami, nie musisz nic przygotowywać.
          </p>
        </>
      ) : (
        <p className="m-0 text-[13px] leading-[1.5] text-[#6A5C70]">
          Masz już {MAKS_ZDJEC} zdjęć, czyli tyle, ile wchodzi. Usuń któreś, żeby zrobić miejsce na
          nowe.
        </p>
      )}

      {postep ? (
        <p role="status" className="m-0 mt-2 text-[13px] leading-[1.5] text-[#6A5C70]">
          {postep}
        </p>
      ) : null}

      {bledy.length > 0 ? (
        <ul
          role="alert"
          className="m-0 mt-2 list-none p-0 text-[13px] leading-[1.5] text-[#A33B12]"
        >
          {bledy.map((tresc) => (
            <li key={tresc}>{tresc}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

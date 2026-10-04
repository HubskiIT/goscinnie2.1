"use client";

import { useEffect, useId, useRef, useState } from "react";

interface Podpowiedz {
  slug: string;
  nazwa: string;
  rodzaj: string;
  gmina: string;
  powiat: string;
}

interface PoleMiejscowosciProps {
  nazwaPola: string;
  wartoscPoczatkowa: string;
  klasaEtykiety: string;
  klasaPola: string;
}

/**
 * Pole miejscowości z listą podpowiedzi (wzorzec combobox).
 *
 * Bez JavaScriptu to zwykły input w formularzu GET: wpisany tekst trafia do
 * adresu, a serwer dopasowuje najlepszą miejscowość. Z JavaScriptem pod polem
 * rozwija się lista: nazwa, a pod nią gmina i powiat, bo „Nowa Wieś" występuje
 * ponad trzysta razy i bez tego nie da się ich odróżnić.
 *
 * Obsługa klawiatury: strzałki wybierają, Enter zatwierdza, Escape zamyka.
 */
export function PoleMiejscowosci({
  nazwaPola,
  wartoscPoczatkowa,
  klasaEtykiety,
  klasaPola,
}: PoleMiejscowosciProps) {
  const identyfikator = useId();
  const idListy = `${identyfikator}-lista`;
  const [tekst, setTekst] = useState(wartoscPoczatkowa);
  const [podpowiedzi, setPodpowiedzi] = useState<Podpowiedz[]>([]);
  const [otwarta, setOtwarta] = useState(false);
  const [podswietlony, setPodswietlony] = useState(-1);
  const kontener = useRef<HTMLDivElement>(null);
  const wybranoZListy = useRef(false);

  useEffect(() => {
    if (wybranoZListy.current) {
      wybranoZListy.current = false;
      return;
    }
    if (tekst.trim().length < 2) {
      setPodpowiedzi([]);
      return;
    }
    const kontroler = new AbortController();
    const zwloka = setTimeout(() => {
      fetch(`/api/miejscowosci?q=${encodeURIComponent(tekst)}`, { signal: kontroler.signal })
        .then((o) => (o.ok ? (o.json() as Promise<Podpowiedz[]>) : []))
        .then((wyniki) => {
          setPodpowiedzi(wyniki);
          setOtwarta(wyniki.length > 0);
          setPodswietlony(-1);
        })
        .catch(() => {
          // Przerwane zapytanie albo brak sieci. Pole działa dalej jak zwykły input.
        });
    }, 180);
    return () => {
      kontroler.abort();
      clearTimeout(zwloka);
    };
  }, [tekst]);

  useEffect(() => {
    const pozaPolem = (zdarzenie: MouseEvent) => {
      if (!kontener.current?.contains(zdarzenie.target as Node)) setOtwarta(false);
    };
    document.addEventListener("mousedown", pozaPolem);
    return () => document.removeEventListener("mousedown", pozaPolem);
  }, []);

  const wybierz = (podpowiedz: Podpowiedz) => {
    wybranoZListy.current = true;
    setTekst(podpowiedz.nazwa);
    setOtwarta(false);
    setPodswietlony(-1);
  };

  const obsluzKlawisz = (zdarzenie: React.KeyboardEvent<HTMLInputElement>) => {
    if (!otwarta || podpowiedzi.length === 0) return;
    if (zdarzenie.key === "ArrowDown") {
      zdarzenie.preventDefault();
      setPodswietlony((p) => (p + 1) % podpowiedzi.length);
    } else if (zdarzenie.key === "ArrowUp") {
      zdarzenie.preventDefault();
      setPodswietlony((p) => (p <= 0 ? podpowiedzi.length - 1 : p - 1));
    } else if (zdarzenie.key === "Enter" && podswietlony >= 0) {
      const wybrana = podpowiedzi[podswietlony];
      if (wybrana !== undefined) {
        zdarzenie.preventDefault();
        wybierz(wybrana);
      }
    } else if (zdarzenie.key === "Escape") {
      setOtwarta(false);
      setPodswietlony(-1);
    }
  };

  return (
    <div ref={kontener} className="relative grow">
      <label className={klasaEtykiety} htmlFor={identyfikator}>
        Miejscowość
      </label>
      <input
        id={identyfikator}
        name={nazwaPola}
        type="text"
        role="combobox"
        aria-expanded={otwarta}
        aria-controls={idListy}
        aria-autocomplete="list"
        aria-activedescendant={podswietlony >= 0 ? `${identyfikator}-${podswietlony}` : undefined}
        autoComplete="off"
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        onKeyDown={obsluzKlawisz}
        onFocus={() => setOtwarta(podpowiedzi.length > 0)}
        placeholder="Wpisz miejscowość"
        className={klasaPola}
      />

      {otwarta && podpowiedzi.length > 0 ? (
        <ul
          id={idListy}
          // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: wzorzec combobox wymaga roli listbox na liście podpowiedzi
          role="listbox"
          aria-label="Podpowiedzi miejscowości"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[320px] overflow-y-auto rounded-[12px] border border-[#D9CCC2] bg-white py-1 shadow-lg"
        >
          {podpowiedzi.map((podpowiedz, numer) => (
            <li
              key={podpowiedz.slug}
              id={`${identyfikator}-${numer}`}
              // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: pozycja listy w comboboxie musi mieć rolę option
              role="option"
              // Fokus zostaje w polu, aktywną pozycję wskazuje aria-activedescendant.
              tabIndex={-1}
              aria-selected={numer === podswietlony}
            >
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => wybierz(podpowiedz)}
                onMouseEnter={() => setPodswietlony(numer)}
                className={`block w-full px-4 py-2 text-left ${
                  numer === podswietlony ? "bg-[#F2E9E2]" : "bg-transparent"
                }`}
              >
                <span className="block text-[15px] font-semibold text-[#241C2B]">
                  {podpowiedz.nazwa}
                </span>
                <span className="block text-[13px] text-[#6A5C70]">
                  {podpowiedz.rodzaj} · gm. {podpowiedz.gmina} · pow. {podpowiedz.powiat}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

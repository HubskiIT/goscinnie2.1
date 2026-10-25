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
 * DLACZEGO KAŻDY PLIK MA WŁASNY `try`. Akcja serwerowa potrafi **rzucić**,
 * a nie zwrócić stan: Next odrzuca za duże ciało żądania wyjątkiem 413,
 * zanim akcja się wykona, a zerwane połączenie wygląda tak samo. Wcześniej
 * cała pętla stała w jednym `startTransition` bez `try`, więc pierwszy rzut
 * wyrzucał sterowanie przed `setPostep(null)`, `setBledy` i `onZmiana`.
 * Skutek był najgorszy z możliwych: napis „Wysyłam…” zostawał na ekranie,
 * błędu nie było, galeria się nie odświeżała, a zdjęcie bywało już zapisane.
 * Człowiek wybierał plik ponownie i dostawał drugi egzemplarz.
 *
 * DLACZEGO BLOKADA NA `ref`, A NIE NA `czeka`. `czeka` z `useTransition`
 * zmienia się dopiero po powrocie do Reacta, więc dwa zdarzenia `change`
 * w jednym obrocie pętli zdarzeń zobaczyłyby jeszcze `false`. `ref` jest
 * ustawiany w tej samej instrukcji, w której sprawdzamy, więc drugie wejście
 * odbija się od niego natychmiast. `disabled={czeka}` zostaje, bo robi co
 * innego: wygasza pole na oczach człowieka.
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
import { ACCEPT_ZDJEC, MAKS_BAJTOW, MAKS_MEGABAJTOW, MAKS_ZDJEC } from "@/lib/zdjecia/granice";

interface WysylkaZdjecProps {
  zdjecia: readonly ZdjecieDoPokazania[];
  /**
   * Stan listy trzyma kreator, nie ten komponent.
   *
   * Podgląd karty w katalogu stoi obok, w tym samym ekranie, i pokazuje
   * zdjęcie główne. Gdyby lista żyła tutaj, podgląd nie dowiedziałby się
   * o nowym zdjęciu i obiecywałby coś innego, niż jest.
   */
  onZmiana: (zdjecia: readonly ZdjecieDoPokazania[]) => void;
}

/** Co się stało z jednym plikiem z tej wysyłki. */
type StanPliku = {
  nazwa: string;
  stan: "czeka" | "wysylam" | "gotowe" | "blad";
  komunikat?: string;
};

/** Komunikat o odmowie niezależny od serwera, bo rozstrzyga się w przeglądarce. */
function zaDuzy(plik: File): string {
  const megabajty = (plik.size / (1024 * 1024)).toFixed(1);
  return `waży ${megabajty} MB, a przyjmujemy pliki do ${MAKS_MEGABAJTOW} MB.`;
}

export function WysylkaZdjec({ zdjecia, onZmiana }: WysylkaZdjecProps) {
  const [stanyPlikow, setStanyPlikow] = useState<readonly StanPliku[]>([]);
  const [uwaga, setUwaga] = useState<string | null>(null);
  const [czeka, startTransition] = useTransition();
  const pole = useRef<HTMLInputElement>(null);
  const idPola = useId();

  /*
   * Zapora przed drugim wejściem w trwającą wysyłkę. Patrz nagłówek pliku:
   * `czeka` ustawia się za późno, żeby się na nim opierać.
   */
  const trwa = useRef(false);

  const wolnychMiejsc = MAKS_ZDJEC - zdjecia.length;

  /** Podmienia stan jednego pliku, nie ruszając pozostałych. */
  const oznacz = (numer: number, zmiana: Omit<StanPliku, "nazwa">) => {
    setStanyPlikow((biezace) =>
      biezace.map((wpis, i) => (i === numer ? { ...wpis, ...zmiana } : wpis)),
    );
  };

  /**
   * Wysyła wybrane pliki po kolei, nie równolegle.
   *
   * Pozycję zdjęcia wybiera baza, więc dwa równoległe żądania walczyłyby
   * o ten sam numer i jedno dostałoby odmowę bez winy człowieka.
   */
  const wyslij = (pliki: readonly File[]) => {
    if (trwa.current) return;
    trwa.current = true;

    setStanyPlikow(pliki.map((plik) => ({ nazwa: plik.name, stan: "czeka" as const })));

    startTransition(async () => {
      try {
        for (const [numer, plik] of pliki.entries()) {
          /*
           * Za duży plik odrzucamy tutaj, nie na serwerze. Serwer też by go
           * odrzucił, ale wcześniej odrzuciłby go Next, wyjątkiem 413 bez
           * czytelnej treści, po tym jak człowiek przeczekał całą wysyłkę.
           */
          if (plik.size > MAKS_BAJTOW) {
            oznacz(numer, { stan: "blad", komunikat: zaDuzy(plik) });
            continue;
          }

          oznacz(numer, { stan: "wysylam" });

          const dane = new FormData();
          dane.set("zdjecie", plik);
          /*
           * Klucz tej jednej próby. Serwer odrzuca drugi zapis tego samego
           * klucza, więc ponowione żądanie nie tworzy drugiego zdjęcia.
           *
           * Klucz powstaje na próbę, a nie na zawartość pliku: ponowny wybór
           * tego samego zdjęcia ma je wstawić drugi raz, jeśli firma tego
           * chce. Przed dublowaniem po cichej awarii broni feedback niżej,
           * a ten klucz broni przed dwukrotnym wysłaniem jednego żądania.
           */
          dane.set("kluczWysylki", crypto.randomUUID());

          try {
            const wynik = await dodajZdjecieFirmy(STAN_POCZATKOWY, dane);
            const komunikat =
              wynik.status === "bledy" ? Object.values(wynik.bledy).flat().join(" ") : undefined;

            oznacz(numer, komunikat ? { stan: "blad", komunikat } : { stan: "gotowe" });
          } catch (blad) {
            /*
             * Rzut, nie zwrócony stan: 413 od Nexta, zerwane połączenie,
             * akcja zniknięta po wdrożeniu nowej wersji. Pełna treść do
             * konsoli, na ekran zdanie, z którym człowiek coś zrobi.
             */
            console.error(`Wysyłka zdjęcia ${plik.name}:`, blad);
            oznacz(numer, {
              stan: "blad",
              komunikat: "nie udało się wysłać. Sprawdź połączenie i spróbuj jeszcze raz.",
            });
          }
        }
      } finally {
        /*
         * `finally`, bo galeria musi się odświeżyć także wtedy, gdy coś
         * poszło nie tak. Zdjęcie zapisane na serwerze, a niewidoczne na
         * ekranie, to dokładnie ten stan, w którym człowiek wysyła je drugi
         * raz. Odczyt też jest w `try`: gdyby padł, blokada musi puścić.
         */
        try {
          onZmiana(await mojeZdjecia());
        } catch (blad) {
          console.error("Odczyt zdjęć po wysyłce:", blad);
          setUwaga("Zdjęcia mogły się zapisać, ale nie udało się odświeżyć listy. Odśwież stronę.");
        } finally {
          trwa.current = false;
          // Bez tego ponowny wybór tego samego pliku nie wywoła `onChange`.
          if (pole.current) pole.current.value = "";
        }
      }
    });
  };

  const usun = (id: string) => {
    if (trwa.current) return;
    trwa.current = true;

    startTransition(async () => {
      try {
        const dane = new FormData();
        dane.set("zdjecieId", id);
        const wynik = await usunZdjecieFirmy(STAN_POCZATKOWY, dane);

        setUwaga(wynik.status === "bledy" ? Object.values(wynik.bledy).flat().join(" ") : null);
        setStanyPlikow([]);
      } catch (blad) {
        console.error(`Usuwanie zdjęcia ${id}:`, blad);
        setUwaga("Nie udało się usunąć zdjęcia. Sprawdź połączenie i spróbuj jeszcze raz.");
      } finally {
        try {
          onZmiana(await mojeZdjecia());
        } catch (blad) {
          console.error("Odczyt zdjęć po usunięciu:", blad);
          setUwaga("Odśwież stronę, żeby zobaczyć aktualną listę zdjęć.");
        } finally {
          trwa.current = false;
        }
      }
    });
  };

  const udane = stanyPlikow.filter((wpis) => wpis.stan === "gotowe").length;
  const nieudane = stanyPlikow.filter((wpis) => wpis.stan === "blad");
  const wTrakcie = stanyPlikow.some((wpis) => wpis.stan === "czeka" || wpis.stan === "wysylam");

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
              setUwaga(
                wybrane.length > wolnychMiejsc
                  ? `Wybrałeś ${wybrane.length} zdjęć, a zostało ${wolnychMiejsc} miejsc. Wysyłam pierwsze ${wolnychMiejsc}.`
                  : null,
              );
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

      {/*
       * Postęp i potwierdzenie w jednym miejscu, z `aria-live` na stałe
       * obecnym elemencie. Komunikat wstawiony razem z nowym elementem
       * `role="status"` bywa pomijany przez czytniki ekranu, bo region
       * powstaje w tej samej chwili, w której dostaje treść.
       */}
      <p role="status" aria-live="polite" className="m-0 mt-2 text-[13px] leading-[1.5]">
        {wTrakcie ? (
          <span className="text-[#6A5C70]">
            {stanyPlikow.length > 1
              ? `Wysyłam zdjęcia: ${udane + nieudane.length} z ${stanyPlikow.length} gotowych.`
              : `Wysyłam ${stanyPlikow[0]?.nazwa ?? "zdjęcie"}…`}
          </span>
        ) : udane > 0 ? (
          <span className="font-medium text-[#2F6B3A]">
            {udane === 1 ? "Zdjęcie dodane." : `Dodane zdjęcia: ${udane}.`}
          </span>
        ) : null}
      </p>

      {uwaga ? (
        <p role="alert" className="m-0 mt-2 text-[13px] leading-[1.5] text-[#A33B12]">
          {uwaga}
        </p>
      ) : null}

      {nieudane.length > 0 ? (
        <ul
          role="alert"
          className="m-0 mt-2 list-none p-0 text-[13px] leading-[1.5] text-[#A33B12]"
        >
          {nieudane.map((wpis) => (
            // Nazwa pliku przy komunikacie: przy pięciu zdjęciach naraz samo
            // „zdjęcie waży za dużo" nie mówi, które wyrzucić.
            <li key={wpis.nazwa}>
              {wpis.nazwa}: {wpis.komunikat}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Szkielet panelu pokazywany, dopóki strona pod layoutem czyta z bazy.
 *
 * DLACZEGO TO MUSI ISTNIEĆ
 *
 * „Mój panel” w nagłówku to kliencki `<Link>`, więc przejście na `/panel` nie
 * jest przeładowaniem strony: przeglądarka nie rysuje własnego wskaźnika
 * ładowania, bo z jej punktu widzenia nic się nie dzieje. Bez granicy Suspense
 * router czeka w ciszy na całą odpowiedź, a człowiek widzi niezmieniony ekran
 * i klika drugi raz. Właściciel zgłosił to jako „klikam i nic się nie dzieje”.
 *
 * `loading.tsx` opakowuje `page.tsx` i wszystko pod nim w granicę Suspense,
 * więc ten szkielet trafia do przeglądarki od razu, a treść dopływa za nim.
 *
 * CZEGO TO NIE OBEJMUJE
 *
 * Granica siedzi **wewnątrz** `layout.tsx` tego segmentu, nie wokół niego, więc
 * nie zasłania czasu, który layout zużywa na własny odczyt `headers()`
 * i ustalenie widza. Ten odczyt nadal blokuje nawigację, zanim wyjdzie
 * pierwszy bajt. Zostawiamy go tam świadomie: to on odsyła anonima na
 * logowanie kodem 307, a przeniesienie go pod granicę Suspense zamieniłoby
 * odpowiedź na 200 z przekierowaniem po stronie przeglądarki i mignięciem
 * szkieletu panelu człowiekowi, który nie jest zalogowany.
 *
 * KSZTAŁT
 *
 * Szkielet powtarza rozkład `PanelScreen`: ten sam nagłówek, ta sama szerokość
 * i ta sama karta, żeby treść nie podskoczyła w chwili podmiany. Prostokąty
 * idą kolorem `linen`, nie miodowym: miodowy oznacza fakty i działania, nigdy
 * brak (docs/tokeny.md, zasada 2).
 */
export default function Wczytywanie() {
  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 sm:px-12 md:px-[130px] pt-12 pb-20 bg-[#FBF7F4] text-[#241C2B]">
      <h1 className="m-0 mb-8 font-fraunces font-normal text-[34px] sm:text-[42px] tracking-tight">
        Twój panel
      </h1>

      {/*
        Komunikat dla czytników ekranu. Same prostokąty nic im nie mówią,
        a `aria-busy` na sekcji niżej nie jest ogłaszane przez wszystkie.
      */}
      <p role="status" className="sr-only">
        Wczytujemy Twój panel.
      </p>

      <section
        aria-hidden
        className="max-w-[720px] border border-[#E2D5CA] rounded-[20px] bg-white p-7 animate-pulse"
      >
        <div className="h-[24px] w-[240px] rounded-[8px] bg-[#F2E9E2]" />
        <div className="mt-3 h-[15px] w-[320px] max-w-full rounded-[6px] bg-[#F2E9E2]" />
        <div className="mt-2 h-[15px] w-[180px] rounded-[6px] bg-[#F2E9E2]" />
        <div className="mt-6 h-[46px] w-[150px] rounded-[12px] bg-[#F2E9E2]" />
      </section>
    </main>
  );
}

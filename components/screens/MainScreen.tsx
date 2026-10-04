import Link from "next/link";
import { EtykietaPrzykladu } from "@/components/EtykietaPrzykladu";
import { WyszukiwarkaLokali } from "@/components/WyszukiwarkaLokali";
import { zlote } from "@/content/format";
import { pobierzLokale } from "@/content/ogloszenia";
import { pobierzOkazje } from "@/content/okazje";

export function MainScreen() {
  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      {/* Hero Section */}
      <section
        id="top"
        className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-16 md:pt-24 pb-16 md:pb-[92px] relative"
        style={{
          background:
            "radial-gradient(760px 420px at 34% 34%, rgba(240,166,46,0.20), rgba(240,166,46,0) 68%)",
        }}
      >
        <p className="m-0 mb-6 md:mb-[34px] text-[16px] text-[#6A5C70] max-w-[520px]">
          Miejsca i ludzie na każdą okazję, od chrzcin po firmową wigilię.
        </p>

        {/* Nagłówek nie odmienia nazw przez przypadki: przy wszystkich
            miejscowościach w Polsce nie ma wiarygodnego miejscownika dla
            każdej nazwy (punkt 3.1 planu). Zamiast zdania są pola z etykietami. */}
        <h1 className="m-0 mb-8 font-fraunces font-normal text-[36px] sm:text-[48px] md:text-[62px] leading-[1.2] tracking-tight max-w-[900px]">
          Znajdź lokal na swoją uroczystość
        </h1>

        <WyszukiwarkaLokali
          wariant="hero"
          kryteria={{
            rodzaj: null,
            miejscowosc: null,
            promienKm: 25,
            goscie: null,
            termin: null,
            udogodnienia: [],
          }}
        />
      </section>

      {/* Po co ludzie tu przychodzą */}
      <section id="lokale" className="shrink-0 px-6 sm:px-12 md:px-[130px] py-[76px] bg-[#F2E9E2]">
        <h2 className="m-0 mb-2 font-fraunces font-medium text-[32px]">
          Po co ludzie tu przychodzą
        </h2>
        <p className="m-0 mb-8 text-[16px] leading-[1.6] text-[#3E3344] max-w-[70ch]">
          Każda okazja ma swoją stronę: jakie rodzaje lokali do niej pasują i jakich usługodawców
          zwykle się dobiera.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {pobierzOkazje().map((okazja) => (
            <Link
              key={okazja.slug}
              href={`/okazje/${okazja.slug}`}
              className="text-left bg-[#FBF7F4] hover:bg-white hover:shadow-md transition-all border border-[#E2D5CA] rounded-[14px] p-6 flex flex-col gap-3.5 cursor-pointer text-[#241C2B]"
            >
              <span className="text-[17px] font-semibold">{okazja.nazwa}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Reverse Marketplace CTA Banner */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] py-[72px] bg-[#241C2B] text-[#FBF7F4] flex flex-col lg:flex-row gap-12 lg:gap-[90px] items-center">
        <div className="grow max-w-[620px]">
          <h2 className="m-0 mb-4 font-fraunces font-normal text-[32px] md:text-[40px] leading-[1.24] text-[#FBF7F4]">
            Albo odwrotnie: niech oferty przyjdą do Ciebie
          </h2>
          <p className="m-0 mb-8 text-[17px] leading-[1.65] text-[#D5C7D0]">
            Opisz wydarzenie jeden raz. Firmy z okolicy składają oferty, nie widząc nawzajem swoich
            cen. Twoje dane zobaczy tylko ta firma, którą sam wybierzesz.
          </p>
          <Link
            href="/dodaj-zlecenie"
            className="inline-block text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors rounded-full px-[34px] py-[17px] border-0 cursor-pointer"
          >
            Opisz wydarzenie
          </Link>
        </div>

        <div className="w-full lg:w-[430px] shrink-0 bg-[#3A2D42] rounded-[18px] p-[30px] flex flex-col gap-4 shadow-xl">
          <p className="m-0 text-[13px] text-[#B9A8B6] tracking-wide">
            Twoje zlecenie widzą firmy jako
          </p>
          <div className="bg-[#241C2B] rounded-[12px] p-[22px] flex flex-col gap-3">
            <div className="font-fraunces text-[21px] text-[#FBF7F4]">
              Komunia, powiat wrocławski
            </div>
            <div className="text-[15px] text-[#D5C7D0]">12 czerwca 2027 &nbsp;·&nbsp; 80 osób</div>
            <div className="h-[1px] bg-[#4A3D50]" />
            <div className="flex items-center gap-2.5 text-[14px] text-[#B9A8B6]">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F0A62E"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              Opis, budżet i kontakt tylko dla firm z abonamentem
            </div>
          </div>
        </div>
      </section>

      {/* Sale w okolicy Wrocławia */}
      <section id="uslugodawcy-preview" className="shrink-0 px-6 sm:px-12 md:px-[130px] py-20">
        <div className="flex items-baseline justify-between mb-[34px]">
          <h2 className="m-0 font-fraunces font-medium text-[32px]">Sale w okolicy Wrocławia</h2>
          <Link
            href="/lokale"
            className="text-[15px] font-semibold text-[#8A5405] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer"
          >
            Zobacz wszystkie
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[26px]">
          {pobierzLokale()
            .filter((lokal) => lokal.status === "active")
            .map((lokal) => (
              <Link
                key={lokal.slug}
                href={`/f/${lokal.slug}`}
                className="text-left border border-[#E2D5CA] rounded-[16px] overflow-hidden bg-white flex flex-col cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="h-[180px] bg-[#E4D9CF]" />
                <div className="p-[22px] flex flex-col gap-2.5">
                  <div className="font-fraunces text-[22px]">{lokal.nazwa}</div>
                  <div className="text-[14px] text-[#6A5C70]">
                    {lokal.miejscowosc.nazwa} &nbsp;·&nbsp; {lokal.miejscowosc.odlegloscOdCentrumKm}{" "}
                    km od centrum
                  </div>
                  {lokal.przykladowe ? (
                    <div>
                      <EtykietaPrzykladu />
                    </div>
                  ) : null}
                  <div className="flex gap-2 my-1 flex-wrap">
                    {lokal.udogodnienia.map((udogodnienie) => (
                      <span
                        key={udogodnienie}
                        className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[6px] px-2.5 py-1"
                      >
                        {udogodnienie}
                      </span>
                    ))}
                  </div>
                  {lokal.cenaOdGrosze === null ? null : (
                    <div className="flex items-baseline justify-between border-t border-[#EFE5DD] pt-3.5 mt-2">
                      <span className="text-[15px]">
                        <strong className="text-[20px] border-b-2 border-[#F0A62E]">
                          {zlote(lokal.cenaOdGrosze)}
                        </strong>{" "}
                        {lokal.jednostkaCeny}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* Jak to działa */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] py-[74px] bg-[#F2E9E2]">
        <h2 className="m-0 mb-[38px] font-fraunces font-medium text-[32px]">Jak to działa</h2>
        <ol className="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-3 gap-10">
          <li className="flex flex-col gap-3">
            <span className="font-fraunces text-[42px] text-[#C9B5A6] leading-none">1</span>
            <span className="text-[19px] font-bold">Powiedz, czego szukasz</span>
            <span className="text-[16px] leading-[1.62] text-[#55485A]">
              Przeglądaj miejsca sam albo opisz wydarzenie i pozwól firmom się zgłosić.
            </span>
          </li>
          <li className="flex flex-col gap-3">
            <span className="font-fraunces text-[42px] text-[#C9B5A6] leading-none">2</span>
            <span className="text-[19px] font-bold">Porównaj oferty obok siebie</span>
            <span className="text-[16px] leading-[1.62] text-[#55485A]">
              Cena, zakres i wolny termin w jednej tabeli. Bez dzwonienia po dwudziestu numerach.
            </span>
          </li>
          <li className="flex flex-col gap-3">
            <span className="font-fraunces text-[42px] text-[#C9B5A6] leading-none">3</span>
            <span className="text-[19px] font-bold">Dogadaj się bezpośrednio</span>
            <span className="text-[16px] leading-[1.62] text-[#55485A]">
              Umowę i pieniądze ustalacie między sobą. Nie bierzemy prowizji od Twojego wesela.
            </span>
          </li>
        </ol>
      </section>

      {/* Po wydarzeniu */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] py-20">
        <h2 className="m-0 mb-[34px] font-fraunces font-medium text-[32px]">Po wydarzeniu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[26px]">
          <figure className="m-0 border border-[#E2D5CA] rounded-[16px] p-[26px] flex flex-col gap-4 bg-white shadow-sm">
            <blockquote className="m-0 font-fraunces text-[19px] leading-[1.55]">
              Cena z oferty zgadzała się co do złotówki z fakturą. Po dwóch poprzednich salach to
              była ulga.
            </blockquote>
            <figcaption className="text-[14px] text-[#6A5C70] leading-[1.6]">
              Anna K. &nbsp;·&nbsp; komunia, 60 osób
              <br />
              maj 2026 &nbsp;·&nbsp; zlecenie przez Gościnnie
            </figcaption>
          </figure>

          <figure className="m-0 border border-[#E2D5CA] rounded-[16px] p-[26px] flex flex-col gap-4 bg-white shadow-sm">
            <blockquote className="m-0 font-fraunces text-[19px] leading-[1.55]">
              Sześć ofert na DJ w jeden wieczór. Wybraliśmy nie najtańszą, tylko tę z najlepiej
              opisanym zakresem.
            </blockquote>
            <figcaption className="text-[14px] text-[#6A5C70] leading-[1.6]">
              Michał i Ola &nbsp;·&nbsp; wesele, 120 osób
              <br />
              sierpień 2026 &nbsp;·&nbsp; zlecenie przez Gościnnie
            </figcaption>
          </figure>

          <figure className="m-0 border border-[#E2D5CA] rounded-[16px] p-[26px] flex flex-col gap-4 bg-white shadow-sm">
            <blockquote className="m-0 font-fraunces text-[19px] leading-[1.55]">
              Szukałam sali na stypę w dwa dni. Trzy miejsca odpisały tego samego popołudnia.
            </blockquote>
            <figcaption className="text-[14px] text-[#6A5C70] leading-[1.6]">
              Barbara W. &nbsp;·&nbsp; stypa, 35 osób
              <br />
              marzec 2026 &nbsp;·&nbsp; zapytanie przez Gościnnie
            </figcaption>
          </figure>
        </div>
        <p className="mt-6 mb-0 text-[14px] text-[#6A5C70]">
          Opinię wystawia tylko osoba, której zapytanie lub zlecenie przeszło przez serwis.{" "}
          <Link
            href="/kontakt"
            className="text-[#8A5405] hover:text-[#241C2B] underline bg-transparent border-0 cursor-pointer"
          >
            Jak weryfikujemy opinie
          </Link>
        </p>
      </section>

      {/* For businesses banner */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] py-[60px] bg-[#F0A62E] flex flex-col md:flex-row items-center gap-8 md:gap-[60px]">
        <div className="grow">
          <h2 className="m-0 mb-2.5 font-fraunces font-medium text-[31px] text-[#241C2B]">
            Prowadzisz salę albo grasz na weselach?
          </h2>
          <p className="m-0 text-[17px] text-[#4A3312]">
            Stały abonament roczny zamiast płacenia za każdy kontakt. Jedno pozyskane zlecenie
            zwraca cały rok.
          </p>
        </div>
        <Link
          href="/cennik"
          className="shrink-0 text-[16px] font-bold text-[#FBF7F4] bg-[#241C2B] hover:bg-black transition-colors rounded-full px-9 py-[18px] border-0 cursor-pointer"
        >
          Zobacz cennik
        </Link>
      </section>
    </div>
  );
}

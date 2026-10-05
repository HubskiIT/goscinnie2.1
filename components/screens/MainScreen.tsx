import { CalendarDays, ClipboardList, Receipt, Send, Sparkles, Store } from "lucide-react";
import Link from "next/link";
import { EtykietaPrzykladu } from "@/components/EtykietaPrzykladu";
import { WyszukiwarkaLokali } from "@/components/WyszukiwarkaLokali";
import { dataDluga, dzienTygodnia, zlote } from "@/content/format";
import { pobierzImprezy, pobierzLokal, pobierzLokale } from "@/content/ogloszenia";
import { pobierzOkazje } from "@/content/okazje";
import { pobierzRodzajeLokali } from "@/content/rodzaje-lokali";

/**
 * Hero zostaje wyszukiwarką lokali, bo z tym przychodzi większość odwiedzających.
 * Rozdroże dla wszystkich intencji kosztowałoby każdego jedno kliknięcie.
 * Pozostałe trzy drogi dostają tani skrót tuż pod wyszukiwarką, a niżej
 * własne sekcje.
 */
const DROGI = [
  {
    adres: "/lokale",
    ikona: Store,
    etykieta: "Szukam sali albo lokalu",
    opis: "Sale weselne, dwory, restauracje, stodoły i ogrody. Każdy wpis z ceną od.",
  },
  {
    adres: "/uslugodawcy",
    ikona: Sparkles,
    etykieta: "Szukam usługodawcy",
    opis: "Fotograf, zespół, catering, DJ, dekoracje. Z zasięgiem dojazdu, nie tylko adresem.",
  },
  {
    adres: "/dodaj-zlecenie",
    ikona: Send,
    etykieta: "Niech firmy zgłoszą się same",
    opis: "Opisujesz wydarzenie raz, oferty przychodzą do Ciebie. Bez obdzwaniania.",
  },
  {
    adres: "/imprezy",
    ikona: CalendarDays,
    etykieta: "Chcę gdzieś wyjść",
    opis: "Imprezy zorganizowane przez lokale: andrzejki, sylwester, wigilie firmowe.",
  },
] as const;

const KONKRETY = [
  {
    ikona: Receipt,
    tytul: "Cena zawsze widoczna",
    opis: "Wpis bez ceny od nie przechodzi moderacji. Nie dzwonisz, żeby poznać widełki.",
  },
  {
    ikona: Send,
    tytul: "Jedno zapytanie do kilku firm",
    opis: "Odkładasz miejsca na krótką listę i pytasz wszystkie naraz. Twój numer widzi tylko ta firma, którą wybierzesz.",
  },
  {
    ikona: ClipboardList,
    tytul: "Zero prowizji od umowy",
    opis: "Umawiasz się z firmą bezpośrednio. Klient nie płaci nam nigdy i za nic.",
  },
] as const;

export function MainScreen() {
  const lokale = pobierzLokale().filter((lokal) => lokal.status === "active");
  const imprezy = pobierzImprezy();
  const rodzaje = pobierzRodzajeLokali();

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      {/* Hero */}
      <section
        id="top"
        className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-16 md:pt-24 pb-14 relative"
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

        {/* Tani skrót dla tych, którzy nie szukają sali. */}
        <p className="m-0 mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-[#55485A]">
          <span>Szukasz czegoś innego?</span>
          {DROGI.filter((droga) => droga.adres !== "/lokale").map((droga) => (
            <Link
              key={droga.adres}
              href={droga.adres}
              className="font-semibold text-[#8A5405] underline underline-offset-4 hover:text-[#241C2B]"
            >
              {droga.etykieta}
            </Link>
          ))}
        </p>
      </section>

      {/* Czym to się różni od obdzwaniania sal */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] py-12 border-y border-[#EADFD6] bg-white">
        <ul className="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-3 gap-8">
          {KONKRETY.map((konkret) => {
            const Ikona = konkret.ikona;
            return (
              <li key={konkret.tytul} className="flex gap-3.5">
                <Ikona aria-hidden="true" size={22} className="shrink-0 mt-0.5 text-[#5E7360]" />
                <div>
                  <p className="m-0 text-[16px] font-bold">{konkret.tytul}</p>
                  <p className="m-0 mt-1 text-[15px] leading-[1.6] text-[#55485A]">
                    {konkret.opis}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Cztery drogi przez serwis */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] py-[72px] bg-[#F2E9E2]">
        <h2 className="m-0 mb-2 font-fraunces font-medium text-[32px]">Od czego zaczniesz</h2>
        <p className="m-0 mb-8 text-[16px] leading-[1.6] text-[#3E3344] max-w-[70ch]">
          Cztery drogi, wszystkie bez konta i bez opłat po Twojej stronie.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DROGI.map((droga) => {
            const Ikona = droga.ikona;
            return (
              <Link
                key={droga.adres}
                href={droga.adres}
                className="group bg-[#FBF7F4] hover:bg-white hover:shadow-md transition-all border border-[#E2D5CA] rounded-[16px] p-6 flex flex-col gap-3 text-[#241C2B]"
              >
                <Ikona aria-hidden="true" size={24} className="text-[#5E7360]" />
                <span className="font-fraunces text-[20px] leading-[1.3]">{droga.etykieta}</span>
                <span className="text-[14px] leading-[1.6] text-[#55485A]">{droga.opis}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Lokale */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] py-[72px]">
        <div className="flex items-baseline justify-between gap-6 mb-7">
          <h2 className="m-0 font-fraunces font-medium text-[32px]">Lokale</h2>
          <Link
            href="/lokale"
            className="shrink-0 text-[15px] font-semibold text-[#8A5405] hover:text-[#241C2B]"
          >
            Zobacz wszystkie
          </Link>
        </div>

        {/* Wejścia po rodzaju działają niezależnie od tego, ile wpisów jest w katalogu. */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          {rodzaje.map((rodzaj) => (
            <Link
              key={rodzaj.slug}
              href={`/lokale?rodzaj=${rodzaj.slug}`}
              className="text-[14px] text-[#3E3344] bg-white border border-[#D9CCC2] hover:border-[#241C2B] transition-colors rounded-full px-4 py-2"
            >
              {rodzaj.nazwaMnoga}
            </Link>
          ))}
        </div>

        {lokale.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[26px]">
            {lokale.map((lokal) => (
              <Link
                key={lokal.slug}
                href={`/f/${lokal.slug}`}
                className="text-left border border-[#E2D5CA] rounded-[16px] overflow-hidden bg-white flex flex-col hover:shadow-lg transition-all"
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
        ) : null}
      </section>

      {/* Imprezy */}
      {imprezy.length > 0 ? (
        <section className="shrink-0 px-6 sm:px-12 md:px-[130px] py-[72px] bg-[#F2E9E2]">
          <div className="flex items-baseline justify-between gap-6 mb-2">
            <h2 className="m-0 font-fraunces font-medium text-[32px]">Imprezy</h2>
            <Link
              href="/imprezy"
              className="shrink-0 text-[15px] font-semibold text-[#8A5405] hover:text-[#241C2B]"
            >
              Zobacz wszystkie
            </Link>
          </div>
          <p className="m-0 mb-8 text-[16px] leading-[1.6] text-[#3E3344] max-w-[70ch]">
            Wydarzenia, które lokale organizują same. Nic nie planujesz, rezerwujesz miejsce i
            przychodzisz.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[26px]">
            {imprezy.map((impreza) => {
              const lokal = pobierzLokal(impreza.lokalSlug);
              return (
                <Link
                  key={impreza.slug}
                  href={`/imprezy/${impreza.slug}`}
                  className="border border-[#E2D5CA] rounded-[16px] bg-[#FBF7F4] hover:bg-white hover:shadow-md transition-all p-6 flex flex-col gap-2.5"
                >
                  <span className="text-[14px] font-semibold text-[#8A5405]">
                    {dzienTygodnia(impreza.data)}, {dataDluga(impreza.data)}
                  </span>
                  <span className="font-fraunces text-[22px] leading-[1.3]">{impreza.nazwa}</span>
                  {lokal === undefined ? null : (
                    <span className="text-[14px] text-[#6A5C70]">
                      {lokal.nazwa} &nbsp;·&nbsp; {lokal.miejscowosc.nazwa}
                    </span>
                  )}
                  {impreza.przykladowe ? (
                    <div>
                      <EtykietaPrzykladu />
                    </div>
                  ) : null}
                  <span className="mt-1 text-[15px]">
                    <strong className="text-[18px]">{zlote(impreza.cenaBiletuGrosze)}</strong> od
                    osoby
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Giełda zleceń */}
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
            className="inline-block text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors rounded-full px-[34px] py-[17px]"
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
            <div className="text-[15px] text-[#D5C7D0]">80 osób</div>
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

      {/* Jak to działa */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] py-[74px]">
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

      {/* Okazje jako wejścia, nie jako główna nawigacja */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] py-[60px] bg-[#F2E9E2]">
        <h2 className="m-0 mb-2 font-fraunces font-medium text-[26px]">Zacznij od okazji</h2>
        <p className="m-0 mb-6 text-[15px] leading-[1.6] text-[#55485A] max-w-[70ch]">
          Każda okazja ma swoją stronę: jakie rodzaje lokali do niej pasują i jakich usługodawców
          zwykle się dobiera.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {pobierzOkazje().map((okazja) => (
            <Link
              key={okazja.slug}
              href={`/okazje/${okazja.slug}`}
              className="text-[15px] text-[#3E3344] bg-[#FBF7F4] border border-[#E2D5CA] hover:border-[#241C2B] transition-colors rounded-full px-4 py-2"
            >
              {okazja.nazwa}
            </Link>
          ))}
        </div>
      </section>

      {/* Dla firm */}
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
          className="shrink-0 text-[16px] font-bold text-[#FBF7F4] bg-[#241C2B] hover:bg-black transition-colors rounded-full px-9 py-[18px]"
        >
          Zobacz cennik
        </Link>
      </section>
    </div>
  );
}

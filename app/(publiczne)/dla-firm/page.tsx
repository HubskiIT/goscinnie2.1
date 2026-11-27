import type { Metadata } from "next";
import Link from "next/link";
import { metadaneStrony } from "@/lib/metadane";
import { CZYM_JESTESMY } from "@/lib/serwis";
import { TRASY } from "@/lib/trasy";

export const metadata: Metadata = metadaneStrony({
  tytul: "Dla firm — dodaj lokal lub usługę bezpłatnie",
  opis: "Pozyskuj klientów na wesela, komunie, chrzciny i imprezy firmowe bez prowizji od umów. Dodanie i prowadzenie profilu jest bezpłatne.",
  sciezka: TRASY.dlaFirm,
});

const KROKI = [
  {
    tytul: "Konto",
    opis: "Adres e-mail i hasło. Na adres przyjdzie kod, którym potwierdzasz, że skrzynka jest Twoja.",
  },
  {
    tytul: "Profil",
    opis: "Rodzaj lokalu albo usługi, nazwa, miejscowość, opis, cena od i pojemność. Na bieżąco widzisz, jak karta wygląda w katalogu.",
  },
  {
    tytul: "Weryfikacja firmy",
    opis: "NIP i telefon. Nie pokazujemy ich na profilu. Służą do sprawdzenia, że firma istnieje, i do kontaktu w sprawie konta.",
  },
  {
    tytul: "Publikacja",
    opis: "Jedno kliknięcie i firma jest w katalogu. Poprawki wprowadzasz później z panelu.",
  },
] as const;

const KORZYSCI = [
  {
    tytul: "0 zł na start, 0% prowizji",
    opis: "Dodanie obiektu lub usług jest całkowicie darmowe. Klienci umawiają się bezpośrednio z Tobą.",
  },
  {
    tytul: "Alerty o nowych zleceniach",
    opis: "Gdy klient szuka sali lub usługodawcy w Twoim powiecie, dostajesz powiadomienie e-mail i składasz ofertę.",
  },
  {
    tytul: "Własne imprezy otwarte",
    opis: "Prowadzisz lokal? Zapowiadaj sylwestra, andrzejki i kolacje tematyczne z własną stroną w Google.",
  },
] as const;

const FAQ = [
  {
    q: "Ile kosztuje dodanie firmy do Gościnnie?",
    a: "Dodanie firmy, prowadzenie profilu, zdjęcia, kalendarz terminów oraz odbieranie zapytań są obecnie bezpłatne.",
  },
  {
    q: "Czy pobieracie prowizję od wesela lub imprezy?",
    a: "Nie. Gościnnie nigdy nie pobiera prowizji od umów ani od biletów na imprezy.",
  },
  {
    q: "Co jeśli mój lokal jest już w katalogu jako wizytówka?",
    a: "Wejdź na stronę swojego lokalu i kliknij „Przejmij ten profil” — po szybkiej weryfikacji przekażemy Ci pełny dostęp.",
  },
] as const;

export default function Strona() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 sm:px-12 md:px-[130px] pt-14 pb-20 bg-[#FBF7F4] text-[#241C2B]">
      <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>

      <div className="max-w-[780px] mb-12">
        <span className="inline-block text-[13px] font-bold uppercase tracking-wider text-[#3F5142] bg-[#E7EDE7] rounded-full px-3.5 py-1 mb-4">
          Bezpłatny start dla firm
        </span>
        <h1 className="m-0 mb-4 font-fraunces font-normal text-[36px] sm:text-[48px] tracking-tight leading-[1.15]">
          Pozyskuj zapytania na uroczystości bez prowizji
        </h1>
        <p className="m-0 mb-3 text-[17px] leading-[1.7] text-[#3E3344]">{CZYM_JESTESMY}</p>
        <p className="m-0 mb-7 text-[17px] leading-[1.7] text-[#3E3344]">
          Dodanie firmy, galeria zdjęć, kalendarz wolnych terminów i odpowiadanie na zlecenia są na
          start bezpłatne.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/rejestracja-firmy"
            className="text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors rounded-[12px] px-7 py-4 shadow-xs"
          >
            Dodaj firmę bezpłatnie
          </Link>
          <Link
            href="/lokale"
            className="text-[15px] font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] hover:bg-[#241C2B] hover:text-white transition-colors rounded-[12px] px-6 py-3.5"
          >
            Sprawdź, czy już tu jesteś
          </Link>
          <Link href="/logowanie" className="text-[15px] font-semibold text-[#6A5C70] underline">
            Zaloguj się
          </Link>
        </div>
      </div>

      <section className="mb-14 grid grid-cols-1 md:grid-cols-3 gap-5">
        {KORZYSCI.map((k) => (
          <div key={k.tytul} className="border border-[#E2D5CA] rounded-[20px] bg-white p-6">
            <h2 className="m-0 mb-2 font-fraunces font-medium text-[22px]">{k.tytul}</h2>
            <p className="m-0 text-[15px] leading-[1.6] text-[#6A5C70]">{k.opis}</p>
          </div>
        ))}
      </section>

      <h2 className="m-0 mb-5 font-fraunces font-medium text-[28px]">Jak to działa w 4 krokach</h2>
      <ol className="m-0 mb-14 p-0 list-none grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[960px]">
        {KROKI.map((krok, i) => (
          <li key={krok.tytul} className="border border-[#E2D5CA] rounded-[20px] bg-white p-6">
            <p className="m-0 mb-1 text-[13px] font-bold tracking-wider uppercase text-[#5E7360]">
              Krok {i + 1}
            </p>
            <h3 className="m-0 mb-2 font-fraunces font-medium text-[22px]">{krok.tytul}</h3>
            <p className="m-0 text-[15px] leading-[1.6] text-[#6A5C70]">{krok.opis}</p>
          </li>
        ))}
      </ol>

      <section className="max-w-[820px] border-t border-[#E2D5CA] pt-10">
        <h2 className="m-0 mb-6 font-fraunces font-medium text-[28px]">Najczęstsze pytania</h2>
        <div className="flex flex-col gap-4">
          {FAQ.map((item) => (
            <div key={item.q} className="border border-[#E2D5CA] rounded-[16px] bg-white p-5">
              <h3 className="m-0 mb-1.5 font-fraunces text-[19px] font-medium">{item.q}</h3>
              <p className="m-0 text-[15px] leading-[1.6] text-[#6A5C70]">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

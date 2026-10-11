import type { Metadata } from "next";
import Link from "next/link";
import { CZYM_JESTESMY } from "@/lib/serwis";

export const metadata: Metadata = {
  title: "Dla firm",
  description: "Dodaj lokal albo usługi do katalogu Gościnnie. Bezpłatnie.",
};

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

export default function Strona() {
  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 sm:px-12 md:px-[130px] pt-14 pb-20 bg-[#FBF7F4] text-[#241C2B]">
      <h1 className="m-0 mb-4 max-w-[760px] font-fraunces font-normal text-[36px] sm:text-[46px] tracking-tight">
        Dodaj swoją firmę do Gościnnie
      </h1>
      <p className="m-0 mb-3 max-w-[640px] text-[17px] leading-[1.7] text-[#3E3344]">
        {CZYM_JESTESMY}
      </p>
      <p className="m-0 mb-10 max-w-[640px] text-[17px] leading-[1.7] text-[#3E3344]">
        Dodanie firmy i prowadzenie profilu jest bezpłatne.
      </p>

      <ol className="m-0 mb-10 p-0 list-none grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[960px]">
        {KROKI.map((krok, i) => (
          <li key={krok.tytul} className="border border-[#E2D5CA] rounded-[20px] bg-white p-6">
            <p className="m-0 mb-1 text-[13px] font-bold tracking-wider uppercase text-[#5E7360]">
              Krok {i + 1}
            </p>
            <h2 className="m-0 mb-2 font-fraunces font-medium text-[22px]">{krok.tytul}</h2>
            <p className="m-0 text-[15px] leading-[1.6] text-[#6A5C70]">{krok.opis}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-5">
        <Link
          href="/rejestracja-firmy"
          className="text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors rounded-[12px] px-6 py-3.5"
        >
          Dodaj firmę
        </Link>
        <Link href="/logowanie" className="text-[15px] font-semibold text-[#241C2B] underline">
          Masz już konto? Zaloguj się
        </Link>
      </div>
    </main>
  );
}

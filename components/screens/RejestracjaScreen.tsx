import Link from "next/link";
import { TRASY } from "@/lib/trasy";

/**
 * Rozdroże rejestracji: firma albo klient.
 *
 * Wcześniej jedyną drogą do konta był kreator firmy. Człowiek, który chciał
 * wynająć salę, klikał „Rejestracja" i lądował na ekranie „Dodaj swoją firmę
 * do katalogu", gdzie nic nie pasowało do tego, po co przyszedł. Pytanie,
 * czego kto potrzebuje, musi paść **przed** formularzem, a nie wynikać
 * z tego, że inny formularz nie istnieje.
 *
 * Komponent jest serwerowy: dwa odnośniki, zero stanu.
 */
export function RejestracjaScreen() {
  return (
    <section className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] min-h-screen px-6 sm:px-12 md:px-[130px] pt-14 pb-16">
      <h1 className="m-0 mb-2.5 font-fraunces font-normal text-[36px] sm:text-[44px] tracking-tight">
        Załóż konto w Gościnnie
      </h1>
      <p className="m-0 mb-10 text-[17px] leading-[1.6] text-[#3E3344] max-w-[62ch]">
        Dwie drogi, bo dwie różne sprawy. Wybierz tę, po którą przyszedłeś. Jeśli jesteś i jednym, i
        drugim, na przykład prowadzisz salę, a teraz organizujesz komunię, jedno konto wystarczy:
        zacznij od firmy, zlecenie dodasz tym samym kontem.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <article className="flex flex-col border border-[#D9CCC2] rounded-[20px] bg-white p-7 sm:p-9 shadow-sm">
          <h2 className="m-0 mb-2 font-fraunces font-medium text-[26px]">
            Szukam sali albo usługodawcy
          </h2>
          <p className="m-0 mb-5 text-[15px] leading-[1.65] text-[#55485A]">
            Opisujesz raz, czego potrzebujesz, a firmy same przysyłają oferty. Przeglądanie katalogu
            konta nie wymaga, konto jest potrzebne dopiero do wystawienia zlecenia.
          </p>
          <ul className="m-0 mb-7 list-disc pl-5 text-[15px] leading-[1.8] text-[#3E3344]">
            <li>Nie płacisz nigdy i za nic</li>
            <li>Twój numer i adres poznaje tylko firma, którą sam wybierzesz</li>
            <li>Oferty czytasz w jednym miejscu, bez przeglądania skrzynki</li>
          </ul>
          <Link
            href={TRASY.rejestracjaKlienta}
            className="mt-auto block w-full text-center text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors rounded-[12px] p-4 shadow-sm"
          >
            Załóż konto klienta
          </Link>
        </article>

        <article className="flex flex-col border border-[#D9CCC2] rounded-[20px] bg-white p-7 sm:p-9 shadow-sm">
          <h2 className="m-0 mb-2 font-fraunces font-medium text-[26px]">
            Mam firmę i chcę być w katalogu
          </h2>
          <p className="m-0 mb-5 text-[15px] leading-[1.65] text-[#55485A]">
            Lokal stacjonarny albo usługodawca dojeżdżający do klienta: sala, dwór, restauracja, ale
            też fotograf, zespół, catering, DJ czy florysta.
          </p>
          <ul className="m-0 mb-7 list-disc pl-5 text-[15px] leading-[1.8] text-[#3E3344]">
            <li>Dodanie firmy i prowadzenie profilu jest bezpłatne</li>
            <li>Profil powstaje w kreatorze, krok po kroku</li>
            <li>NIP i telefon zostają u nas, na profilu ich nie ma</li>
          </ul>
          <Link
            href={TRASY.rejestracjaFirmy}
            className="mt-auto block w-full text-center text-[16px] font-semibold text-[#241C2B] border-[1.5px] border-[#241C2B] rounded-[12px] p-3.5 hover:bg-[#241C2B] hover:text-white transition-colors bg-white"
          >
            Dodaj swoją firmę
          </Link>
        </article>
      </div>

      <p className="mt-8 mb-0 text-[15px] text-[#6A5C70]">
        Masz już konto?{" "}
        <Link href={TRASY.logowanie} className="text-[#8A5405] underline hover:text-[#241C2B]">
          Zaloguj się
        </Link>
      </p>
    </section>
  );
}

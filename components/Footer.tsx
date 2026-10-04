"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

interface FooterProps {
  dark?: boolean;
}

export function Footer({ dark }: FooterProps) {
  const sciezka = usePathname();
  const ciemna = dark ?? sciezka === "/";
  if (ciemna) {
    return (
      <footer className="grow shrink-0 box-border px-8 md:px-[130px] py-[62px] bg-[#241C2B] text-[#D5C7D0] flex flex-col md:flex-row gap-12 md:gap-[90px]">
        <div className="w-full md:w-[300px] shrink-0">
          <div className="font-fraunces text-[26px] text-[#FBF7F4] mb-3.5 font-semibold">
            Gościnnie
          </div>
          <p className="m-0 text-[14px] leading-[1.7]">
            Miejsca i ludzie na każdą okazję. Nie pobieramy prowizji od umów zawartych przez serwis.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-10 grow">
          <div className="flex flex-col gap-2.5">
            <span className="text-[15px] font-bold text-[#FBF7F4]">Szukam</span>
            <Link
              href="/lokale"
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Sale weselne
            </Link>
            <Link
              href="/lokale"
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Lokale na komunię
            </Link>
            <Link
              href="/uslugodawcy"
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              DJ i zespoły
            </Link>
            <Link
              href="/uslugodawcy"
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Catering
            </Link>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[15px] font-bold text-[#FBF7F4]">Dla firm</span>
            <Link
              href="/cennik"
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Cennik abonamentu
            </Link>
            <Link
              href="/rejestracja-firmy"
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Przejmij swój profil
            </Link>
            <Link
              href="/cennik"
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Promowanie
            </Link>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[15px] font-bold text-[#FBF7F4]">Serwis</span>
            <Link
              href="/kontakt"
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Jak weryfikujemy opinie
            </Link>
            <Link
              href="/kontakt"
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Regulamin
            </Link>
            <Link
              href="/kontakt"
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Prywatność
            </Link>
            <Link
              href="/kontakt"
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Zgłoś treść
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  // Light beige footer
  return (
    <footer className="shrink-0 box-border px-8 md:px-[130px] pt-[54px] pb-[34px] bg-[#F2E9E2] border-t border-[#E2D5CA]">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 md:gap-10">
        <div>
          <div className="font-fraunces text-[24px] font-semibold text-[#241C2B]">Gościnnie</div>
          <p className="mt-3 mb-0 text-[14px] leading-[1.7] text-[#55485A] max-w-[30ch]">
            Katalog miejsc i usługodawców na każdą okazję oraz giełda zleceń. Klient nie płaci
            nigdy.
          </p>
        </div>

        <div>
          <div className="text-[13px] font-bold tracking-wider uppercase text-[#55485A] mb-4">
            Dla klientów
          </div>
          <Link
            href="/lokale"
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Sale i lokale
          </Link>
          <Link
            href="/uslugodawcy"
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Usługodawcy
          </Link>
          <Link
            href="/imprezy"
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Imprezy
          </Link>
          <Link
            href="/dodaj-zlecenie"
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Wystaw zlecenie
          </Link>
        </div>

        <div>
          <div className="text-[13px] font-bold tracking-wider uppercase text-[#55485A] mb-4">
            Dla firm
          </div>
          <Link
            href="/cennik"
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Cennik abonamentu
          </Link>
          <Link
            href="/rejestracja-firmy"
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Dodaj swoją firmę
          </Link>
          <Link
            href="/zlecenia"
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Giełda zleceń
          </Link>
          <Link
            href="/logowanie"
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Zaloguj się
          </Link>
        </div>

        <div>
          <div className="text-[13px] font-bold tracking-wider uppercase text-[#55485A] mb-4">
            Popularne
          </div>
          <Link
            href="/lokale"
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Sale weselne Wrocław
          </Link>
          <Link
            href="/lokale"
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Sale na komunię Kraków
          </Link>
          <Link
            href="/uslugodawcy"
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Fotografowie Poznań
          </Link>
          <Link
            href="/imprezy"
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Andrzejki Warszawa
          </Link>
        </div>

        <div>
          <div className="text-[13px] font-bold tracking-wider uppercase text-[#55485A] mb-4">
            Serwis
          </div>
          <Link
            href="/kontakt"
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Kontakt
          </Link>
          <Link
            href="/kontakt"
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Zgłoś treść
          </Link>
          <span className="block text-[14px] text-[#8B7F91] mb-2.5">Regulamin</span>
          <span className="block text-[14px] text-[#8B7F91]">Polityka prywatności</span>
        </div>
      </div>

      <div className="mt-[38px] pt-[22px] border-t border-[#E2D5CA] flex flex-col sm:flex-row justify-between gap-2 text-[13px] text-[#6A5C70]">
        <span>© 2026 Gościnnie</span>
        <span>Dwie pozycje bez odnośnika czekają na dokumenty prawne.</span>
      </div>
    </footer>
  );
}

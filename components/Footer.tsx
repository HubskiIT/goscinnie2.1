"use client";

import type { ScreenId } from "./types";

interface FooterProps {
  navigate: (screen: ScreenId) => void;
  dark?: boolean;
}

export function Footer({ navigate, dark = false }: FooterProps) {
  if (dark) {
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
            <button
              type="button"
              onClick={() => navigate("Lokale")}
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Sale weselne
            </button>
            <button
              type="button"
              onClick={() => navigate("Lokale")}
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Lokale na komunię
            </button>
            <button
              type="button"
              onClick={() => navigate("Uslugodawcy")}
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              DJ i zespoły
            </button>
            <button
              type="button"
              onClick={() => navigate("Uslugodawcy")}
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Catering
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[15px] font-bold text-[#FBF7F4]">Dla firm</span>
            <button
              type="button"
              onClick={() => navigate("Cennik")}
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Cennik abonamentu
            </button>
            <button
              type="button"
              onClick={() => navigate("RejestracjaFirmy")}
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Przejmij swój profil
            </button>
            <button
              type="button"
              onClick={() => navigate("Cennik")}
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Promowanie
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[15px] font-bold text-[#FBF7F4]">Serwis</span>
            <button
              type="button"
              onClick={() => navigate("Kontakt")}
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Jak weryfikujemy opinie
            </button>
            <button
              type="button"
              onClick={() => navigate("Kontakt")}
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Regulamin
            </button>
            <button
              type="button"
              onClick={() => navigate("Kontakt")}
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Prywatność
            </button>
            <button
              type="button"
              onClick={() => navigate("Kontakt")}
              className="text-left text-[14px] text-[#D5C7D0] hover:text-white bg-transparent border-0 cursor-pointer p-0"
            >
              Zgłoś treść
            </button>
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
          <button
            type="button"
            onClick={() => navigate("Lokale")}
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Sale i lokale
          </button>
          <button
            type="button"
            onClick={() => navigate("Uslugodawcy")}
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Usługodawcy
          </button>
          <button
            type="button"
            onClick={() => navigate("Imprezy")}
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Imprezy
          </button>
          <button
            type="button"
            onClick={() => navigate("NoweZlecenie")}
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Wystaw zlecenie
          </button>
        </div>

        <div>
          <div className="text-[13px] font-bold tracking-wider uppercase text-[#55485A] mb-4">
            Dla firm
          </div>
          <button
            type="button"
            onClick={() => navigate("Cennik")}
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Cennik abonamentu
          </button>
          <button
            type="button"
            onClick={() => navigate("RejestracjaFirmy")}
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Dodaj swój lokal
          </button>
          <button
            type="button"
            onClick={() => navigate("Zlecenia")}
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Giełda zleceń
          </button>
          <button
            type="button"
            onClick={() => navigate("Logowanie")}
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Zaloguj się
          </button>
        </div>

        <div>
          <div className="text-[13px] font-bold tracking-wider uppercase text-[#55485A] mb-4">
            Popularne
          </div>
          <button
            type="button"
            onClick={() => navigate("Lokale")}
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Sale weselne Wrocław
          </button>
          <button
            type="button"
            onClick={() => navigate("Lokale")}
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Sale na komunię Kraków
          </button>
          <button
            type="button"
            onClick={() => navigate("Uslugodawcy")}
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Fotografowie Poznań
          </button>
          <button
            type="button"
            onClick={() => navigate("Imprezy")}
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Andrzejki Warszawa
          </button>
        </div>

        <div>
          <div className="text-[13px] font-bold tracking-wider uppercase text-[#55485A] mb-4">
            Serwis
          </div>
          <button
            type="button"
            onClick={() => navigate("Kontakt")}
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Kontakt
          </button>
          <button
            type="button"
            onClick={() => navigate("Kontakt")}
            className="block text-left text-[14px] text-[#3E3344] hover:text-[#241C2B] mb-2.5 bg-transparent border-0 cursor-pointer p-0"
          >
            Zgłoś treść
          </button>
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

import Link from "next/link";

export function WpisBezProfiluScreen() {
  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <main className="grow px-6 sm:px-12 md:px-[130px] pt-10 pb-16">
        {/* Breadcrumb */}
        <p className="m-0 mb-5 text-[14px] text-[#6A5C70]">
          <Link
            href="/lokale"
            className="text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
          >
            Lokale
          </Link>{" "}
          &nbsp;›&nbsp; Powiat trzebnicki &nbsp;›&nbsp; Stary Spichlerz (Wpis z rejestru)
        </p>

        {/* Notice Banner */}
        <div className="border border-[#E2D5CA] bg-[#F2E9E2] rounded-[16px] p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#5E7360] text-white flex items-center justify-center font-bold text-[14px] shrink-0">
              i
            </span>
            <div>
              <div className="text-[15px] font-bold text-[#241C2B]">
                Wpis nieprzejęty (import z rejestru publicznego)
              </div>
              <div className="text-[13px] text-[#6A5C70]">
                Profil nie posiada opublikowanego cennika ani kontaktu od właściciela.
              </div>
            </div>
          </div>
          <Link
            href="/rejestracja-firmy"
            className="text-[14px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[10px] px-5 py-2.5 cursor-pointer shrink-0 shadow-xs"
          >
            Przejmij profil za 0 zł (30 dni próby)
          </Link>
        </div>

        {/* Basic Header */}
        <div className="border border-[#E2D5CA] rounded-[20px] bg-white p-7 sm:p-10 mb-8 shadow-xs">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[#EFE5DD]">
            <div>
              <span className="inline-block text-[12px] font-semibold text-[#5E7360] bg-[#E7EDE7] px-3 py-1 rounded-full mb-2">
                Sale weselne i okolicznościowe
              </span>
              <h1 className="m-0 font-fraunces font-normal text-[36px] sm:text-[44px] tracking-tight">
                Stary Spichlerz
              </h1>
              <p className="m-0 mt-2 text-[16px] text-[#6A5C70]">
                Trzebnica · ul. Polna 12, 55-100 Trzebnica (powiat trzebnicki, 24 km od Wrocławia)
              </p>
            </div>

            <div className="border border-[#E2D5CA] bg-[#FBF7F4] rounded-[14px] p-4 text-center min-w-[200px]">
              <div className="text-[12px] text-[#6A5C70] mb-1">Status profilu</div>
              <div className="text-[15px] font-bold text-[#241C2B]">Oczekuje na weryfikację</div>
              <div className="text-[11px] text-[#8B7F91] mt-1">
                Zgodnie z zasadą pełnego katalogu
              </div>
            </div>
          </div>

          <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-fraunces text-[22px] font-medium mb-3">
                Informacja dla klientów i organizatorów
              </h2>
              <p className="text-[15px] text-[#3E3344] leading-[1.6] mb-4">
                Właściciel tego obiektu nie uruchomił jeszcze formularza bezpośrednich zapytań ani
                nie uzupełnił kalendarza wolnych terminów na rok 2027.
              </p>
              <p className="text-[15px] text-[#3E3344] leading-[1.6] mb-6">
                Nie musisz dzwonić w ciemno. Wystaw <strong>anonimowe zlecenie</strong> na swoją
                uroczystość — sprawdzimy lokale w powiecie trzebnickim i otrzymasz gotowe oferty z
                cenami wprost do porównania.
              </p>
              <Link
                href="/dodaj-zlecenie"
                className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-7 py-3.5 cursor-pointer shadow-xs"
              >
                Dodaj bezpłatne zlecenie
              </Link>
            </div>

            <div className="border border-[#D9CCC2] rounded-[16px] bg-[#FAF6F2] p-6">
              <h3 className="font-fraunces text-[20px] font-medium mb-2.5">
                Zarządzasz tym miejscem?
              </h3>
              <p className="text-[14px] text-[#55485A] leading-[1.6] mb-4">
                Przejmij profil obiektu <strong>Stary Spichlerz</strong>. Otrzymasz:
              </p>
              <ul className="text-[14px] text-[#3E3344] space-y-2 mb-6 pl-4">
                <li>✓ Pełną wizytówkę z 30 zdjęciami, cennikiem i kalendarzem</li>
                <li>✓ Dostęp do zleceń od klientów szukających sali w Twoim powiecie</li>
                <li>✓ Formularz bezpośrednich zapytań bez prowizji od umów</li>
                <li>
                  ✓ <strong>30 dni bezpłatnego testu</strong> bez konieczności podawania karty
                </li>
              </ul>
              <Link
                href="/rejestracja-firmy"
                className="w-full text-center text-[15px] font-bold text-[#241C2B] bg-white border-2 border-[#241C2B] hover:bg-[#241C2B] hover:text-white transition-colors rounded-[12px] py-3 cursor-pointer"
              >
                Przejmij ten profil (krok 1 z 4)
              </Link>
            </div>
          </div>
        </div>

        {/* Comparison: Full Profile vs Imported Profile */}
        <div className="border border-[#E2D5CA] rounded-[18px] bg-white p-7">
          <h3 className="font-fraunces text-[22px] font-medium mb-2">
            Jak wygląda pełny profil po przejęciu?
          </h3>
          <p className="text-[15px] text-[#6A5C70] mb-5">
            Zobacz różnicę pomiędzy wpisem nieprzejętym a zweryfikowanym profilem lokalu w naszym
            katalogu.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/f/dwor-pod-lipami"
              className="text-[14px] font-semibold text-[#241C2B] bg-[#F2E9E2] hover:bg-[#EADFD6] transition-colors border-0 rounded-[10px] px-5 py-2.5 cursor-pointer"
            >
              Zobacz przykładowy profil: Dwór pod Lipami →
            </Link>
            <Link
              href="/cennik"
              className="text-[14px] font-semibold text-[#6A5C70] hover:text-[#241C2B] bg-transparent border border-[#D9CCC2] rounded-[10px] px-5 py-2.5 cursor-pointer"
            >
              Sprawdź cennik abonamentów dla sal
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

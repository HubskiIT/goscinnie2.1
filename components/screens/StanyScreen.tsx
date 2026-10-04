"use client";

import { Footer } from "../Footer";
import { Header } from "../Header";
import type { ScreenProps } from "../types";

export function StanyScreen({ navigate }: ScreenProps) {
  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <Header currentScreen="Stany" navigate={navigate} />

      <section className="grow px-6 sm:px-12 md:px-[130px] pt-12 pb-16">
        <h1 className="m-0 mb-3 font-fraunces font-normal text-[36px] sm:text-[44px] tracking-tight">
          Strony stanu
        </h1>
        <p className="m-0 mb-8.5 text-[17px] leading-[1.6] text-[#3E3344] max-w-[76ch]">
          Sześć sytuacji, w których coś poszło nie tak albo się skończyło. Dwie z nich, 402 i 429,
          nie są błędami, tylko najważniejszymi miejscami sprzedaży w serwisie, dlatego wyglądają
          jak oferta, a nie jak awaria.
        </p>

        {/* 6 States Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 404 */}
          <div className="border border-[#E2D5CA] rounded-[18px] bg-white p-7 flex flex-col shadow-sm">
            <div className="text-[12px] font-bold tracking-wider uppercase text-[#55485A] mb-3.5">
              404
            </div>
            <div className="font-fraunces font-medium text-[24px] mb-2.5">Tej strony nie ma</div>
            <p className="m-0 mb-5.5 text-[15px] leading-[1.7] text-[#3E3344] grow">
              Mogła zostać usunięta albo adres jest przekręcony. Poniżej najczęściej szukane
              kategorie, żeby nie trzeba było zaczynać od strony głównej.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("Lokale")}
                className="text-[15px] font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] rounded-[10px] px-5.5 py-3 cursor-pointer hover:bg-[#241C2B] hover:text-white transition-colors"
              >
                Wróć do katalogu
              </button>
              <button
                type="button"
                onClick={() => navigate("Kontakt")}
                className="text-[15px] text-[#3E3344] hover:text-[#241C2B] bg-transparent border-0 border-b border-[#D9CCC2] pb-0.5 cursor-pointer"
              >
                Zgłoś zepsuty odnośnik
              </button>
            </div>
          </div>

          {/* 402 */}
          <div className="border border-[#E2D5CA] rounded-[18px] bg-white p-7 flex flex-col shadow-sm">
            <div className="text-[12px] font-bold tracking-wider uppercase text-[#55485A] mb-3.5">
              402
            </div>
            <div className="font-fraunces font-medium text-[24px] mb-2.5">
              To zlecenie jest w abonamencie
            </div>
            <p className="m-0 mb-5.5 text-[15px] leading-[1.7] text-[#3E3344] grow">
              Widzisz okazję, datę, liczbę gości i powiat. Pełny opis, budżet i prawo złożenia
              oferty wchodzą z planem. Klient nie płaci w tym serwisie nigdy.
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("Cennik")}
                className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[10px] px-5.5 py-3 cursor-pointer shadow-xs"
              >
                Zobacz plany
              </button>
            </div>
          </div>

          {/* 429 */}
          <div className="border border-[#E2D5CA] rounded-[18px] bg-white p-7 flex flex-col shadow-sm">
            <div className="text-[12px] font-bold tracking-wider uppercase text-[#55485A] mb-3.5">
              429
            </div>
            <div className="font-fraunces font-medium text-[24px] mb-2.5">
              Wykorzystałeś 15 ofert w tym miesiącu
            </div>
            <p className="m-0 mb-5.5 text-[15px] leading-[1.7] text-[#3E3344] grow">
              Konto działa dalej, limit odnowi się 1 listopada. Jeśli nie chcesz czekać, plan Pełny
              nie ma limitu i dopłacasz tylko różnicę do końca okresu.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("Cennik")}
                className="text-[15px] font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] rounded-[10px] px-5.5 py-3 cursor-pointer hover:bg-[#241C2B] hover:text-white transition-colors"
              >
                Podnieś plan
              </button>
              <button
                type="button"
                onClick={() => navigate("Cennik")}
                className="text-[15px] text-[#3E3344] hover:text-[#241C2B] bg-transparent border-0 border-b border-[#D9CCC2] pb-0.5 cursor-pointer"
              >
                Zobacz limity planów
              </button>
            </div>
          </div>

          {/* Closed Order */}
          <div className="border border-[#E2D5CA] rounded-[18px] bg-white p-7 flex flex-col shadow-sm">
            <div className="text-[12px] font-bold tracking-wider uppercase text-[#55485A] mb-3.5">
              Zlecenie zamknięte
            </div>
            <div className="font-fraunces font-medium text-[24px] mb-2.5">
              Klient zakończył zbieranie ofert
            </div>
            <p className="m-0 mb-5.5 text-[15px] leading-[1.7] text-[#3E3344] grow">
              Zlecenie zostało zamknięte 19 kwietnia i nie przyjmuje już odpowiedzi. Twoja oferta,
              jeśli była złożona, pozostaje w historii.
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("Zlecenia")}
                className="text-[15px] font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] rounded-[10px] px-5.5 py-3 cursor-pointer hover:bg-[#241C2B] hover:text-white transition-colors"
              >
                Pokaż otwarte zlecenia
              </button>
            </div>
          </div>

          {/* Suspended Profile */}
          <div className="border border-[#E2D5CA] rounded-[18px] bg-white p-7 flex flex-col shadow-sm">
            <div className="text-[12px] font-bold tracking-wider uppercase text-[#55485A] mb-3.5">
              Profil zawieszony
            </div>
            <div className="font-fraunces font-medium text-[24px] mb-2.5">
              Ten profil jest chwilowo niewidoczny
            </div>
            <p className="m-0 mb-5.5 text-[15px] leading-[1.7] text-[#3E3344] grow">
              Właściciel wstrzymał wyświetlanie albo trwa weryfikacja zgłoszenia. Dane nie zostały
              usunięte i wrócą razem z profilem.
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("Lokale")}
                className="text-[15px] font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] rounded-[10px] px-5.5 py-3 cursor-pointer hover:bg-[#241C2B] hover:text-white transition-colors"
              >
                Zobacz podobne miejsca
              </button>
            </div>
          </div>

          {/* Server 500 error */}
          <div className="border border-[#E2D5CA] rounded-[18px] bg-white p-7 flex flex-col shadow-sm">
            <div className="text-[12px] font-bold tracking-wider uppercase text-[#55485A] mb-3.5">
              Błąd po naszej stronie
            </div>
            <div className="font-fraunces font-medium text-[24px] mb-2.5">
              Nie udało się wczytać listy
            </div>
            <p className="m-0 mb-5.5 text-[15px] leading-[1.7] text-[#3E3344] grow">
              Baza nie odpowiedziała. To nie jest wina Twojego połączenia. Spróbuj za chwilę, a
              jeśli się powtarza, daj znać, bo my tego możemy nie zauważyć.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => alert("Odświeżanie połączenia z bazą...")}
                className="text-[15px] font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] rounded-[10px] px-5.5 py-3 cursor-pointer hover:bg-[#241C2B] hover:text-white transition-colors"
              >
                Spróbuj ponownie
              </button>
              <button
                type="button"
                onClick={() => navigate("Kontakt")}
                className="text-[15px] text-[#3E3344] hover:text-[#241C2B] bg-transparent border-0 border-b border-[#D9CCC2] pb-0.5 cursor-pointer"
              >
                Napisz do nas
              </button>
            </div>
          </div>
        </div>

        {/* Empty list state */}
        <div className="mt-6.5 border border-[#E2D5CA] rounded-[18px] bg-[#F2E9E2] p-6.5 sm:p-7.5 flex flex-col md:flex-row gap-8 sm:gap-10 items-center">
          <div className="grow">
            <div className="text-[16px] font-bold mb-2">Pusta lista, czyli stan bez błędu</div>
            <p className="m-0 text-[15px] leading-[1.7] text-[#3E3344]">
              Zero wyników to nie awaria i nie może wyglądać jak awaria. Ekran mówi, który filtr
              najbardziej zawęża, i proponuje jedną zmianę, na przykład poszerzenie promienia z 25
              do 50 km, z liczbą obiektów, które wtedy dojdą.
            </p>
          </div>
          <div className="w-full sm:w-[340px] shrink-0 border border-dashed border-[#D9CCC2] rounded-[14px] bg-[#FBF7F4] p-5.5 text-center">
            <div className="text-[15px] font-semibold mb-2">Brak obiektów dla tych filtrów</div>
            <div className="text-[14px] text-[#6A5C70] mb-4">
              Promień 25 km jest tu najwęższy. Po poszerzeniu do 50 km dojdzie 23 obiekty.
            </div>
            <button
              type="button"
              onClick={() => navigate("Lokale")}
              className="text-[15px] font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] rounded-[10px] px-5 py-3 cursor-pointer hover:bg-[#241C2B] hover:text-white transition-colors"
            >
              Poszerz do 50 km
            </button>
          </div>
        </div>
      </section>

      <Footer navigate={navigate} />
    </div>
  );
}

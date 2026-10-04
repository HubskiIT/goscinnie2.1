"use client";

import { useState } from "react";
import { Footer } from "../Footer";
import { Header } from "../Header";
import type { ScreenProps } from "../types";

export function NoweZlecenieScreen({ navigate }: ScreenProps) {
  const [currentStep, setCurrentStep] = useState(2);
  const [date, setDate] = useState("12.06.2027");
  const [guests, setGuests] = useState("80");
  const [city, setCity] = useState("Wrocław");
  const [radius, setRadius] = useState("do 25 km");
  const [budget, setBudget] = useState("18 000 zł");
  const [description, setDescription] = useState(
    "Szukamy sali na komunię córki. Osiemdziesięciu gości, w tym dwadzieścioro dzieci, więc przydałby się kąt do zabawy albo ogród. Zależy nam na sali na wyłączność i na własnym torcie bez opłaty.",
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(["Sala na wyłączność", "Ogród"]);

  const tags = ["Sala na wyłączność", "Ogród", "Nocleg", "Parking", "Dostęp dla wózka"];

  const toggleTag = (t: string) => {
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t],
    );
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <Header currentScreen="NoweZlecenie" navigate={navigate} />

      <section className="grow px-6 sm:px-12 md:px-[130px] pt-12 flex flex-col lg:flex-row gap-11 items-start pb-16">
        <div className="grow w-full">
          <h1 className="m-0 mb-2.5 font-fraunces font-normal text-[36px] sm:text-[44px] tracking-tight">
            Opisz raz, odpowiedzą sami
          </h1>
          <p className="m-0 mb-8 text-[17px] leading-[1.6] text-[#3E3344] max-w-[64ch]">
            Cztery kroki, około dwóch minut. Wystawienie zlecenia jest bezpłatne i nie zobowiązuje
            do niczego. Nie podajesz numeru telefonu.
          </p>

          {/* Stepper */}
          <div className="flex items-center gap-3.5 mb-10 overflow-x-auto pb-2">
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-3 cursor-pointer bg-transparent border-0 p-0 shrink-0"
            >
              <span className="w-[30px] h-[30px] rounded-full bg-[#5E7360] text-[#FBF7F4] text-[14px] font-bold flex items-center justify-center">
                ✓
              </span>
              <span className="text-[15px] font-semibold text-[#3E3344]">Okazja</span>
            </button>
            <span className="grow h-[1px] bg-[#E2D5CA] min-w-8" />

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-3 cursor-pointer bg-transparent border-0 p-0 shrink-0"
            >
              <span
                className={`w-[30px] h-[30px] rounded-full text-[14px] font-bold flex items-center justify-center ${
                  currentStep === 2
                    ? "bg-[#241C2B] text-[#FBF7F4]"
                    : currentStep > 2
                      ? "bg-[#5E7360] text-[#FBF7F4]"
                      : "border-[1.5px] border-[#D9CCC2] text-[#8B7F91]"
                }`}
              >
                2
              </span>
              <span
                className={`text-[15px] font-semibold ${
                  currentStep === 2 ? "text-[#241C2B]" : "text-[#8B7F91]"
                }`}
              >
                Szczegóły
              </span>
            </button>
            <span className="grow h-[1px] bg-[#E2D5CA] min-w-8" />

            {/* Step 3 */}
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-3 cursor-pointer bg-transparent border-0 p-0 shrink-0"
            >
              <span
                className={`w-[30px] h-[30px] rounded-full text-[14px] font-bold flex items-center justify-center ${
                  currentStep === 3
                    ? "bg-[#241C2B] text-[#FBF7F4]"
                    : currentStep > 3
                      ? "bg-[#5E7360] text-[#FBF7F4]"
                      : "border-[1.5px] border-[#D9CCC2] text-[#8B7F91]"
                }`}
              >
                3
              </span>
              <span
                className={`text-[15px] font-semibold ${
                  currentStep === 3 ? "text-[#241C2B]" : "text-[#8B7F91]"
                }`}
              >
                Budżet
              </span>
            </button>
            <span className="grow h-[1px] bg-[#E2D5CA] min-w-8" />

            {/* Step 4 */}
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="flex items-center gap-3 cursor-pointer bg-transparent border-0 p-0 shrink-0"
            >
              <span
                className={`w-[30px] h-[30px] rounded-full text-[14px] font-bold flex items-center justify-center ${
                  currentStep === 4
                    ? "bg-[#241C2B] text-[#FBF7F4]"
                    : "border-[1.5px] border-[#D9CCC2] text-[#8B7F91]"
                }`}
              >
                4
              </span>
              <span
                className={`text-[15px] font-semibold ${
                  currentStep === 4 ? "text-[#241C2B]" : "text-[#8B7F91]"
                }`}
              >
                Kontakt
              </span>
            </button>
          </div>

          {/* Form Card */}
          <div className="border border-[#D9CCC2] rounded-[20px] bg-white p-7 sm:p-9 shadow-sm">
            {currentStep === 1 && (
              <div>
                <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">Wybierz okazję</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {["Komunia", "Wesele", "Chrzciny", "Urodziny", "Event firmowy", "Stypa"].map(
                    (o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="border border-[#D9CCC2] hover:border-[#241C2B] rounded-xl p-4 text-left font-semibold text-[16px] bg-[#FBF7F4] hover:bg-white cursor-pointer"
                      >
                        {o}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <>
                <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">
                  Szczegóły wydarzenia
                </h2>

                <div className="flex flex-col sm:flex-row gap-4 mb-5">
                  <div className="grow flex flex-col gap-2">
                    <label htmlFor="z-data" className="text-[14px] font-semibold text-[#3E3344]">
                      Data wydarzenia
                    </label>
                    <input
                      id="z-data"
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
                    />
                    <span className="text-[13px] text-[#6A5C70]">
                      Nie znasz jeszcze daty? Wpisz miesiąc.
                    </span>
                  </div>
                  <div className="w-full sm:w-[220px] flex flex-col gap-2">
                    <label htmlFor="z-osoby" className="text-[14px] font-semibold text-[#3E3344]">
                      Liczba osób
                    </label>
                    <input
                      id="z-osoby"
                      type="text"
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
                    />
                    <span className="text-[13px] text-[#6A5C70]">Może być przybliżona.</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-5">
                  <div className="grow flex flex-col gap-2">
                    <label htmlFor="z-miasto" className="text-[14px] font-semibold text-[#3E3344]">
                      Miejscowość
                    </label>
                    <input
                      id="z-miasto"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
                    />
                  </div>
                  <div className="w-full sm:w-[260px] flex flex-col gap-2">
                    <label htmlFor="z-promien" className="text-[14px] font-semibold text-[#3E3344]">
                      Jak daleko możesz dojechać
                    </label>
                    <input
                      id="z-promien"
                      type="text"
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                      className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 mb-5">
                  <label htmlFor="z-opis" className="text-[14px] font-semibold text-[#3E3344]">
                    Czego szukasz, własnymi słowami
                  </label>
                  <textarea
                    id="z-opis"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="text-[16px] leading-[1.7] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-4 w-full box-border"
                  />
                  <div className="flex justify-between text-[13px] text-[#6A5C70]">
                    <span>Im konkretniej, tym trafniejsze oferty.</span>
                    <span>{description.length} z 2000 znaków</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 mb-7">
                  <span className="text-[14px] font-semibold text-[#3E3344]">
                    Czego potrzebujesz
                  </span>
                  <div className="flex gap-2.5 flex-wrap">
                    {tags.map((t) => {
                      const isSelected = selectedTags.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTag(t)}
                          className={`text-[14px] rounded-full px-4 py-2 cursor-pointer transition-colors ${
                            isSelected
                              ? "font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] shadow-sm"
                              : "text-[#3E3344] bg-white border border-[#D9CCC2] hover:border-[#241C2B]"
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <div className="mb-6">
                <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">Szacowany budżet</h2>
                <div className="flex flex-col gap-2 mb-4">
                  <label htmlFor="z-budzet" className="text-[14px] font-semibold text-[#3E3344]">
                    Maksymalny budżet całkowity (lub za osobę)
                  </label>
                  <input
                    id="z-budzet"
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 max-w-sm"
                  />
                  <span className="text-[13px] text-[#6A5C70]">
                    Podanie budżetu pomaga salom zaproponować właściwe menu.
                  </span>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="mb-6">
                <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">Dane kontaktowe</h2>
                <p className="text-[15px] text-[#55485A] mb-4">
                  Twój adres e-mail służy do powiadomień o nowych ofertach. Firmy nie zobaczą go,
                  dopóki sam ich nie dodasz do krótkiej listy.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="nowezleceniescreen-imie"
                      className="text-[14px] font-semibold text-[#3E3344]"
                    >
                      Imię
                    </label>
                    <input
                      id="nowezleceniescreen-imie"
                      type="text"
                      defaultValue="Anna"
                      className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="nowezleceniescreen-adres-e-mail"
                      className="text-[14px] font-semibold text-[#3E3344]"
                    >
                      Adres e-mail
                    </label>
                    <input
                      id="nowezleceniescreen-adres-e-mail"
                      type="email"
                      defaultValue="anna.kowalska@example.com"
                      className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-[#EFE5DD]">
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-8 py-4 cursor-pointer shadow-sm"
                >
                  {currentStep === 1
                    ? "Dalej, szczegóły"
                    : currentStep === 2
                      ? "Dalej, budżet"
                      : "Dalej, kontakt"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("PanelKlienta")}
                  className="text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-8 py-4 cursor-pointer shadow-sm"
                >
                  Opublikuj zlecenie
                </button>
              )}

              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="text-[15px] text-[#3E3344] hover:text-[#241C2B] bg-transparent border-0 border-b border-[#D9CCC2] pb-0.5 cursor-pointer"
                >
                  Wróć
                </button>
              )}

              <span className="ml-auto text-[13px] text-[#6A5C70] hidden sm:inline">
                Zapisujemy po każdym kroku. Możesz wrócić później.
              </span>
            </div>
          </div>
        </div>

        {/* Aside: Live preview */}
        <aside className="w-full lg:w-[400px] shrink-0 flex flex-col gap-4">
          <div className="border border-[#D9CCC2] rounded-[20px] bg-white overflow-hidden shadow-sm">
            <div className="p-4 px-5 bg-[#F2E9E2] border-b border-[#E2D5CA] text-[14px] font-bold">
              Tak zobaczy to firma
            </div>
            <div className="p-5 sm:p-6">
              <div className="font-fraunces font-medium text-[20px] mb-3.5">
                Komunia, {guests} osób, powiat wrocławski
              </div>
              <div className="grid grid-cols-2 gap-3.5 py-4 border-y border-[#EFE5DD] mb-4">
                <div>
                  <div className="text-[12px] text-[#6A5C70]">Data</div>
                  <div className="text-[14px] font-semibold">{date}</div>
                </div>
                <div>
                  <div className="text-[12px] text-[#6A5C70]">Osób</div>
                  <div className="text-[14px] font-semibold">{guests}</div>
                </div>
                <div>
                  <div className="text-[12px] text-[#6A5C70]">Lokalizacja</div>
                  <div className="text-[14px] font-semibold">powiat, nie adres</div>
                </div>
                <div>
                  <div className="text-[12px] text-[#6A5C70]">Imię i telefon</div>
                  <div className="text-[14px] font-semibold text-[#8B7F91]">ukryte</div>
                </div>
              </div>
              <p className="m-0 text-[14px] leading-[1.65] text-[#55485A]">
                Firma pozna Twoje imię, adres e-mail i numer dopiero wtedy, gdy sam dodasz jej
                ofertę do krótkiej listy. Do tego czasu rozmawiacie przez serwis, a filtr zasłania
                numery i adresy po obu stronach.
              </p>
            </div>
          </div>

          <div className="border border-[#E2D5CA] rounded-[20px] bg-[#F2E9E2] p-6">
            <div className="text-[16px] font-bold mb-2.5">Ile to kosztuje</div>
            <p className="m-0 text-[14px] leading-[1.7] text-[#55485A]">
              Nic. Klient nie płaci w tym serwisie nigdy, ani za wystawienie zlecenia, ani za
              kontakt, ani prowizji od umów. Płacą firmy, abonamentem.
            </p>
          </div>
        </aside>
      </section>

      <Footer navigate={navigate} />
    </div>
  );
}

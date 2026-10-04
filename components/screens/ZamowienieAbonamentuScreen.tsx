"use client";

import Link from "next/link";
import type React from "react";
import { useState } from "react";

export function ZamowienieAbonamentuScreen() {
  const [selectedClass, setSelectedClass] = useState<"A" | "B" | "C">("A");
  const [selectedPlan, setSelectedPlan] = useState<"start" | "pelny" | "wyrozniony">("pelny");
  const [period, setPeriod] = useState<"miesiac" | "pol_roku" | "rok">("rok");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "blik" | "p24">("card");
  const [agreed, setAgreed] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTrialSuccess, setIsTrialSuccess] = useState(false);

  // Prices from Oct 3, 2026 spec
  const priceTable = {
    A: {
      name: "Klasa A (Sale weselne, hotele, catering)",
      start: { miesiac: 189, pol_roku: 890, rok: 1490 },
      pelny: { miesiac: 379, pol_roku: 1790, rok: 2990 },
      wyrozniony: { miesiac: 739, pol_roku: 3540, rok: 5900 },
    },
    B: {
      name: "Klasa B (Restauracje, foto, wideo, zespół)",
      start: { miesiac: 89, pol_roku: 410, rok: 690 },
      pelny: { miesiac: 179, pol_roku: 830, rok: 1390 },
      wyrozniony: { miesiac: 349, pol_roku: 1670, rok: 2790 },
    },
    C: {
      name: "Klasa C (DJ, barman, animator, transport)",
      start: { miesiac: 49, pol_roku: 230, rok: 390 },
      pelny: { miesiac: 99, pol_roku: 470, rok: 790 },
      wyrozniony: { miesiac: 189, pol_roku: 890, rok: 1490 },
    },
  };

  const netPrice = priceTable[selectedClass][selectedPlan][period];
  const vat = Math.round(netPrice * 0.23);
  const grossPrice = netPrice + vat;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    setIsSuccess(true);
  };

  const handleStartTrial = () => {
    setIsTrialSuccess(true);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <main className="grow px-6 sm:px-12 md:px-[130px] pt-10 pb-16">
        <p className="m-0 mb-4 text-[14px] text-[#6A5C70]">
          <Link
            href="/cennik"
            className="text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
          >
            Cennik dla firm
          </Link>{" "}
          &nbsp;›&nbsp; Zamówienie abonamentu
        </p>

        {isSuccess ? (
          <div className="border border-[#E2D5CA] rounded-[20px] bg-white p-8 sm:p-12 max-w-[720px] mx-auto text-center shadow-sm my-8">
            <span className="w-16 h-16 rounded-full bg-[#E7EDE7] text-[#5E7360] text-3xl font-bold flex items-center justify-center mx-auto mb-4">
              ✓
            </span>
            <h1 className="font-fraunces text-[32px] sm:text-[38px] font-normal mb-3">
              Zamówienie zostało opłacone!
            </h1>
            <p className="text-[16px] text-[#3E3344] leading-[1.6] mb-6">
              Abonament planu <strong>{selectedPlan.toUpperCase()}</strong> dla obiektu{" "}
              <strong>Dwór pod Lipami</strong> został aktywowany. Faktura VAT{" "}
              <strong>GOS/2026/0412</strong> została wysłana na adres księgowy oraz do systemu KSeF.
            </p>
            <div className="border border-[#E2D5CA] rounded-[14px] bg-[#FAF6F2] p-4 text-left mb-7 text-[14px] space-y-1.5">
              <div>
                <strong>Status profilu:</strong> Aktywny w katalogu (pełna widoczność)
              </div>
              <div>
                <strong>Okres ważności:</strong> do{" "}
                {period === "rok"
                  ? "03.10.2027"
                  : period === "pol_roku"
                    ? "03.04.2027"
                    : "03.11.2026"}
              </div>
              <div>
                <strong>Kwota brutto:</strong> {grossPrice.toLocaleString("pl-PL")} zł (w tym 23%
                VAT)
              </div>
            </div>
            <Link
              href="/panel"
              className="text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-8 py-3.5 cursor-pointer shadow-xs"
            >
              Przejdź do panelu firmy →
            </Link>
          </div>
        ) : isTrialSuccess ? (
          <div className="border border-[#E2D5CA] rounded-[20px] bg-white p-8 sm:p-12 max-w-[720px] mx-auto text-center shadow-sm my-8">
            <span className="w-16 h-16 rounded-full bg-[#E7EDE7] text-[#5E7360] text-3xl font-bold flex items-center justify-center mx-auto mb-4">
              ★
            </span>
            <h1 className="font-fraunces text-[32px] sm:text-[38px] font-normal mb-3">
              Rozpoczęto 30 dni próby bez opłat
            </h1>
            <p className="text-[16px] text-[#3E3344] leading-[1.6] mb-6">
              Twój profil jest już publiczny w katalogu i przyjmuje zapytania. Nie pobraliśmy
              żadnych opłat, ani nie wymagaliśmy podania danych karty.
            </p>
            <Link
              href="/panel"
              className="text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-8 py-3.5 cursor-pointer shadow-xs"
            >
              Zarządzaj profilem w panelu →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Left Column: Form */}
            <div className="grow w-full">
              <h1 className="m-0 mb-2 font-fraunces font-normal text-[36px] sm:text-[44px] tracking-tight">
                Aktywuj abonament w Gościnnie
              </h1>
              <p className="m-0 mb-8 text-[16px] leading-[1.6] text-[#3E3344] max-w-[65ch]">
                Wybierz klasę, plan i okres rozliczenia. Publikacja następuje natychmiast po
                zatwierdzeniu.
              </p>

              {/* 30-Day Free Trial Callout */}
              <div className="border border-[#E2D5CA] bg-[#F2E9E2] rounded-[16px] p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[15px] font-bold text-[#241C2B]">
                    Chcesz najpierw sprawdzić efekty?
                  </div>
                  <div className="text-[13px] text-[#6A5C70]">
                    Możesz rozpocząć od 30 dni bezpłatnej próby bez podawania karty.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStartTrial}
                  className="text-[14px] font-bold text-[#241C2B] bg-white border border-[#241C2B] hover:bg-[#241C2B] hover:text-white transition-colors rounded-[10px] px-5 py-2.5 cursor-pointer shrink-0"
                >
                  Aktywuj 30 dni próby (0 zł)
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Class & Plan Selection */}
                <div className="border border-[#E2D5CA] rounded-[20px] bg-white p-7 shadow-xs">
                  <h2 className="font-fraunces text-[22px] font-medium mb-4">
                    1. Branża i poziom planu
                  </h2>

                  <div className="mb-5">
                    <span
                      id="zamowienieabonamentuscreen-klasa-kategorii"
                      className="block text-[13px] font-bold text-[#6A5C70] uppercase tracking-wider mb-2"
                    >
                      Klasa kategorii
                    </span>
                    <fieldset
                      aria-labelledby="zamowienieabonamentuscreen-klasa-kategorii"
                      className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
                    >
                      {(["A", "B", "C"] as const).map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setSelectedClass(c)}
                          className={`text-left p-3.5 rounded-[12px] border cursor-pointer transition-all ${
                            selectedClass === c
                              ? "border-2 border-[#241C2B] bg-[#FBF7F4]"
                              : "border-[#E2D5CA] bg-white hover:border-[#241C2B]"
                          }`}
                        >
                          <div className="font-bold text-[14px]">Klasa {c}</div>
                          <div className="text-[12px] text-[#6A5C70]">
                            {c === "A"
                              ? "Sale i obiekty"
                              : c === "B"
                                ? "Foto, wideo, zespół"
                                : "DJ, barman, atrakcje"}
                          </div>
                        </button>
                      ))}
                    </fieldset>
                  </div>

                  <div>
                    <span
                      id="zamowienieabonamentuscreen-plan-abonamentu"
                      className="block text-[13px] font-bold text-[#6A5C70] uppercase tracking-wider mb-2"
                    >
                      Plan abonamentu
                    </span>
                    <fieldset
                      aria-labelledby="zamowienieabonamentuscreen-plan-abonamentu"
                      className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
                    >
                      {(["start", "pelny", "wyrozniony"] as const).map((p) => (
                        <button
                          type="button"
                          key={p}
                          onClick={() => setSelectedPlan(p)}
                          className={`text-left p-3.5 rounded-[12px] border cursor-pointer transition-all ${
                            selectedPlan === p
                              ? "border-2 border-[#241C2B] bg-[#FBF7F4]"
                              : "border-[#E2D5CA] bg-white hover:border-[#241C2B]"
                          }`}
                        >
                          <div className="font-bold text-[15px] capitalize">{p}</div>
                          <div className="text-[12px] text-[#6A5C70]">
                            {p === "start"
                              ? "Podstawowy"
                              : p === "pelny"
                                ? "Najpopularniejszy"
                                : "Lider w powiecie"}
                          </div>
                        </button>
                      ))}
                    </fieldset>
                  </div>
                </div>

                {/* 2. Billing Period Selection */}
                <div className="border border-[#E2D5CA] rounded-[20px] bg-white p-7 shadow-xs">
                  <h2 className="font-fraunces text-[22px] font-medium mb-4">
                    2. Okres rozliczenia
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPeriod("miesiac")}
                      className={`text-left p-4 rounded-[14px] border cursor-pointer transition-all ${
                        period === "miesiac"
                          ? "border-2 border-[#241C2B] bg-[#FAF6F2]"
                          : "border-[#E2D5CA] bg-white hover:border-[#241C2B]"
                      }`}
                    >
                      <div className="font-bold text-[16px] mb-1">Miesiąc</div>
                      <div className="text-[20px] font-bold text-[#241C2B]">
                        {priceTable[selectedClass][selectedPlan].miesiac} zł
                      </div>
                      <div className="text-[12px] text-[#6A5C70] mt-1">odnawiany z karty</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPeriod("pol_roku")}
                      className={`text-left p-4 rounded-[14px] border cursor-pointer transition-all ${
                        period === "pol_roku"
                          ? "border-2 border-[#241C2B] bg-[#FAF6F2]"
                          : "border-[#E2D5CA] bg-white hover:border-[#241C2B]"
                      }`}
                    >
                      <div className="font-bold text-[16px] mb-1">Pół roku</div>
                      <div className="text-[20px] font-bold text-[#241C2B]">
                        {priceTable[selectedClass][selectedPlan].pol_roku} zł
                      </div>
                      <div className="text-[12px] text-[#6A5C70] mt-1">+20% vs baza roczna</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPeriod("rok")}
                      className={`text-left p-4 rounded-[14px] border cursor-pointer transition-all relative ${
                        period === "rok"
                          ? "border-2 border-[#241C2B] bg-[#FAF6F2]"
                          : "border-[#E2D5CA] bg-white hover:border-[#241C2B]"
                      }`}
                    >
                      <span className="absolute -top-2.5 right-3 text-[10px] font-bold uppercase bg-[#5E7360] text-white px-2 py-0.5 rounded-full">
                        Najtaniej
                      </span>
                      <div className="font-bold text-[16px] mb-1">Rok z góry</div>
                      <div className="text-[20px] font-bold text-[#241C2B]">
                        {priceTable[selectedClass][selectedPlan].rok} zł
                      </div>
                      <div className="text-[12px] text-[#5E7360] font-medium mt-1">
                        cena bazowa + gwarancja
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. Company Details */}
                <div className="border border-[#E2D5CA] rounded-[20px] bg-white p-7 shadow-xs">
                  <h2 className="font-fraunces text-[22px] font-medium mb-4">
                    3. Dane firmy do faktury VAT
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[14px]">
                    <div>
                      <label
                        htmlFor="zamowienieabonamentuscreen-nip-firmy"
                        className="block text-[#6A5C70] mb-1.5 font-medium"
                      >
                        NIP firmy
                      </label>
                      <input
                        id="zamowienieabonamentuscreen-nip-firmy"
                        type="text"
                        defaultValue="8971234567"
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] focus:border-[#241C2B] outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="zamowienieabonamentuscreen-nazwa-pelna-podmiotu"
                        className="block text-[#6A5C70] mb-1.5 font-medium"
                      >
                        Nazwa pełna podmiotu
                      </label>
                      <input
                        id="zamowienieabonamentuscreen-nazwa-pelna-podmiotu"
                        type="text"
                        defaultValue="Dwór pod Lipami Sp. z o.o."
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] focus:border-[#241C2B] outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="zamowienieabonamentuscreen-ulica-i-numer"
                        className="block text-[#6A5C70] mb-1.5 font-medium"
                      >
                        Ulica i numer
                      </label>
                      <input
                        id="zamowienieabonamentuscreen-ulica-i-numer"
                        type="text"
                        defaultValue="ul. Pałacowa 4"
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] focus:border-[#241C2B] outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="zamowienieabonamentuscreen-kod-pocztowy-i-miasto"
                        className="block text-[#6A5C70] mb-1.5 font-medium"
                      >
                        Kod pocztowy i miasto
                      </label>
                      <input
                        id="zamowienieabonamentuscreen-kod-pocztowy-i-miasto"
                        type="text"
                        defaultValue="55-040 Kobierzyce"
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] focus:border-[#241C2B] outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="zamowienieabonamentuscreen-e-mail-do-faktury-i-ksef"
                        className="block text-[#6A5C70] mb-1.5 font-medium"
                      >
                        E-mail do faktury (i KSeF)
                      </label>
                      <input
                        id="zamowienieabonamentuscreen-e-mail-do-faktury-i-ksef"
                        type="email"
                        defaultValue="ksiegowosc@dworpodlipami.pl"
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] focus:border-[#241C2B] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Payment Method */}
                <div className="border border-[#E2D5CA] rounded-[20px] bg-white p-7 shadow-xs">
                  <h2 className="font-fraunces text-[22px] font-medium mb-4">
                    4. Metoda płatności
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`p-4 rounded-[12px] border cursor-pointer text-center ${
                        paymentMethod === "card"
                          ? "border-2 border-[#241C2B] bg-[#FAF6F2]"
                          : "border-[#E2D5CA] bg-white"
                      }`}
                    >
                      <div className="font-bold text-[15px]">Karta płatnicza</div>
                      <div className="text-[12px] text-[#6A5C70]">Wygodne odnowienie</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("blik")}
                      className={`p-4 rounded-[12px] border cursor-pointer text-center ${
                        paymentMethod === "blik"
                          ? "border-2 border-[#241C2B] bg-[#FAF6F2]"
                          : "border-[#E2D5CA] bg-white"
                      }`}
                    >
                      <div className="font-bold text-[15px]">BLIK</div>
                      <div className="text-[12px] text-[#6A5C70]">Przez Przelewy24</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("p24")}
                      className={`p-4 rounded-[12px] border cursor-pointer text-center ${
                        paymentMethod === "p24"
                          ? "border-2 border-[#241C2B] bg-[#FAF6F2]"
                          : "border-[#E2D5CA] bg-white"
                      }`}
                    >
                      <div className="font-bold text-[15px]">Szybki przelew</div>
                      <div className="text-[12px] text-[#6A5C70]">Wszystkie polskie banki</div>
                    </button>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer text-[14px] text-[#3E3344]">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      Akceptuję regulamin serwisu Gościnnie, zasady weryfikacji i oświadczam, że
                      zapoznałem się z prawem do 14-dniowego zwrotu oraz gwarancją 90 dni dla planów
                      rocznych.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!agreed}
                  className="w-full text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] disabled:opacity-50 transition-colors border-0 rounded-[12px] p-4 cursor-pointer shadow-sm text-center"
                >
                  Zamawiam i płacę {grossPrice.toLocaleString("pl-PL")} zł brutto
                </button>
              </form>
            </div>

            {/* Right Column: Order Summary Sticky Card */}
            <aside className="w-full lg:w-[380px] shrink-0 sticky top-6">
              <div className="border border-[#E2D5CA] rounded-[20px] bg-white p-7 shadow-xs">
                <h3 className="font-fraunces text-[22px] font-medium mb-4 pb-3 border-b border-[#EFE5DD]">
                  Podsumowanie zamówienia
                </h3>

                <div className="space-y-3 text-[14px] mb-5">
                  <div className="flex justify-between">
                    <span className="text-[#6A5C70]">Obiekt / profil:</span>
                    <strong className="text-[#241C2B]">Dwór pod Lipami</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6A5C70]">Klasa i plan:</span>
                    <strong className="text-[#241C2B]">
                      Klasa {selectedClass} · {selectedPlan.toUpperCase()}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6A5C70]">Okres:</span>
                    <strong className="text-[#241C2B]">
                      {period === "rok"
                        ? "12 miesięcy (Rok)"
                        : period === "pol_roku"
                          ? "6 miesięcy (Pół roku)"
                          : "1 miesiąc"}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6A5C70]">Prowizja od umów:</span>
                    <strong className="text-[#5E7360]">0% zawsze</strong>
                  </div>
                </div>

                <div className="border-t border-[#EFE5DD] pt-4 space-y-2 text-[14px] mb-5">
                  <div className="flex justify-between text-[#6A5C70]">
                    <span>Wartość netto:</span>
                    <span>{netPrice.toLocaleString("pl-PL")} zł</span>
                  </div>
                  <div className="flex justify-between text-[#6A5C70]">
                    <span>VAT 23%:</span>
                    <span>{vat.toLocaleString("pl-PL")} zł</span>
                  </div>
                  <div className="flex justify-between text-[18px] font-bold text-[#241C2B] pt-2 border-t border-[#EFE5DD]">
                    <span>Do zapłaty brutto:</span>
                    <span>{grossPrice.toLocaleString("pl-PL")} zł</span>
                  </div>
                </div>

                <div className="border border-[#E2D5CA] rounded-[12px] bg-[#FAF6F2] p-3.5 text-[12px] text-[#55485A] leading-[1.5]">
                  🔒 Bezpieczna płatność online. Numeracja faktur ciągła (zgodność z KSeF).
                  Bezpłatna pomoc opiekuna przy wdrożeniu.
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

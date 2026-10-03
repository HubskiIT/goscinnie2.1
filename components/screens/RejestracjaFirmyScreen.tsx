'use client';

import React, { useState } from 'react';
import { ScreenProps } from '../types';
import { Header } from '../Header';
import { Footer } from '../Footer';

export function RejestracjaFirmyScreen({ navigate }: ScreenProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Account & Type
  const [accountType, setAccountType] = useState<'lokal' | 'usluga'>('lokal');
  const [category, setCategory] = useState('Sale weselne i obiekty');
  const [email, setEmail] = useState('biuro@dworpodlipami.pl');
  const [password, setPassword] = useState('********');

  // Step 2: Profile Content
  const [displayName, setDisplayName] = useState('Dwór pod Lipami');
  const [town, setTown] = useState('Kobierzyce, k. Wrocławia');
  const [priceFrom, setPriceFrom] = useState('180 zł');
  const [capacity, setCapacity] = useState('do 140 osób');
  const [description, setDescription] = useState(
    'Dwór z 1902 roku z salą balową na 140 osób i parkiem. Obsługujemy wesela, komunie i przyjęcia okolicznościowe.'
  );

  // Step 3: Company verification
  const [nip, setNip] = useState('8971234567');
  const [isNipVerified, setIsNipVerified] = useState(true);
  const [phone, setPhone] = useState('+48 71 390 12 34');
  const [smsCode, setSmsCode] = useState('4829');
  const [isPhoneVerified, setIsPhoneVerified] = useState(true);

  // Step 4: Plan & Period
  const [selectedPlan, setSelectedPlan] = useState<'start' | 'pelny' | 'wyrozniony'>('pelny');
  const [selectedPeriod, setSelectedPeriod] = useState<'miesiac' | 'pol_roku' | 'rok'>('rok');
  const [useTrial, setUseTrial] = useState(false);

  const getStartingPrice = () => {
    if (accountType === 'lokal') return 'od 189 zł / msc (Klasa A)';
    if (category.includes('Foto') || category.includes('Wideo') || category.includes('Zespół')) return 'od 89 zł / msc (Klasa B)';
    return 'od 49 zł / msc (Klasa C)';
  };

  const handleNext = () => {
    if (step < 4) setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    else {
      navigate('PanelFirmy');
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <Header currentScreen="RejestracjaFirmy" navigate={navigate} />

      <main className="grow px-6 sm:px-12 md:px-[130px] pt-10 pb-16">
        {/* Breadcrumb */}
        <p className="m-0 mb-4 text-[14px] text-[#6A5C70]">
          <button
            onClick={() => navigate('Cennik')}
            className="text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
          >
            Dla firm
          </button>{' '}
          &nbsp;›&nbsp; Rejestracja profilu i kreator
        </p>

        {/* Stepper Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="m-0 font-fraunces font-normal text-[34px] sm:text-[42px] tracking-tight">
              Dodaj swoją firmę do katalogu Gościnnie
            </h1>
            <p className="m-0 mt-1 text-[16px] text-[#6A5C70]">
              Budowa profilu jest w 100% bezpłatna. Plan i okres wybierzesz w ostatnim kroku, lub zaczniesz od 30 dni próby.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[14px] font-bold text-[#6A5C70] bg-[#F2E9E2] px-4 py-2 rounded-full border border-[#E2D5CA]">
            Krok {step} z 4: {step === 1 ? 'Konto i rodzaj' : step === 2 ? 'Kreator profilu' : step === 3 ? 'Weryfikacja firmy' : 'Publikacja'}
          </div>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="grid grid-cols-4 gap-2.5 mb-10">
          <div className={`h-2 rounded-full transition-colors ${step >= 1 ? 'bg-[#241C2B]' : 'bg-[#E2D5CA]'}`} />
          <div className={`h-2 rounded-full transition-colors ${step >= 2 ? 'bg-[#241C2B]' : 'bg-[#E2D5CA]'}`} />
          <div className={`h-2 rounded-full transition-colors ${step >= 3 ? 'bg-[#241C2B]' : 'bg-[#E2D5CA]'}`} />
          <div className={`h-2 rounded-full transition-colors ${step >= 4 ? 'bg-[#241C2B]' : 'bg-[#E2D5CA]'}`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Wizard Card */}
          <div className="lg:col-span-8 border border-[#E2D5CA] rounded-[20px] bg-white p-7 sm:p-9 shadow-xs">
            {/* Step 1: Konto i rodzaj */}
            {step === 1 && (
              <div>
                <h2 className="font-fraunces text-[24px] font-medium mb-2">1. Konto i rodzaj działalności</h2>
                <p className="text-[14px] text-[#6A5C70] mb-6">
                  Wybierz, czy prowadzisz lokal stacjonarny, czy jesteś mobilnym usługodawcą dojeżdżającym do klienta.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div
                    onClick={() => setAccountType('lokal')}
                    className={`p-5 rounded-[16px] border-2 cursor-pointer transition-all ${
                      accountType === 'lokal'
                        ? 'border-[#241C2B] bg-[#FAF6F2]'
                        : 'border-[#E2D5CA] bg-white hover:border-[#6A5C70]'
                    }`}
                  >
                    <div className="text-[24px] mb-2">🏛️</div>
                    <div className="font-bold text-[16px] mb-1">Lokal stacjonarny</div>
                    <div className="text-[13px] text-[#6A5C70] leading-[1.4]">
                      Sala weselna, restauracja, dom weselny, hotel, agroturystyka, remiza, plener.
                    </div>
                  </div>

                  <div
                    onClick={() => setAccountType('usluga')}
                    className={`p-5 rounded-[16px] border-2 cursor-pointer transition-all ${
                      accountType === 'usluga'
                        ? 'border-[#241C2B] bg-[#FAF6F2]'
                        : 'border-[#E2D5CA] bg-white hover:border-[#6A5C70]'
                    }`}
                  >
                    <div className="text-[24px] mb-2">🎧</div>
                    <div className="font-bold text-[16px] mb-1">Usługodawca mobilny</div>
                    <div className="text-[13px] text-[#6A5C70] leading-[1.4]">
                      DJ, fotograf, wideo, zespół muzyczny, catering, barman, dekorator, animator.
                    </div>
                  </div>
                </div>

                <div className="border border-[#E2D5CA] bg-[#F2E9E2] rounded-[12px] p-3.5 mb-6 text-[13px] text-[#55485A] flex items-center justify-between">
                  <span>Cena publikacji w wybranej kategorii:</span>
                  <strong className="text-[#241C2B]">{getStartingPrice()}</strong>
                </div>

                <div className="space-y-4 text-[14px]">
                  <div>
                    <label className="block text-[#6A5C70] font-medium mb-1.5">Główna kategoria</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] bg-white outline-none focus:border-[#241C2B]"
                    >
                      <option>Sale weselne i obiekty</option>
                      <option>Restauracje na uroczystości</option>
                      <option>DJ i oprawa muzyczna</option>
                      <option>Fotograf okolicznościowy</option>
                      <option>Filmowanie / wideo</option>
                      <option>Catering na imprezy</option>
                      <option>Bar mobilny / barmani</option>
                      <option>Dekoracje i florystyka</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#6A5C70] font-medium mb-1.5">Adres e-mail konta</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#6A5C70] font-medium mb-1.5">Hasło do panelu</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Kreator profilu */}
            {step === 2 && (
              <div>
                <h2 className="font-fraunces text-[24px] font-medium mb-2">2. Treść i wizytówka profilu</h2>
                <p className="text-[14px] text-[#6A5C70] mb-6">
                  Zasada Gościnnie: profil musi zawierać obowiązkową cenę „od”, aby klienci nie musieli dzwonić w ciemno.
                </p>

                <div className="space-y-4 text-[14px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#6A5C70] font-medium mb-1.5">Nazwa profilu (obiektu lub firmy)</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#6A5C70] font-medium mb-1.5">Miejscowość i powiat</label>
                      <input
                        type="text"
                        value={town}
                        onChange={(e) => setTown(e.target.value)}
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#6A5C70] font-medium mb-1.5">
                        Cena od (pole obowiązkowe)
                      </label>
                      <input
                        type="text"
                        value={priceFrom}
                        onChange={(e) => setPriceFrom(e.target.value)}
                        placeholder="np. 180 zł / osoba lub 2500 zł / zlecenie"
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#6A5C70] font-medium mb-1.5">
                        {accountType === 'lokal' ? 'Pojemność sali' : 'Zasięg dojazdu (km)'}
                      </label>
                      <input
                        type="text"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#6A5C70] font-medium mb-1.5">Krótki opis dla gości</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                    />
                  </div>

                  <div className="border border-dashed border-[#D9CCC2] rounded-[12px] p-5 text-center bg-[#FAF6F2]">
                    <div className="text-[14px] font-bold text-[#241C2B] mb-1">Dodaj zdjęcia galerii (do 30 zdjęć)</div>
                    <div className="text-[12px] text-[#6A5C70]">Wybierz pliki JPG, PNG do 10 MB. Możesz uzupełnić to w każdej chwili w panelu.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Weryfikacja firmy */}
            {step === 3 && (
              <div>
                <h2 className="font-fraunces text-[24px] font-medium mb-2">3. Weryfikacja działalności (NIP i SMS)</h2>
                <p className="text-[14px] text-[#6A5C70] mb-6">
                  Weryfikujemy NIP w rejestrze Ministerstwa Finansów oraz numer telefonu, aby chronić katalog przed fałszywymi kontami.
                </p>

                <div className="space-y-5 text-[14px]">
                  <div>
                    <label className="block text-[#6A5C70] font-medium mb-1.5">Numer NIP firmy</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={nip}
                        onChange={(e) => setNip(e.target.value)}
                        className="grow border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                      <button
                        type="button"
                        onClick={() => setIsNipVerified(true)}
                        className="px-4 py-2 bg-[#F2E9E2] text-[#241C2B] rounded-[10px] font-semibold border border-[#D9CCC2] cursor-pointer"
                      >
                        Weryfikuj
                      </button>
                    </div>
                    {isNipVerified && (
                      <div className="text-[12px] text-[#5E7360] font-semibold mt-1.5 flex items-center gap-1.5">
                        ✓ NIP zweryfikowany w wykazie podatników VAT (podmiot czynny: Dwór pod Lipami Sp. z o.o.)
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[#6A5C70] font-medium mb-1.5">Numer telefonu komórkowego do zapytań</label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="grow border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                      <input
                        type="text"
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value)}
                        placeholder="Kod SMS"
                        className="w-[110px] border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] text-center font-bold"
                      />
                    </div>
                    {isPhoneVerified && (
                      <div className="text-[12px] text-[#5E7360] font-semibold mt-1.5 flex items-center gap-1.5">
                        ✓ Kod SMS potwierdzony
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Cena i publikacja */}
            {step === 4 && (
              <div>
                <h2 className="font-fraunces text-[24px] font-medium mb-2">4. Wybór planu i publikacja</h2>
                <p className="text-[14px] text-[#6A5C70] mb-6">
                  Wybierz plan abonamentowy lub rozpocznij od 30 dni bezpłatnej próby bez podawania karty.
                </p>

                {/* 30 Days Trial Option */}
                <div
                  onClick={() => setUseTrial(!useTrial)}
                  className={`border-2 rounded-[16px] p-5 mb-6 cursor-pointer transition-all ${
                    useTrial
                      ? 'border-[#5E7360] bg-[#E7EDE7]/40 ring-2 ring-[#5E7360]/20'
                      : 'border-[#E2D5CA] bg-[#FAF6F2]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[16px] text-[#241C2B]">
                      ★ Chcę najpierw 30 dni bezpłatnej próby
                    </span>
                    <span className="text-[13px] font-bold text-[#5E7360] bg-white px-2.5 py-0.5 rounded-full border border-[#D9CCC2]">
                      0 zł / 30 dni
                    </span>
                  </div>
                  <p className="text-[13px] text-[#55485A] leading-[1.5] m-0">
                    Profil staje się natychmiast publiczny w katalogu. Nie wymagamy podawania karty płatniczej.
                  </p>
                </div>

                {!useTrial && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[13px] font-bold text-[#6A5C70] uppercase mb-2">Plan</label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {(['start', 'pelny', 'wyrozniony'] as const).map((p) => (
                          <div
                            key={p}
                            onClick={() => setSelectedPlan(p)}
                            className={`p-3.5 rounded-[12px] border text-center cursor-pointer transition-all ${
                              selectedPlan === p
                                ? 'border-2 border-[#241C2B] bg-[#FAF6F2] font-bold'
                                : 'border-[#E2D5CA] bg-white'
                            }`}
                          >
                            <div className="capitalize">{p}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-[#6A5C70] uppercase mb-2">Okres rozliczenia</label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {(['miesiac', 'pol_roku', 'rok'] as const).map((pr) => (
                          <div
                            key={pr}
                            onClick={() => setSelectedPeriod(pr)}
                            className={`p-3.5 rounded-[12px] border text-center cursor-pointer transition-all ${
                              selectedPeriod === pr
                                ? 'border-2 border-[#241C2B] bg-[#FAF6F2] font-bold'
                                : 'border-[#E2D5CA] bg-white'
                            }`}
                          >
                            <div>{pr === 'rok' ? 'Rok (baza)' : pr === 'pol_roku' ? 'Pół roku' : 'Miesiąc'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-[#EFE5DD] flex justify-between items-center">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
                  className="text-[14px] font-semibold text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
                >
                  ← Wstecz
                </button>
              ) : (
                <span />
              )}

              <button
                type="button"
                onClick={handleNext}
                className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-8 py-3.5 cursor-pointer shadow-xs"
              >
                {step === 4 ? (useTrial ? 'Aktywuj 30 dni próby' : 'Przejdź do panelu firmy') : 'Dalej →'}
              </button>
            </div>
          </div>

          {/* Right Live Preview Card */}
          <aside className="lg:col-span-4 sticky top-6">
            <div className="border border-[#E2D5CA] rounded-[20px] bg-white p-6 shadow-xs">
              <div className="text-[12px] font-bold text-[#6A5C70] uppercase tracking-wider mb-2">
                Podgląd karty w katalogu
              </div>

              <div className="border border-[#E2D5CA] rounded-[16px] overflow-hidden bg-[#FAF6F2]">
                <div className="h-32 bg-[#E4D9CF] flex items-end p-3">
                  <span className="text-[11px] font-semibold bg-white/90 px-2 py-0.5 rounded">
                    Zdjęcie główne
                  </span>
                </div>
                <div className="p-4 bg-white">
                  <div className="font-fraunces font-medium text-[18px] text-[#241C2B] mb-0.5">
                    {displayName || 'Nazwa Twojego obiektu'}
                  </div>
                  <div className="text-[12px] text-[#6A5C70] mb-2">{town || 'Miejscowość'}</div>
                  <div className="flex justify-between items-baseline border-t border-[#EFE5DD] pt-2 text-[13px]">
                    <span className="text-[#6A5C70]">Cena od:</span>
                    <strong className="text-[#241C2B]">{priceFrom}</strong>
                  </div>
                  <div className="text-[12px] text-[#5E7360] mt-1 font-medium">{capacity}</div>
                </div>
              </div>

              <div className="mt-4 text-[12px] text-[#6A5C70] leading-[1.5]">
                🔒 Dane firmy i NIP są bezpiecznie szyfrowane. Wszystkie ceny w cenniku podajemy netto.
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer navigate={navigate} />
    </div>
  );
}

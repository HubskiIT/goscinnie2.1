"use client";

import { Check, Headphones, Landmark, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { KomunikatFormularza } from "@/components/KomunikatFormularza";
import { cena, cenaZOkresem, NAZWY_OKRESOW, NAZWY_PLANOW, zlotePelne } from "@/content/cennik";
import { KATEGORIE_USLUGODAWCOW, type KlasaCenowa, pobierzKategorie } from "@/content/kategorie";
import { pobierzRodzajeLokali, RODZAJE_LOKALI } from "@/content/rodzaje-lokali";
import { wyslijRejestracje } from "@/lib/akcje/formularze";
import { STAN_POCZATKOWY } from "@/lib/formularze";

type Krok = 1 | 2 | 3 | 4 | 5 | 6;

/** Kolejność kroków z punktu 5.3 planu: konto, rodzaj, profil, dane firmy, cena, publikacja. */
const NAZWY_KROKOW = [
  "Konto",
  "Rodzaj ogłoszenia",
  "Budowa profilu",
  "Dane firmy",
  "Cena i okres",
  "Publikacja",
] as const;

const KROKOW = NAZWY_KROKOW.length;

export function RejestracjaFirmyScreen() {
  const [stan, akcja] = useActionState(wyslijRejestracje, STAN_POCZATKOWY);
  const [step, setStep] = useState<Krok>(1);

  // Step 1: Account & Type
  const [accountType, setAccountType] = useState<"lokal" | "usluga">("lokal");
  const [category, setCategory] = useState<string>(RODZAJE_LOKALI[0]?.slug ?? "");
  const [email, setEmail] = useState("biuro@dworpodlipami.pl");
  const [password, setPassword] = useState("********");

  // Step 2: Profile Content
  const [displayName, setDisplayName] = useState("");
  const [town, setTown] = useState("Kobierzyce, k. Wrocławia");
  const [priceFrom, setPriceFrom] = useState("180 zł");
  const [capacity, setCapacity] = useState("do 140 osób");
  const [description, setDescription] = useState(
    "Dwór z 1902 roku z salą balową na 140 osób i parkiem. Obsługujemy wesela, komunie i przyjęcia okolicznościowe.",
  );

  // Step 3: Company verification
  const [nip, setNip] = useState("8971234567");
  const [isNipVerified, setIsNipVerified] = useState(true);
  const [phone, setPhone] = useState("+48 71 390 12 34");
  const [smsCode, setSmsCode] = useState("4829");
  const [isPhoneVerified, _setIsPhoneVerified] = useState(true);

  // Step 4: Plan & Period
  const [selectedPlan, setSelectedPlan] = useState<"start" | "pelny" | "wyrozniony">("pelny");
  const [selectedPeriod, setSelectedPeriod] = useState<"miesiac" | "pol_roku" | "rok">("rok");
  const [useTrial, setUseTrial] = useState(false);

  // Lista kategorii zalezy od tego, czy firma prowadzi lokal, czy dojezdza.
  const wybor =
    accountType === "lokal"
      ? pobierzRodzajeLokali().map((r) => ({ slug: r.slug, nazwa: r.nazwa, klasa: r.klasa }))
      : pobierzKategorie().map((k) => ({ slug: k.slug, nazwa: k.nazwa, klasa: k.klasa }));

  const klasa: KlasaCenowa = wybor.find((pozycja) => pozycja.slug === category)?.klasa ?? "C";

  const getStartingPrice = () =>
    `od ${zlotePelne(cena(klasa, "miesiac", "start"))} / mies. (Klasa ${klasa})`;

  const handleNext = () => {
    if (step < KROKOW) setStep((prev) => (prev + 1) as Krok);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <main className="grow px-6 sm:px-12 md:px-[130px] pt-10 pb-16">
        {/* Breadcrumb */}
        <p className="m-0 mb-4 text-[14px] text-[#6A5C70]">
          <Link
            href="/cennik"
            className="text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
          >
            Dla firm
          </Link>{" "}
          &nbsp;›&nbsp; Rejestracja profilu i kreator
        </p>

        {/* Stepper Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="m-0 font-fraunces font-normal text-[34px] sm:text-[42px] tracking-tight">
              Dodaj swoją firmę do katalogu Gościnnie
            </h1>
            <p className="m-0 mt-1 text-[16px] text-[#6A5C70]">
              Budowa profilu jest w 100% bezpłatna. Plan i okres wybierzesz w ostatnim kroku, lub
              zaczniesz od 30 dni próby.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[14px] font-bold text-[#6A5C70] bg-[#F2E9E2] px-4 py-2 rounded-full border border-[#E2D5CA]">
            Krok {step} z {KROKOW}: {NAZWY_KROKOW[step - 1]}
          </div>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="grid grid-cols-6 gap-2.5 mb-10">
          {NAZWY_KROKOW.map((nazwa, numer) => (
            <div
              key={nazwa}
              className={`h-2 rounded-full transition-colors ${
                step >= numer + 1 ? "bg-[#241C2B]" : "bg-[#E2D5CA]"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Wizard Card */}
          <form
            action={akcja}
            className="lg:col-span-8 border border-[#E2D5CA] rounded-[20px] bg-white p-7 sm:p-9 shadow-xs"
          >
            {/* Step 1: Konto i rodzaj */}
            <div className={step === 1 ? "" : "hidden"}>
              <div>
                <h2 className="font-fraunces text-[24px] font-medium mb-2">1. Konto</h2>
                <p className="text-[14px] text-[#6A5C70] mb-6">
                  Adres e-mail i hasło do panelu. Konto zakładasz raz, profil budujesz dalej.
                </p>

                {/* Wejście do kreatora prowadzi z przycisku w nagłówku, który nie mówi,
                    czy katalog obejmuje też usługodawców. To okienko rozwiewa wątpliwość,
                    zanim firma zacznie wypełniać pola. */}
                <div className="mb-6 rounded-[14px] border border-[#E2D5CA] bg-[#F2E9E2] p-5">
                  <p className="m-0 text-[15px] font-semibold text-[#241C2B]">
                    Zakładasz jedno konto dla swojej firmy
                  </p>
                  <p className="m-0 mt-1.5 text-[14px] leading-[1.6] text-[#3E3344]">
                    Działa tak samo dla lokalu stacjonarnego i dla usługodawcy dojeżdżającego do
                    klienta: sali, dworu, restauracji, ale też fotografa, zespołu, cateringu, DJ-a
                    czy florysty. Rodzaj ogłoszenia wybierzesz w następnym kroku.
                  </p>
                </div>

                <div className="space-y-4 text-[14px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="f-email" className="block text-[#6A5C70] font-medium mb-1.5">
                        Adres e-mail konta
                      </label>
                      <input
                        id="f-email"
                        name="f-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                    </div>
                    <div>
                      <label htmlFor="f-haslo" className="block text-[#6A5C70] font-medium mb-1.5">
                        Hasło do panelu
                      </label>
                      <input
                        id="f-haslo"
                        name="f-haslo"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={step === 2 ? "" : "hidden"}>
              <div>
                <h2 className="font-fraunces text-[24px] font-medium mb-2">2. Rodzaj ogłoszenia</h2>
                <p className="text-[14px] text-[#6A5C70] mb-6">
                  Wybierz, czy prowadzisz lokal stacjonarny, czy jesteś mobilnym usługodawcą
                  dojeżdżającym do klienta.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountType("lokal");
                      setCategory(RODZAJE_LOKALI[0]?.slug ?? "");
                    }}
                    className={`text-left p-5 rounded-[16px] border-2 cursor-pointer transition-all ${
                      accountType === "lokal"
                        ? "border-[#241C2B] bg-[#FAF6F2]"
                        : "border-[#E2D5CA] bg-white hover:border-[#6A5C70]"
                    }`}
                  >
                    <Landmark aria-hidden="true" size={26} className="mb-2 text-[#5E7360]" />
                    <div className="font-bold text-[16px] mb-1">Lokal stacjonarny</div>
                    <div className="text-[13px] text-[#6A5C70] leading-[1.4]">
                      Sala weselna, restauracja, dom weselny, hotel, agroturystyka, remiza, plener.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAccountType("usluga");
                      setCategory(KATEGORIE_USLUGODAWCOW[0]?.slug ?? "");
                    }}
                    className={`text-left p-5 rounded-[16px] border-2 cursor-pointer transition-all ${
                      accountType === "usluga"
                        ? "border-[#241C2B] bg-[#FAF6F2]"
                        : "border-[#E2D5CA] bg-white hover:border-[#6A5C70]"
                    }`}
                  >
                    <Headphones aria-hidden="true" size={26} className="mb-2 text-[#5E7360]" />
                    <div className="font-bold text-[16px] mb-1">Usługodawca mobilny</div>
                    <div className="text-[13px] text-[#6A5C70] leading-[1.4]">
                      DJ, fotograf, wideo, zespół muzyczny, catering, barman, dekorator, animator.
                    </div>
                  </button>
                </div>

                <div className="border border-[#E2D5CA] bg-[#F2E9E2] rounded-[12px] p-3.5 mb-6 text-[13px] text-[#55485A] flex items-center justify-between">
                  <span>Cena publikacji w wybranej kategorii:</span>
                  <strong className="text-[#241C2B]">{getStartingPrice()}</strong>
                </div>

                <div className="space-y-4 text-[14px]">
                  <div>
                    <label
                      htmlFor="f-kategoria"
                      className="block text-[#6A5C70] font-medium mb-1.5"
                    >
                      Główna kategoria
                    </label>
                    <select
                      id="f-kategoria"
                      name="f-kategoria"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] bg-white outline-none focus:border-[#241C2B]"
                    >
                      {wybor.map((pozycja) => (
                        <option key={pozycja.slug} value={pozycja.slug}>
                          {pozycja.nazwa}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="mt-5 mb-0 text-[14px] text-[#6A5C70]">
                  Masz już konto?{" "}
                  <Link
                    href="/logowanie"
                    className="font-semibold text-[#8A5405] underline hover:text-[#241C2B]"
                  >
                    Zaloguj się
                  </Link>
                </p>
              </div>
            </div>

            {/* Step 2: Kreator profilu */}
            <div className={step === 3 ? "" : "hidden"}>
              <div>
                <h2 className="font-fraunces text-[24px] font-medium mb-2">3. Budowa profilu</h2>
                <p className="text-[14px] text-[#6A5C70] mb-6">
                  Zasada Gościnnie: profil musi zawierać obowiązkową cenę „od”, aby klienci nie
                  musieli dzwonić w ciemno.
                </p>

                <div className="space-y-4 text-[14px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="f-nazwa" className="block text-[#6A5C70] font-medium mb-1.5">
                        Nazwa profilu (obiektu lub firmy)
                      </label>
                      <input
                        id="f-nazwa"
                        name="f-nazwa"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="f-miejscowosc"
                        className="block text-[#6A5C70] font-medium mb-1.5"
                      >
                        Miejscowość i powiat
                      </label>
                      <input
                        id="f-miejscowosc"
                        name="f-miejscowosc"
                        type="text"
                        value={town}
                        onChange={(e) => setTown(e.target.value)}
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="f-cena" className="block text-[#6A5C70] font-medium mb-1.5">
                        Cena od (pole obowiązkowe)
                      </label>
                      <input
                        id="f-cena"
                        name="f-cena"
                        type="text"
                        value={priceFrom}
                        onChange={(e) => setPriceFrom(e.target.value)}
                        placeholder="np. 180 zł / osoba lub 2500 zł / zlecenie"
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="f-pojemnosc"
                        className="block text-[#6A5C70] font-medium mb-1.5"
                      >
                        {accountType === "lokal" ? "Pojemność sali" : "Zasięg dojazdu (km)"}
                      </label>
                      <input
                        id="f-pojemnosc"
                        name="f-pojemnosc"
                        type="text"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="f-opis" className="block text-[#6A5C70] font-medium mb-1.5">
                      Krótki opis dla gości
                    </label>
                    <textarea
                      id="f-opis"
                      name="f-opis"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                    />
                  </div>

                  <div className="border border-dashed border-[#D9CCC2] rounded-[12px] p-5 text-center bg-[#FAF6F2]">
                    <div className="text-[14px] font-bold text-[#241C2B] mb-1">
                      Dodaj zdjęcia galerii (do 30 zdjęć)
                    </div>
                    <div className="text-[12px] text-[#6A5C70]">
                      Wybierz pliki JPG, PNG do 10 MB. Możesz uzupełnić to w każdej chwili w panelu.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Weryfikacja firmy */}
            <div className={step === 4 ? "" : "hidden"}>
              <div>
                <h2 className="font-fraunces text-[24px] font-medium mb-2">
                  4. Dane firmy (NIP i telefon)
                </h2>
                <p className="text-[14px] text-[#6A5C70] mb-6">
                  Weryfikujemy NIP w rejestrze Ministerstwa Finansów oraz numer telefonu, aby
                  chronić katalog przed fałszywymi kontami.
                </p>

                <div className="space-y-5 text-[14px]">
                  <div>
                    <label htmlFor="f-nip" className="block text-[#6A5C70] font-medium mb-1.5">
                      Numer NIP firmy
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="f-nip"
                        name="f-nip"
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
                        <Check aria-hidden="true" size={15} className="inline mr-1" /> NIP
                        zweryfikowany w wykazie podatników VAT (podmiot czynny: Dwór pod Lipami Sp.
                        z o.o.)
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="f-telefon" className="block text-[#6A5C70] font-medium mb-1.5">
                      Numer telefonu komórkowego do zapytań
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="f-telefon"
                        name="f-telefon"
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
                        <Check aria-hidden="true" size={15} className="inline mr-1" /> Kod SMS
                        potwierdzony
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Cena i publikacja */}
            <div className={step === 5 ? "" : "hidden"}>
              <div>
                <h2 className="font-fraunces text-[24px] font-medium mb-2">
                  5. Cena i okres rozliczenia
                </h2>
                <p className="text-[14px] text-[#6A5C70] mb-6">
                  Wybierz plan i okres rozliczenia dla swojej kategorii.
                </p>

                {
                  <div className="space-y-4">
                    <div>
                      <span
                        id="rejestracjafirmyscreen-plan"
                        className="block text-[13px] font-bold text-[#6A5C70] uppercase mb-2"
                      >
                        Plan
                      </span>
                      <fieldset
                        aria-labelledby="rejestracjafirmyscreen-plan"
                        className="grid grid-cols-3 gap-2.5"
                      >
                        {(["start", "pelny", "wyrozniony"] as const).map((p) => (
                          <button
                            type="button"
                            key={p}
                            onClick={() => setSelectedPlan(p)}
                            className={`p-3.5 rounded-[12px] border text-center cursor-pointer transition-all ${
                              selectedPlan === p
                                ? "border-2 border-[#241C2B] bg-[#FAF6F2] font-bold"
                                : "border-[#E2D5CA] bg-white"
                            }`}
                          >
                            <div>{NAZWY_PLANOW[p]}</div>
                            <div className="text-[12px] text-[#6A5C70] font-normal mt-0.5">
                              {zlotePelne(cena(klasa, selectedPeriod, p))}
                            </div>
                          </button>
                        ))}
                      </fieldset>
                    </div>

                    <div>
                      <span
                        id="rejestracjafirmyscreen-okres-rozliczenia"
                        className="block text-[13px] font-bold text-[#6A5C70] uppercase mb-2"
                      >
                        Okres rozliczenia
                      </span>
                      <fieldset
                        aria-labelledby="rejestracjafirmyscreen-okres-rozliczenia"
                        className="grid grid-cols-3 gap-2.5"
                      >
                        {(["miesiac", "pol_roku", "rok"] as const).map((pr) => (
                          <button
                            type="button"
                            key={pr}
                            onClick={() => setSelectedPeriod(pr)}
                            className={`p-3.5 rounded-[12px] border text-center cursor-pointer transition-all ${
                              selectedPeriod === pr
                                ? "border-2 border-[#241C2B] bg-[#FAF6F2] font-bold"
                                : "border-[#E2D5CA] bg-white"
                            }`}
                          >
                            <div>{NAZWY_OKRESOW[pr]}</div>
                            <div className="text-[12px] text-[#6A5C70] font-normal mt-0.5">
                              {zlotePelne(cena(klasa, pr, selectedPlan))}
                            </div>
                          </button>
                        ))}
                      </fieldset>
                    </div>

                    <div className="rounded-[12px] border border-[#E2D5CA] bg-[#F2E9E2] p-4 flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[14px] text-[#55485A]">
                        {NAZWY_PLANOW[selectedPlan]}, {NAZWY_OKRESOW[selectedPeriod].toLowerCase()},
                        klasa {klasa}
                      </span>
                      <strong className="font-fraunces text-[22px] text-[#241C2B]">
                        {cenaZOkresem(klasa, selectedPeriod, selectedPlan)}
                      </strong>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div className={step === 6 ? "" : "hidden"}>
              <div>
                <h2 className="font-fraunces text-[24px] font-medium mb-2">6. Publikacja</h2>
                <p className="text-[14px] text-[#6A5C70] mb-6">
                  Sprawdź, co zobaczy klient, i opublikuj profil.
                </p>

                {/* 30 Days Trial Option */}
                <button
                  type="button"
                  onClick={() => setUseTrial(!useTrial)}
                  className={`text-left border-2 rounded-[16px] p-5 mb-6 cursor-pointer transition-all ${
                    useTrial
                      ? "border-[#5E7360] bg-[#E7EDE7]/40 ring-2 ring-[#5E7360]/20"
                      : "border-[#E2D5CA] bg-[#FAF6F2]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-[16px] text-[#241C2B]">
                      <Sparkles aria-hidden="true" size={16} className="inline mr-1.5" />
                      Chcę najpierw 30 dni bezpłatnej próby
                    </span>
                    <span className="text-[13px] font-bold text-[#5E7360] bg-white px-2.5 py-0.5 rounded-full border border-[#D9CCC2]">
                      0 zł / 30 dni
                    </span>
                  </div>
                  <p className="text-[13px] text-[#55485A] leading-[1.5] m-0">
                    Profil staje się natychmiast publiczny w katalogu. Nie wymagamy podawania karty
                    płatniczej.
                  </p>
                  <p className="text-[13px] font-semibold text-[#7A3B1E] leading-[1.5] mt-2 mb-0">
                    Liczba miejsc w bezpłatnej próbie jest ograniczona. Gdy pula na dany miesiąc się
                    wyczerpie, profil zakładasz od razu z abonamentem.
                  </p>
                </button>
              </div>
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-[#EFE5DD] flex justify-between items-center">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => (prev - 1) as Krok)}
                  className="text-[14px] font-semibold text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
                >
                  ← Wstecz
                </button>
              ) : (
                <span />
              )}

              <button
                type={step === KROKOW ? "submit" : "button"}
                onClick={step === KROKOW ? undefined : handleNext}
                className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-8 py-3.5 cursor-pointer shadow-xs"
              >
                {step === KROKOW
                  ? useTrial
                    ? "Aktywuj 30 dni próby"
                    : "Opublikuj profil"
                  : "Dalej →"}
              </button>
            </div>

            <div className="pt-4">
              <KomunikatFormularza stan={stan} />
            </div>
          </form>

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
                    {displayName || "Nazwa Twojego obiektu"}
                  </div>
                  <div className="text-[12px] text-[#6A5C70] mb-2">{town || "Miejscowość"}</div>
                  <div className="flex justify-between items-baseline border-t border-[#EFE5DD] pt-2 text-[13px]">
                    <span className="text-[#6A5C70]">Cena od:</span>
                    <strong className="text-[#241C2B]">{priceFrom}</strong>
                  </div>
                  <div className="text-[12px] text-[#5E7360] mt-1 font-medium">{capacity}</div>
                </div>
              </div>

              <div className="mt-4 text-[12px] text-[#6A5C70] leading-[1.5]">
                <Lock aria-hidden="true" size={13} className="inline mr-1" /> Dane firmy i NIP są
                bezpiecznie szyfrowane. Wszystkie ceny w cenniku podajemy netto.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

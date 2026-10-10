"use client";

import { Check, Headphones, Landmark, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { KomunikatFormularza } from "@/components/KomunikatFormularza";
import { KATEGORIE_USLUGODAWCOW, type KlasaCenowa, pobierzKategorie } from "@/content/kategorie";
import { pobierzRodzajeLokali, RODZAJE_LOKALI } from "@/content/rodzaje-lokali";
import {
  wyslijDoZatwierdzenia,
  zapiszKrokDaneKontaktowe,
  zapiszKrokKategoria,
  zapiszKrokOpis,
} from "@/lib/akcje/profil";
import { zarejestrujFirme } from "@/lib/akcje/rejestracja";
import { STAN_POCZATKOWY } from "@/lib/formularze";

type Krok = 1 | 2 | 3 | 4 | 6;

const NAZWY_KROKOW = [
  "Konto",
  "Rodzaj ogłoszenia",
  "Budowa profilu",
  "Dane firmy",
  "Publikacja",
] as const;

const KROKOW = NAZWY_KROKOW.length;

/**
 * Kreator rejestracji firmy z prawdziwymi akcjami backendu.
 *
 * Krok 1 wywołuje zarejestrujFirme i przekierowuje na /weryfikacja.
 * Po weryfikacji użytkownik wraca tutaj z ?krok=2.
 * Kroki 2-5 zapisują dane przez akcje z lib/akcje/profil.ts.
 * Krok 6 wywołuje utworzPlatnosc i przekierowuje do PayU.
 */
export function RejestracjaFirmyScreen() {
  const searchParams = useSearchParams();
  const startStep = Number.parseInt(searchParams.get("krok") ?? "1", 10) as Krok;

  const [step, setStep] = useState<Krok>(startStep);
  const [isPending, startTransition] = useTransition();

  // Krok 1: Rejestracja konta
  const [stanRejestracji, akcjaRejestracji, czekaRejestracja] = useActionState(
    zarejestrujFirme,
    STAN_POCZATKOWY,
  );

  // Stan dla kroków 2-6 (używamy stanRejestracji dla kroku 1)
  const stanKroku = STAN_POCZATKOWY;
  const czekaKrok = false;

  // Step 1: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Type & Category
  const [accountType, setAccountType] = useState<"lokal" | "usluga">("lokal");
  const [category, setCategory] = useState<string>(RODZAJE_LOKALI[0]?.slug ?? "");

  // Step 3: Profile Content
  const [displayName, setDisplayName] = useState("");
  const [town, setTown] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");

  // Step 4: Company verification
  const [nip, setNip] = useState("");
  const [phone, setPhone] = useState("");

  const wybor =
    accountType === "lokal"
      ? pobierzRodzajeLokali().map((r) => ({ slug: r.slug, nazwa: r.nazwa, klasa: r.klasa }))
      : pobierzKategorie().map((k) => ({ slug: k.slug, nazwa: k.nazwa, klasa: k.klasa }));

  const klasa: KlasaCenowa = wybor.find((pozycja) => pozycja.slug === category)?.klasa ?? "C";

  const handleSubmitKrok2 = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.append("categoryId", category);
      formData.append("rodzaj", accountType);

      const wynik = await zapiszKrokKategoria(STAN_POCZATKOWY, formData);
      if (wynik.status === "poczatkowy") {
        setStep(3);
      }
    });
  };

  const handleSubmitKrok3 = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // Najpierw opis
      const formDataOpis = new FormData();
      formDataOpis.append("name", displayName);
      formDataOpis.append("description", description);
      const priceNumber = priceFrom.replace(/[^0-9]/g, "");
      formDataOpis.append("priceFrom", priceNumber || "0");

      const capacityMatch = capacity.match(/(\d+)/);
      if (capacityMatch) {
        formDataOpis.append("capacityMax", capacityMatch[1] ?? "0");
      }

      const wynikOpis = await zapiszKrokOpis(STAN_POCZATKOWY, formDataOpis);
      if (wynikOpis.status !== "poczatkowy") return;

      // TODO: Lokalizacja z mapą - na razie pomijamy cityId
      // Po dodaniu mapy wywołamy zapiszKrokLokalizacja z prawdziwym cityId

      setStep(4);
    });
  };

  const handleSubmitKrok4 = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.append("nip", nip);
      formData.append("telefon", phone);

      const wynik = await zapiszKrokDaneKontaktowe(STAN_POCZATKOWY, formData);
      if (wynik.status === "poczatkowy") {
        setStep(6); // Pomijamy krok 5 (wybór planu), bo PayU wyłączone
      }
    });
  };

  const handleSubmitKrok6 = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // Sprawdzamy, czy PayU jest dostępne przez wywołanie wyslijDoZatwierdzenia
      // która sama decyduje: jeśli PayU jest, przekierowuje do wyboru planu,
      // jeśli nie ma PayU, aktywuje firmę z darmową subskrypcją na 30 dni
      await wyslijDoZatwierdzenia();
    });
  };

  const stan = step === 1 ? stanRejestracji : stanKroku;
  const czeka = step === 1 ? czekaRejestracja : czekaKrok || isPending;

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <main className="grow px-6 sm:px-12 md:px-[130px] pt-10 pb-16">
        <p className="m-0 mb-4 text-[14px] text-[#6A5C70]">
          <Link
            href="/cennik"
            className="text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
          >
            Dla firm
          </Link>{" "}
          &nbsp;›&nbsp; Rejestracja profilu i kreator
        </p>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="m-0 font-fraunces font-normal text-[34px] sm:text-[42px] tracking-tight">
              Dodaj swoją firmę do katalogu Gościnnie
            </h1>
            <p className="m-0 mt-1 text-[16px] text-[#6A5C70]">
              Budowa profilu jest w 100% bezpłatna. Plan i okres wybierzesz w ostatnim kroku.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[14px] font-bold text-[#6A5C70] bg-[#F2E9E2] px-4 py-2 rounded-full border border-[#E2D5CA]">
            Krok {step} z {KROKOW}: {NAZWY_KROKOW[step - 1]}
          </div>
        </div>

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
          <div className="lg:col-span-8 border border-[#E2D5CA] rounded-[20px] bg-white p-7 sm:p-9 shadow-xs">
            {/* KROK 1: Rejestracja konta */}
            {step === 1 && (
              <form action={akcjaRejestracji}>
                <h2 className="font-fraunces text-[24px] font-medium mb-2">1. Konto</h2>
                <p className="text-[14px] text-[#6A5C70] mb-6">
                  Adres e-mail i hasło do panelu. Wyślemy kod weryfikacyjny na podany adres.
                </p>

                <div className="mb-6 rounded-[14px] border border-[#E2D5CA] bg-[#F2E9E2] p-5">
                  <p className="m-0 text-[15px] font-semibold text-[#241C2B]">
                    Zakładasz jedno konto dla swojej firmy
                  </p>
                  <p className="m-0 mt-1.5 text-[14px] leading-[1.6] text-[#3E3344]">
                    Działa tak samo dla lokalu stacjonarnego i dla usługodawcy dojeżdżającego do
                    klienta: sali, dworu, restauracji, ale też fotografa, zespołu, cateringu, DJ-a
                    czy florysty.
                  </p>
                </div>

                <div className="space-y-4 text-[14px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-[#6A5C70] font-medium mb-1.5">
                        Adres e-mail konta
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                    </div>
                    <div>
                      <label htmlFor="haslo" className="block text-[#6A5C70] font-medium mb-1.5">
                        Hasło do panelu
                      </label>
                      <input
                        id="haslo"
                        name="haslo"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={12}
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                    </div>
                  </div>
                  <p className="text-[12px] text-[#6A5C70]">
                    Hasło musi mieć co najmniej 12 znaków.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[#EFE5DD] flex justify-end">
                  <button
                    type="submit"
                    disabled={czeka}
                    className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-8 py-3.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {czeka ? "Wysyłam..." : "Dalej →"}
                  </button>
                </div>

                <div className="pt-4">
                  <KomunikatFormularza stan={stan} />
                </div>
              </form>
            )}

            {/* KROK 2: Rodzaj i kategoria */}
            {step === 2 && (
              <form onSubmit={handleSubmitKrok2}>
                <h2 className="font-fraunces text-[24px] font-medium mb-2">2. Rodzaj ogłoszenia</h2>
                <p className="text-[14px] text-[#6A5C70] mb-6">
                  Wybierz kategorię, która najlepiej opisuje Twoją działalność.
                </p>

                <div className="space-y-4">
                  <div>
                    <p className="text-[14px] font-medium text-[#241C2B] mb-2">Typ działalności</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setAccountType("lokal");
                          setCategory(RODZAJE_LOKALI[0]?.slug ?? "");
                        }}
                        className={`p-4 border-2 rounded-[12px] text-left transition-colors ${
                          accountType === "lokal"
                            ? "border-[#241C2B] bg-[#F2E9E2]"
                            : "border-[#D9CCC2] bg-white"
                        }`}
                      >
                        <Landmark className="w-5 h-5 mb-2" />
                        <div className="font-semibold text-[14px]">Lokal stacjonarny</div>
                        <div className="text-[12px] text-[#6A5C70]">Sala, dwór, restauracja</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAccountType("usluga");
                          setCategory(KATEGORIE_USLUGODAWCOW[0]?.slug ?? "");
                        }}
                        className={`p-4 border-2 rounded-[12px] text-left transition-colors ${
                          accountType === "usluga"
                            ? "border-[#241C2B] bg-[#F2E9E2]"
                            : "border-[#D9CCC2] bg-white"
                        }`}
                      >
                        <Headphones className="w-5 h-5 mb-2" />
                        <div className="font-semibold text-[14px]">Usługodawca</div>
                        <div className="text-[12px] text-[#6A5C70]">Fotograf, zespół, catering</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="category"
                      className="block text-[14px] font-medium text-[#241C2B] mb-2"
                    >
                      Kategoria
                    </label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                    >
                      {wybor.map((pozycja) => (
                        <option key={pozycja.slug} value={pozycja.slug}>
                          {pozycja.nazwa}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-[12px] text-[#6A5C70]">
                      Darmowy okres próbny 30 dni (Klasa {klasa})
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#EFE5DD] flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[14px] font-semibold text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
                  >
                    ← Wstecz
                  </button>
                  <button
                    type="submit"
                    disabled={czeka}
                    className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-8 py-3.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {czeka ? "Zapisuję..." : "Dalej →"}
                  </button>
                </div>
              </form>
            )}

            {/* KROK 3: Budowa profilu */}
            {step === 3 && (
              <form onSubmit={handleSubmitKrok3}>
                <h2 className="font-fraunces text-[24px] font-medium mb-2">3. Budowa profilu</h2>
                <p className="text-[14px] text-[#6A5C70] mb-6">
                  Te informacje zobaczą klienci w katalogu i wynikach wyszukiwania.
                </p>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="displayName"
                      className="block text-[14px] font-medium text-[#241C2B] mb-1.5"
                    >
                      Nazwa firmy widoczna w katalogu
                    </label>
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      minLength={2}
                      maxLength={120}
                      placeholder="Dwór Pod Lipami"
                      className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="town"
                      className="block text-[14px] font-medium text-[#241C2B] mb-1.5"
                    >
                      Miejscowość
                    </label>
                    <input
                      id="town"
                      type="text"
                      value={town}
                      onChange={(e) => setTown(e.target.value)}
                      placeholder="Kobierzyce, k. Wrocławia"
                      className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                    />
                    <p className="mt-1 text-[12px] text-[#6A5C70]">
                      Na razie wpisz tekstowo, integrację z mapą dodamy później
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="priceFrom"
                        className="block text-[14px] font-medium text-[#241C2B] mb-1.5"
                      >
                        Cena od
                      </label>
                      <input
                        id="priceFrom"
                        type="text"
                        value={priceFrom}
                        onChange={(e) => setPriceFrom(e.target.value)}
                        placeholder="180 zł"
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="capacity"
                        className="block text-[14px] font-medium text-[#241C2B] mb-1.5"
                      >
                        Pojemność
                      </label>
                      <input
                        id="capacity"
                        type="text"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        placeholder="do 140 osób"
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-[14px] font-medium text-[#241C2B] mb-1.5"
                    >
                      Opis działalności
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      minLength={20}
                      maxLength={2000}
                      rows={6}
                      placeholder="Opisz swoją ofertę, unikalne cechy obiektu, doświadczenie..."
                      className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                    />
                    <p className="mt-1 text-[12px] text-[#6A5C70]">
                      Co najmniej 20 znaków, maksymalnie 2000
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#EFE5DD] flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-[14px] font-semibold text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
                  >
                    ← Wstecz
                  </button>
                  <button
                    type="submit"
                    disabled={czeka}
                    className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-8 py-3.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {czeka ? "Zapisuję..." : "Dalej →"}
                  </button>
                </div>
              </form>
            )}

            {/* KROK 4: Dane firmy */}
            {step === 4 && (
              <form onSubmit={handleSubmitKrok4}>
                <h2 className="font-fraunces text-[24px] font-medium mb-2">4. Dane firmy</h2>
                <p className="text-[14px] text-[#6A5C70] mb-6">
                  NIP i telefon kontaktowy. Te dane są wymagane do aktywacji profilu.
                </p>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="nip"
                      className="block text-[14px] font-medium text-[#241C2B] mb-1.5"
                    >
                      NIP
                    </label>
                    <input
                      id="nip"
                      type="text"
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      required
                      pattern="[0-9\s\-]{10,14}"
                      placeholder="123-456-78-90"
                      className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-[14px] font-medium text-[#241C2B] mb-1.5"
                    >
                      Telefon kontaktowy
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      pattern="[\+]?[0-9\s\-]{9,15}"
                      placeholder="+48 123 456 789"
                      className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#EFE5DD] flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-[14px] font-semibold text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
                  >
                    ← Wstecz
                  </button>
                  <button
                    type="submit"
                    disabled={czeka}
                    className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-8 py-3.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {czeka ? "Zapisuję..." : "Dalej →"}
                  </button>
                </div>
              </form>
            )}

            {/* KROK 6: Publikacja */}
            {step === 6 && (
              <form onSubmit={handleSubmitKrok6}>
                <h2 className="font-fraunces text-[24px] font-medium mb-2">6. Publikacja</h2>
                <p className="text-[14px] text-[#6A5C70] mb-6">
                  Potwierdź dane i opublikuj profil w katalogu.
                </p>

                <div className="space-y-4 mb-6">
                  <div className="p-4 border border-[#E2D5CA] rounded-[12px] bg-[#FAF6F2]">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#5E7360] mt-0.5" />
                      <div className="flex-1">
                        <p className="m-0 font-semibold text-[15px]">{displayName}</p>
                        <p className="m-0 text-[13px] text-[#6A5C70] mt-0.5">
                          {category} • {town || "lokalizacja do uzupełnienia"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-[#E2D5CA] rounded-[12px] bg-[#FAF6F2]">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-[#5E7360] mt-0.5" />
                      <div className="flex-1">
                        <p className="m-0 font-semibold text-[15px]">Darmowy okres próbny 30 dni</p>
                        <p className="m-0 text-[13px] text-[#6A5C70] mt-0.5">
                          Pełny dostęp do wszystkich funkcji
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 border border-[#E2D5CA] rounded-[14px] bg-[#F2E9E2]">
                  <p className="m-0 text-[13px] text-[#241C2B] leading-[1.6]">
                    Klikając „Opublikuj profil" Twój profil zostanie aktywowany i pojawi się w
                    katalogu. Możesz go edytować w każdej chwili z poziomu panelu.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[#EFE5DD] flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="text-[14px] font-semibold text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
                  >
                    ← Wstecz
                  </button>
                  <button
                    type="submit"
                    disabled={czeka}
                    className="text-[15px] font-bold text-white bg-[#3B6DFF] hover:bg-[#2952CC] transition-colors border-0 rounded-[12px] px-8 py-3.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {czeka ? "Publikuję..." : "Opublikuj profil"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Podgląd na żywo */}
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
                    <strong className="text-[#241C2B]">{priceFrom || "—"}</strong>
                  </div>
                  <div className="text-[12px] text-[#5E7360] mt-1 font-medium">
                    {capacity || "Pojemność"}
                  </div>
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

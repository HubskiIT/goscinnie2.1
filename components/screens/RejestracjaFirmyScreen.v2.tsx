"use client";

import { Check, Headphones, Landmark, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { BladPola, idBledu, maBlad } from "@/components/BladPola";
import { KomunikatFormularza } from "@/components/KomunikatFormularza";
import { ListaWymaganHasla } from "@/components/ListaWymaganHasla";
import { PoleMiejscowosci } from "@/components/PoleMiejscowosci";
import { KATEGORIE_USLUGODAWCOW, pobierzKategorie } from "@/content/kategorie";
import { pobierzRodzajeLokali, RODZAJE_LOKALI } from "@/content/rodzaje-lokali";
import {
  wyslijDoZatwierdzenia,
  zapiszKrokDaneKontaktowe,
  zapiszKrokKategoria,
  zapiszKrokLokalizacja,
  zapiszKrokOpis,
} from "@/lib/akcje/profil";
import { zarejestrujFirme } from "@/lib/akcje/rejestracja";
import { STAN_POCZATKOWY, type StanFormularza } from "@/lib/formularze";
import { MINIMALNA_DLUGOSC_HASLA } from "@/lib/haslo";
import type { Krok, SzkicKreatora } from "@/lib/kreator-krok";
import { krokPoczatkowy } from "@/lib/kreator-krok";
import { odczytajPojemnosc, pojemnoscDoPola } from "@/lib/pojemnosc";

/** Nazwa ukrytego pola z identyfikatorem miejscowości. Musi zgadzać się z Zodem. */
const POLE_CITY_ID = "cityId";

const NAZWY_KROKOW = [
  "Konto",
  "Rodzaj ogłoszenia",
  "Budowa profilu",
  "Dane firmy",
  "Publikacja",
] as const;

const KROKOW = NAZWY_KROKOW.length;

/**
 * Kroki w kolejności, w jakiej je pokazujemy.
 *
 * Numer kroku nie jest numerem pozycji na pasku: piątego, czyli wyboru planu,
 * nie ma, dopóki PayU jest wyłączone. Bez tej tablicy ostatni krok podpisywał
 * się „Krok 6 z 5" i zostawał bez nazwy, bo `NAZWY_KROKOW[5]` nie istnieje.
 */
const KROKI: Krok[] = [1, 2, 3, 4, 6];

/**
 * Kreator rejestracji firmy z prawdziwymi akcjami backendu.
 *
 * Krok 1 wywołuje zarejestrujFirme i przekierowuje na /weryfikacja.
 * Po weryfikacji użytkownik wraca tutaj z ?krok=2.
 * Kroki 2-5 zapisują dane przez akcje z lib/akcje/profil.ts.
 * Krok 6 wywołuje utworzPlatnosc i przekierowuje do PayU.
 */
export function RejestracjaFirmyScreen({
  szkic = null,
  zalogowany = false,
}: {
  szkic?: SzkicKreatora | null;
  /** Czy krok pierwszy, czyli zakładanie konta, jest już za nami. */
  zalogowany?: boolean;
}) {
  const searchParams = useSearchParams();

  // Krok wznowienia wynika ze stanu szkicu; `?krok=` wolno spełnić tylko w tył.
  const startStep = krokPoczatkowy(searchParams.get("krok"), szkic, zalogowany);

  const [step, setStep] = useState<Krok>(startStep);
  const [isPending, startTransition] = useTransition();

  // Krok 1: Rejestracja konta
  const [stanRejestracji, akcjaRejestracji, czekaRejestracja] = useActionState(
    zarejestrujFirme,
    STAN_POCZATKOWY,
  );

  /*
   * Wynik ostatniego zapisu w krokach 2-6.
   *
   * Wcześniej była tu stała `STAN_POCZATKOWY`, więc błędy z tych kroków nie
   * miały jak dotrzeć na ekran: akcja odmawiała zapisu, kreator nie przechodził
   * dalej i nie mówił dlaczego. Przycisk po prostu przestawał działać.
   */
  const [stanKroku, setStanKroku] = useState<StanFormularza>(STAN_POCZATKOWY);

  // Step 1: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // Step 2: Type & Category
  const [accountType, setAccountType] = useState<"lokal" | "usluga">(
    szkic?.kategoria && KATEGORIE_USLUGODAWCOW.some((k) => k.slug === szkic.kategoria)
      ? "usluga"
      : "lokal",
  );
  const [category, setCategory] = useState<string>(
    szkic?.kategoria ?? RODZAJE_LOKALI[0]?.slug ?? "",
  );

  // Step 3: Profile Content
  const [displayName, setDisplayName] = useState(szkic?.nazwa ?? "");
  /*
   * Nazwa wybranej miejscowości. Pole pilnuje swojego tekstu samo, ale
   * podsumowanie w ostatnim kroku musi ją pokazać, więc dostajemy ją wywołaniem
   * zwrotnym. Wartość początkowa pochodzi ze szkicu, żeby wznowienie kreatora
   * nie pokazywało „lokalizacja do uzupełnienia” dla zapisanej miejscowości.
   */
  const [town, setTown] = useState(szkic?.miejscowosc ?? "");
  // Cena w bazie jest w groszach, w polu wpisuje się złotówki.
  const [priceFrom, setPriceFrom] = useState(
    szkic?.cenaOd == null ? "" : String(szkic.cenaOd / 100),
  );
  const [capacity, setCapacity] = useState(
    pojemnoscDoPola(szkic?.pojemnoscMin ?? null, szkic?.pojemnoscMax ?? null),
  );
  const [description, setDescription] = useState(szkic?.opis ?? "");

  // Step 4: Company verification
  const [nip, setNip] = useState("");
  const [phone, setPhone] = useState("");

  const wybor =
    accountType === "lokal"
      ? pobierzRodzajeLokali().map((r) => ({ slug: r.slug, nazwa: r.nazwa }))
      : pobierzKategorie().map((k) => ({ slug: k.slug, nazwa: k.nazwa }));

  // W podsumowaniu pokazujemy nazwę kategorii, nie jej slug: „Sala weselna",
  // a nie „sala-weselna".
  const nazwaKategorii = wybor.find((pozycja) => pozycja.slug === category)?.nazwa ?? category;

  const handleSubmitKrok2 = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      // Slug ze słownika, nie UUID: tabela `categories` ma unikalny `slug`,
      // a przeglądarka nie ma skąd znać identyfikatorów.
      formData.append("kategoria", category);
      formData.append("rodzaj", accountType);

      const wynik = await zapiszKrokKategoria(STAN_POCZATKOWY, formData);
      setStanKroku(wynik);
      if (wynik.status === "zapisano") setStep(3);
    });
  };

  /**
   * Krok 3 zapisuje dwiema akcjami: opis i lokalizację.
   *
   * Dalej przechodzimy **tylko wtedy, gdy udały się obie**. Wcześniej
   * lokalizacja nie była zapisywana wcale, więc firma zostawała z `city_id`
   * wskazującym przypadkowy wiersz i punktem na zerowym południku, czyli nie
   * pojawiała się w żadnym wyszukiwaniu po okolicy.
   */
  const handleSubmitKrok3 = async (e: React.FormEvent) => {
    e.preventDefault();
    const dane = new FormData(e.currentTarget as HTMLFormElement);

    startTransition(async () => {
      const opisForm = new FormData();
      opisForm.append("nazwa", displayName);
      opisForm.append("opis", description);
      // Pola są tekstowe („180 zł", „do 140 osób"), więc wyłuskujemy liczbę.
      // Pusto zostaje pustym napisem: Zod czyta to jako „do uzupełnienia".
      opisForm.append("cenaOd", priceFrom.replace(/[^\d.,]/g, "").replace(",", "."));
      // „40-140” to przedział, „140” to samo maksimum. Patrz lib/pojemnosc.ts.
      const pojemnosc = odczytajPojemnosc(capacity);
      opisForm.append("pojemnoscMin", pojemnosc.min === null ? "" : String(pojemnosc.min));
      opisForm.append("pojemnoscMax", pojemnosc.max === null ? "" : String(pojemnosc.max));

      const wynikOpisu = await zapiszKrokOpis(STAN_POCZATKOWY, opisForm);
      if (wynikOpisu.status !== "zapisano") {
        setStanKroku(wynikOpisu);
        return;
      }

      const lokalizacjaForm = new FormData();
      lokalizacjaForm.append(POLE_CITY_ID, String(dane.get(POLE_CITY_ID) ?? ""));

      const wynikLokalizacji = await zapiszKrokLokalizacja(STAN_POCZATKOWY, lokalizacjaForm);
      setStanKroku(wynikLokalizacji);
      if (wynikLokalizacji.status === "zapisano") setStep(4);
    });
  };

  const handleSubmitKrok4 = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.append("nip", nip);
      formData.append("telefon", phone);

      const wynik = await zapiszKrokDaneKontaktowe(STAN_POCZATKOWY, formData);
      setStanKroku(wynik);
      // Krok 5 (wybór planu) pomijamy, dopóki PayU jest wyłączone.
      if (wynik.status === "zapisano") setStep(6);
    });
  };

  const handleSubmitKrok6 = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      /*
       * Akcja sama rozstrzyga, co dalej: z PayU przekierowuje do wyboru planu,
       * bez PayU publikuje z darmowym okresem próbnym. Wraca tutaj wyłącznie
       * wtedy, gdy czegoś brakuje, bo przekierowanie kończy jej działanie.
       */
      const wynik = await wyslijDoZatwierdzenia(STAN_POCZATKOWY, new FormData());
      setStanKroku(wynik);
    });
  };

  // Krok 1 idzie przez useActionState, kolejne przez startTransition.
  const stan = step === 1 ? stanRejestracji : stanKroku;
  const czeka = step === 1 ? czekaRejestracja : isPending;

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <main className="grow px-6 sm:px-12 md:px-[130px] pt-10 pb-16">
        <p className="m-0 mb-4 text-[14px] text-[#6A5C70]">
          <Link
            href="/dla-firm"
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
              {szkic?.opublikowany
                ? "Zmiany zapisują się po każdym kroku. Profil pozostaje widoczny w katalogu."
                : "Dodanie firmy i prowadzenie profilu jest bezpłatne."}
            </p>
          </div>

          <div className="flex items-center gap-2 text-[14px] font-bold text-[#6A5C70] bg-[#F2E9E2] px-4 py-2 rounded-full border border-[#E2D5CA]">
            Krok {KROKI.indexOf(step) + 1} z {KROKOW}: {NAZWY_KROKOW[KROKI.indexOf(step)]}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2.5 mb-10">
          {NAZWY_KROKOW.map((nazwa, numer) => (
            <div
              key={nazwa}
              className={`h-2 rounded-full transition-colors ${
                KROKI.indexOf(step) >= numer ? "bg-[#241C2B]" : "bg-[#E2D5CA]"
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
                        minLength={MINIMALNA_DLUGOSC_HASLA}
                        autoComplete="new-password"
                        aria-invalid={maBlad(stan, "haslo")}
                        aria-describedby="wymagania-hasla"
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                      <BladPola stan={stan} pole="haslo" />
                    </div>
                    <div>
                      <label htmlFor="haslo2" className="block text-[#6A5C70] font-medium mb-1.5">
                        Powtórz hasło
                      </label>
                      <input
                        id="haslo2"
                        name="haslo2"
                        type="password"
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value)}
                        required
                        minLength={MINIMALNA_DLUGOSC_HASLA}
                        autoComplete="new-password"
                        aria-invalid={maBlad(stan, "haslo2")}
                        aria-describedby={maBlad(stan, "haslo2") ? idBledu("haslo2") : undefined}
                        className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                      />
                      <BladPola stan={stan} pole="haslo2" />
                    </div>
                  </div>
                  <ListaWymaganHasla id="wymagania-hasla" />
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
                  </div>
                </div>

                <div className="pt-4">
                  <KomunikatFormularza stan={stanKroku} />
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
                    {/*
                     * Miejscowość wybierana z listy, nie wpisywana z palca.
                     *
                     * Zapis wymaga `cities.id`, bo z wiersza miejscowości bierzemy
                     * współrzędne do wyszukiwania po promieniu. Zwykłe pole tekstowe
                     * nie miało czym go wypełnić, więc lokalizacja nie zapisywała się
                     * w ogóle.
                     */}
                    <PoleMiejscowosci
                      nazwaPola="miejscowosc"
                      nazwaPolaId={POLE_CITY_ID}
                      wartoscPoczatkowa={town}
                      idPoczatkowe={szkic?.cityId ?? ""}
                      onWybor={(miejscowosc) => setTown(miejscowosc.nazwa)}
                      klasaEtykiety="block text-[14px] font-medium text-[#241C2B] mb-1.5"
                      klasaPola="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[#241C2B] outline-none focus:border-[#241C2B]"
                    />
                    <p className="mt-1 text-[12px] text-[#6A5C70]">
                      Zacznij pisać i wybierz miejscowość z listy. Po niej klienci znajdą Cię w
                      wyszukiwaniu po okolicy.
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

                <div className="pt-4">
                  <KomunikatFormularza stan={stanKroku} />
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
                  Weryfikacja firmy. NIP i telefon nie pojawiają się na profilu. Służą do
                  sprawdzenia, że firma istnieje, i do kontaktu z Tobą w sprawie konta.
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

                <div className="pt-4">
                  <KomunikatFormularza stan={stanKroku} />
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
                <h2 className="font-fraunces text-[24px] font-medium mb-2">5. Publikacja</h2>
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
                          {nazwaKategorii} • {town || "lokalizacja do uzupełnienia"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-[#E2D5CA] rounded-[12px] bg-[#FAF6F2]">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-[#5E7360] mt-0.5" />
                      <div className="flex-1">
                        <p className="m-0 font-semibold text-[15px]">
                          {szkic?.opublikowany ? "Profil jest opublikowany" : "Bez opłat"}
                        </p>
                        <p className="m-0 text-[13px] text-[#6A5C70] mt-0.5">
                          {szkic?.opublikowany
                            ? "Zapisane zmiany od razu widać w katalogu."
                            : "Na starcie Gościnnie nie pobiera od firm żadnych opłat."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 border border-[#E2D5CA] rounded-[14px] bg-[#F2E9E2]">
                  <p className="m-0 text-[13px] text-[#241C2B] leading-[1.6]">
                    {szkic?.opublikowany
                      ? "Poprawki możesz wprowadzać w każdej chwili z panelu firmy."
                      : "Po kliknięciu „Opublikuj profil” firma pojawi się w katalogu. Poprawki wprowadzisz w każdej chwili z panelu firmy."}
                  </p>
                </div>

                <div className="pt-4">
                  <KomunikatFormularza stan={stanKroku} />
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
                    className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-8 py-3.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {czeka
                      ? "Zapisuję..."
                      : szkic?.opublikowany
                        ? "Zapisz zmiany"
                        : "Opublikuj profil"}
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
                    <strong className="text-[#241C2B]">
                      {/^\d+([.,]\d+)?$/.test(priceFrom.trim())
                        ? `${priceFrom.trim()} zł`
                        : priceFrom || "—"}
                    </strong>
                  </div>
                  {accountType === "lokal" ? (
                    <div className="text-[12px] text-[#5E7360] mt-1 font-medium">
                      {capacity ? `${capacity} osób` : "Pojemność"}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 text-[12px] text-[#6A5C70] leading-[1.5]">
                <Lock aria-hidden="true" size={13} className="inline mr-1" /> NIP i telefon nie są
                pokazywane na profilu. Klienci widzą to, co jest w podglądzie powyżej.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

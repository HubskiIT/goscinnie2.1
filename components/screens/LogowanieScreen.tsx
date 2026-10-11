"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { KomunikatFormularza } from "@/components/KomunikatFormularza";
import { poprosONoweHaslo } from "@/lib/akcje/haslo";
import { zalogujSie } from "@/lib/akcje/logowanie";
import { STAN_POCZATKOWY } from "@/lib/formularze";

export function LogowanieScreen() {
  const [stanLogowania, akcjaLogowania, czekaLogowanie] = useActionState(
    zalogujSie,
    STAN_POCZATKOWY,
  );
  // Po udanej zmianie hasła wracamy tu z ?haslo=zmienione.
  const haslZmienione = useSearchParams().get("haslo") === "zmienione";
  const [stanResetu, akcjaResetu, czekaReset] = useActionState(poprosONoweHaslo, STAN_POCZATKOWY);
  /** Czy pokazujemy pole na adres do resetu zamiast formularza logowania. */
  const [resetHasla, setResetHasla] = useState(false);
  const [accountType, setAccountType] = useState<"klient" | "firma">("klient");
  /*
   * Pola startują puste.
   *
   * Wcześniej był tu wpisany na sztywno adres i hasło „password" z prototypu.
   * Po podłączeniu prawdziwego logowania taki formularz wysyłałby cudzy adres
   * przy pierwszym kliknięciu, a przeglądarka proponowałaby zapisanie go
   * w menedżerze haseł.
   */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  // Demo interactive states
  const [totpCode, _setTotpCode] = useState(["4", "0", "7", "", "", ""]);
  const [demoAttemptCount, _setDemoAttemptCount] = useState(3);

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      {/* Main Login Area */}
      <section className="grow px-6 sm:px-12 md:px-[130px] pt-14 flex flex-col lg:flex-row gap-10 items-start">
        {/* Left Form */}
        <div className="w-full lg:w-[480px] shrink-0 border border-[#D9CCC2] rounded-[20px] bg-white p-7 sm:p-9 shadow-sm">
          {/* Switcher */}
          <div className="flex gap-1 bg-[#F2E9E2] rounded-[12px] p-1 mb-7">
            <button
              type="button"
              onClick={() => setAccountType("klient")}
              className={`grow text-[15px] rounded-[9px] py-2.5 font-semibold cursor-pointer border-0 transition-colors ${
                accountType === "klient"
                  ? "text-[#241C2B] bg-white border border-[#D9CCC2] shadow-xs"
                  : "text-[#55485A] bg-transparent"
              }`}
            >
              Konto klienta
            </button>
            <button
              type="button"
              onClick={() => setAccountType("firma")}
              className={`grow text-[15px] rounded-[9px] py-2.5 font-semibold cursor-pointer border-0 transition-colors ${
                accountType === "firma"
                  ? "text-[#241C2B] bg-white border border-[#D9CCC2] shadow-xs"
                  : "text-[#55485A] bg-transparent"
              }`}
            >
              Konto firmy
            </button>
          </div>

          <h1 className="m-0 mb-2.5 font-fraunces font-normal text-[34px] tracking-tight">
            Zaloguj się
          </h1>
          <p className="m-0 mb-6 text-[15px] leading-[1.6] text-[#6A5C70]">
            {accountType === "klient"
              ? "Konto klienta jest bezpłatne i potrzebne tylko do zleceń oraz krótkiej listy. Przeglądanie działa bez logowania."
              : "Dostęp do panelu zarządzania obiektem, giełdy zleceń i kalendarza wolnych terminów."}
          </p>

          {haslZmienione && !resetHasla ? (
            <p
              role="status"
              className="m-0 mb-5 rounded-[12px] border border-[#C7D6C8] bg-[#E7EDE7] p-4 text-[15px] leading-[1.6] text-[#3F5142]"
            >
              Hasło zostało zmienione. Zaloguj się nowym hasłem.
            </p>
          ) : null}

          {resetHasla ? (
            /*
              Reset zamiast logowania, w tym samym miejscu na ekranie.
              Osobna podstrona byłaby kolejnym adresem do utrzymania, a tu
              chodzi o jedno pole i jeden przycisk.
            */
            <form action={akcjaResetu} className="flex flex-col gap-4.5">
              <KomunikatFormularza stan={stanResetu} />

              <p className="m-0 text-[15px] leading-[1.6] text-[#6A5C70]">
                Podaj adres, na który założono konto. Wyślemy link do ustawienia nowego hasła.
              </p>

              <div className="flex flex-col gap-2">
                <label htmlFor="reset-mail" className="text-[14px] font-semibold text-[#3E3344]">
                  Adres e-mail
                </label>
                <input
                  id="reset-mail"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue={email}
                  className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
                />
              </div>

              <button
                type="submit"
                disabled={czekaReset}
                className="text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] p-4 cursor-pointer mt-1 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {czekaReset ? "Wysyłam..." : "Wyślij link"}
              </button>

              <button
                type="button"
                onClick={() => setResetHasla(false)}
                className="text-[14px] text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
              >
                ← Wróć do logowania
              </button>
            </form>
          ) : (
            <form action={akcjaLogowania} className="flex flex-col gap-4.5">
              <KomunikatFormularza stan={stanLogowania} />

              <div className="flex flex-col gap-2">
                <label htmlFor="log-mail" className="text-[14px] font-semibold text-[#3E3344]">
                  Adres e-mail
                </label>
                <input
                  id="log-mail"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="log-haslo" className="text-[14px] font-semibold text-[#3E3344]">
                    Hasło
                  </label>
                  <button
                    type="button"
                    onClick={() => setResetHasla(true)}
                    className="text-[13px] text-[#8A5405] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
                  >
                    Nie pamiętam hasła
                  </button>
                </div>
                <input
                  id="log-haslo"
                  name="haslo"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
                />
              </div>

              <label
                htmlFor="log-pamietaj"
                className="flex items-center gap-2.5 text-[14px] text-[#3E3344] cursor-pointer"
              >
                <input
                  id="log-pamietaj"
                  name="pamietaj"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-[18px] h-[18px] accent-[#5E7360]"
                />
                Pamiętaj mnie na tym urządzeniu przez 30 dni
              </label>

              <button
                type="submit"
                disabled={czekaLogowanie}
                className="text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] p-4 cursor-pointer mt-1 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {czekaLogowanie ? "Loguję..." : "Zaloguj się"}
              </button>
            </form>
          )}

          <div className="flex items-center gap-3.5 my-6">
            <span className="grow h-[1px] bg-[#EFE5DD]" />
            <span className="text-[13px] text-[#6A5C70]">nie masz jeszcze konta</span>
            <span className="grow h-[1px] bg-[#EFE5DD]" />
          </div>

          <Link
            href={accountType === "klient" ? "/dodaj-zlecenie" : "/rejestracja-firmy"}
            className="block w-full text-center text-[16px] font-semibold text-[#241C2B] border-[1.5px] border-[#241C2B] rounded-[12px] p-3.5 hover:bg-[#241C2B] hover:text-white transition-colors cursor-pointer bg-white"
          >
            {accountType === "klient"
              ? "Zarejestruj się adresem e-mail"
              : "Załóż profil dla swojej firmy"}
          </Link>

          <p className="mt-4.5 mb-0 text-[13px] leading-[1.65] text-[#6A5C70]">
            Nie logujemy przez Facebooka ani Google. Jedno konto, jeden adres, jedno hasło, które
            trzymamy w postaci skrótu argon2id i którego nie potrafimy odczytać.
          </p>
        </div>

        {/* Right Security & Rules Explainer */}
        <div className="grow w-full flex flex-col gap-5">
          <div className="border border-[#E2D5CA] rounded-[20px] bg-[#F2E9E2] p-7 sm:p-8.5 shadow-sm">
            <h2 className="m-0 mb-5 font-fraunces font-medium text-[26px]">
              Co robimy z Twoimi danymi
            </h2>
            <div className="flex flex-col gap-5">
              <div className="flex gap-3.5">
                <svg
                  aria-hidden="true"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5E7360"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 mt-0.5"
                >
                  <path d="M12 3l7.5 3.4v5c0 4.4-3.1 8.2-7.5 9.4-4.4-1.2-7.5-5-7.5-9.4v-5z" />
                  <polyline points="9 12 11.2 14.2 15.4 10" />
                </svg>
                <div>
                  <div className="text-[15px] font-bold mb-1">
                    Hasła nie da się odzyskać, tylko ustawić nowe
                  </div>
                  <div className="text-[14px] leading-[1.65] text-[#55485A]">
                    Trzymamy skrót argon2id. Nikt w serwisie, włącznie z nami, nie widzi Twojego
                    hasła. Jeśli ktoś przyśle maila z prośbą o hasło, to nie jesteśmy my.
                  </div>
                </div>
              </div>

              <div className="flex gap-3.5">
                <svg
                  aria-hidden="true"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5E7360"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 mt-0.5"
                >
                  <path d="M12 3l7.5 3.4v5c0 4.4-3.1 8.2-7.5 9.4-4.4-1.2-7.5-5-7.5-9.4v-5z" />
                  <polyline points="9 12 11.2 14.2 15.4 10" />
                </svg>
                <div>
                  <div className="text-[15px] font-bold mb-1">
                    Sesja siedzi w ciasteczku, nie w pamięci przeglądarki
                  </div>
                  <div className="text-[14px] leading-[1.65] text-[#55485A]">
                    HttpOnly, Secure, SameSite Lax. Skrypt na stronie nie ma do niej dostępu, więc
                    nie da się jej wykraść wstrzykniętym kodem.
                  </div>
                </div>
              </div>

              <div className="flex gap-3.5">
                <svg
                  aria-hidden="true"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5E7360"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 mt-0.5"
                >
                  <path d="M12 3l7.5 3.4v5c0 4.4-3.1 8.2-7.5 9.4-4.4-1.2-7.5-5-7.5-9.4v-5z" />
                  <polyline points="9 12 11.2 14.2 15.4 10" />
                </svg>
                <div>
                  <div className="text-[15px] font-bold mb-1">
                    Konta firmowe wymagają drugiego składnika
                  </div>
                  <div className="text-[14px] leading-[1.65] text-[#55485A]">
                    Za kontem firmy stoi pieniądz i dane klientów, dlatego sam login nie wystarcza.
                    Kod z aplikacji, nie SMS, bo numer da się przejąć.
                  </div>
                </div>
              </div>

              <div className="flex gap-3.5">
                <svg
                  aria-hidden="true"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5E7360"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 mt-0.5"
                >
                  <path d="M12 3l7.5 3.4v5c0 4.4-3.1 8.2-7.5 9.4-4.4-1.2-7.5-5-7.5-9.4v-5z" />
                  <polyline points="9 12 11.2 14.2 15.4 10" />
                </svg>
                <div>
                  <div className="text-[15px] font-bold mb-1">
                    Numer telefonu klienta jest niewidoczny do końca
                  </div>
                  <div className="text-[14px] leading-[1.65] text-[#55485A]">
                    Firma poznaje Twoje dane kontaktowe dopiero wtedy, gdy sam dodasz jej ofertę do
                    krótkiej listy. Wcześniej filtr maskuje numery i adresy w wiadomościach.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-[#E2D5CA] rounded-[20px] bg-white p-6.5 sm:p-7.5 flex flex-col sm:flex-row gap-8 shadow-sm">
            <div className="grow">
              <div className="text-[13px] font-bold tracking-wider uppercase text-[#55485A] mb-3">
                Rejestracja klienta
              </div>
              <p className="m-0 text-[15px] leading-[1.65] text-[#3E3344]">
                Adres e-mail, hasło, potwierdzenie z linku. Dwie minuty, bez numeru telefonu i bez
                karty.
              </p>
            </div>
            <span className="hidden sm:block w-[1px] bg-[#EFE5DD] shrink-0" />
            <div className="grow">
              <div className="text-[13px] font-bold tracking-wider uppercase text-[#55485A] mb-3">
                Rejestracja firmy
              </div>
              <p className="m-0 text-[15px] leading-[1.65] text-[#3E3344]">
                Dodatkowo NIP i nazwa z rejestru, potwierdzenie numeru telefonu oraz kod z
                aplikacji. Dopiero wtedy profil może przyjmować zapytania.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pozostałe stany tego ekranu */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-10 pb-16">
        <h2 className="m-0 mb-5 text-[14px] font-bold tracking-wider uppercase text-[#55485A]">
          Pozostałe stany tego ekranu
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* TOTP */}
          <div className="border border-[#D9CCC2] rounded-[18px] bg-white p-7 shadow-sm">
            <div className="font-fraunces font-medium text-[22px] mb-2">Kod z aplikacji</div>
            <p className="m-0 mb-5 text-[14px] leading-[1.6] text-[#6A5C70]">
              Drugi krok logowania firmy. Sześć cyfr z aplikacji uwierzytelniającej, ważne 30
              sekund.
            </p>
            <div className="flex gap-2 mb-4.5">
              {totpCode
                .map((val, i) => ({ val, klucz: `cyfra-${i}` }))
                .map(({ val, klucz }) => (
                  <span
                    key={klucz}
                    className={`w-11 sm:w-12 h-14 rounded-[10px] flex items-center justify-center font-fraunces text-[24px] font-medium ${
                      val
                        ? "border-[1.5px] border-[#241C2B] bg-white"
                        : "border-[1.5px] border-[#D9CCC2] bg-[#FAF8F6]"
                    }`}
                  >
                    {val}
                  </span>
                ))}
            </div>
            <p className="mt-3.5 mb-0 text-[13px] leading-[1.6] text-[#6A5C70]">
              Pięć błędnych prób wstrzymuje logowanie na kwadrans. Konto zostaje czynne, tylko ten
              adres musi odczekać.
            </p>
          </div>

          {/* Nowe hasło: objaśnienie, nie formularz. Prawdziwy formularz
              stoi pod /nowe-haslo i otwiera go link z wiadomości. */}
          <div className="border border-[#D9CCC2] rounded-[18px] bg-white p-7 shadow-sm">
            <div className="font-fraunces font-medium text-[22px] mb-2">Nowe hasło</div>
            <p className="m-0 text-[14px] leading-[1.6] text-[#6A5C70]">
              Link z maila jest jednorazowy i ważny godzinę. Hasło musi mieć najmniej dwanaście
              znaków. Nie wymagamy znaków specjalnych, długość liczy się bardziej. Formularz otworzy
              się po kliknięciu linku z wiadomości.
            </p>
          </div>

          {/* Failed attempt */}
          <div className="border border-[#D9CCC2] rounded-[18px] bg-white p-7 shadow-sm">
            <div className="font-fraunces font-medium text-[22px] mb-2">Nieudane logowanie</div>
            <p className="m-0 mb-4.5 text-[14px] leading-[1.6] text-[#6A5C70]">
              Komunikat jest celowo jednakowy dla złego hasła i nieistniejącego konta. Inaczej każdy
              mógłby sprawdzać, kto ma tu konto.
            </p>
            <div className="border border-[#D9CCC2] border-l-4 border-l-[#8A5405] rounded-[10px] bg-[#F2E9E2] p-4 mb-4.5">
              <div className="text-[15px] font-bold mb-1">Adres lub hasło nie pasują</div>
              <div className="text-[14px] leading-[1.6] text-[#55485A]">
                Sprawdź adres i spróbuj ponownie albo ustaw nowe hasło.
              </div>
            </div>
            <div className="flex flex-col gap-2.5 text-[14px] text-[#3E3344]">
              <div className="flex justify-between">
                <span>Próby z tego adresu</span>
                <strong className="font-bold">{demoAttemptCount} z 5</strong>
              </div>
              <div className="h-2 rounded-full bg-[#EFE5DD] overflow-hidden">
                <div
                  style={{ width: `${(demoAttemptCount / 5) * 100}%` }}
                  className="h-full bg-[#5E7360] transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

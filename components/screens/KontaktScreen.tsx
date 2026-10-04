"use client";

import { useActionState } from "react";
import { KomunikatFormularza } from "@/components/KomunikatFormularza";
import { wyslijKontakt, wyslijZgloszenie } from "@/lib/akcje/formularze";
import { STAN_POCZATKOWY, wartoscPola } from "@/lib/formularze";

export function KontaktScreen() {
  const [stanKontaktu, akcjaKontaktu] = useActionState(wyslijKontakt, STAN_POCZATKOWY);
  const [stanZgloszenia, akcjaZgloszenia] = useActionState(wyslijZgloszenie, STAN_POCZATKOWY);

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <section className="grow px-6 sm:px-12 md:px-[130px] pt-14 pb-16">
        <h1 className="m-0 mb-3 font-fraunces font-normal text-[36px] sm:text-[44px] tracking-tight">
          Kontakt
        </h1>
        <p className="m-0 mb-9 text-[17px] leading-[1.6] text-[#3E3344] max-w-[70ch]">
          Serwis prowadzi jedna osoba, więc odpowiedź przychodzi od człowieka, zwykle w ciągu
          jednego dnia roboczego. Nie mamy infolinii i nie udajemy, że mamy.
        </p>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main Contact Form */}
          <form
            action={akcjaKontaktu}
            className="grow w-full border border-[#D9CCC2] rounded-[20px] bg-white p-7 sm:p-8.5 shadow-sm"
          >
            <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">Napisz do nas</h2>

            <div className="flex flex-col sm:flex-row gap-4 mb-5">
              <div className="grow flex flex-col gap-2">
                <label htmlFor="k-temat" className="text-[14px] font-semibold text-[#3E3344]">
                  W jakiej sprawie
                </label>
                <input
                  id="k-temat"
                  name="k-temat"
                  defaultValue={wartoscPola(stanKontaktu, "k-temat")}
                  type="text"
                  className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
                />
              </div>
              <div className="grow flex flex-col gap-2">
                <label htmlFor="k-mail" className="text-[14px] font-semibold text-[#3E3344]">
                  Twój adres e-mail
                </label>
                <input
                  id="k-mail"
                  name="k-mail"
                  defaultValue={wartoscPola(stanKontaktu, "k-mail")}
                  type="email"
                  required
                  placeholder="twoj@email.pl"
                  className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-5.5">
              <label htmlFor="k-tresc" className="text-[14px] font-semibold text-[#3E3344]">
                Wiadomość
              </label>
              <textarea
                id="k-tresc"
                name="k-tresc"
                defaultValue={wartoscPola(stanKontaktu, "k-tresc")}
                rows={5}
                required
                placeholder="W czym możemy pomóc?"
                className="text-[16px] leading-[1.6] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-4 w-full box-border resize-none"
              />
            </div>

            <div className="mb-4">
              <KomunikatFormularza stan={stanKontaktu} />
            </div>

            <button
              type="submit"
              className="text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-8 py-4 cursor-pointer shadow-sm"
            >
              Wyślij wiadomość
            </button>
          </form>

          {/* Right Cards: Report + Service info */}
          <div className="w-full lg:w-[480px] shrink-0 flex flex-col gap-5">
            <form
              action={akcjaZgloszenia}
              className="border border-[#D9CCC2] rounded-[20px] bg-white p-7 sm:p-8 shadow-sm"
            >
              <h2 className="m-0 mb-4 font-fraunces font-medium text-[26px]">Zgłoś treść</h2>
              <p className="m-0 mb-5 text-[15px] leading-[1.7] text-[#3E3344]">
                Jeśli wpis jest nieprawdziwy, podszywa się pod cudzą firmę albo narusza prawo, zgłoś
                go tutaj. Każde zgłoszenie czyta człowiek, a zgłaszający dostaje odpowiedź z
                decyzją.
              </p>

              <div className="flex flex-col gap-4.5 mb-5.5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="z-adres" className="text-[14px] font-semibold text-[#3E3344]">
                    Adres zgłaszanej strony
                  </label>
                  <input
                    id="z-adres"
                    name="z-adres"
                    defaultValue={wartoscPola(stanZgloszenia, "z-adres")}
                    type="text"
                    className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="z-powod" className="text-[14px] font-semibold text-[#3E3344]">
                    Powód
                  </label>
                  <input
                    id="z-powod"
                    name="z-powod"
                    defaultValue={wartoscPola(stanZgloszenia, "z-powod")}
                    type="text"
                    className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
                  />
                </div>
              </div>

              <div className="mb-4">
                <KomunikatFormularza stan={stanZgloszenia} />
              </div>

              <button
                type="submit"
                className="text-[16px] font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] rounded-[12px] px-6.5 py-3.5 cursor-pointer hover:bg-[#241C2B] hover:text-white transition-colors"
              >
                Wyślij zgłoszenie
              </button>
            </form>

            <div className="border border-[#E2D5CA] rounded-[20px] bg-[#F2E9E2] p-7 sm:p-8">
              <div className="text-[16px] font-bold mb-3.5">Dane serwisu</div>
              <div className="text-[15px] leading-[1.9] text-[#3E3344]">
                <div className="font-semibold text-[17px]">Gościnnie</div>
                <div className="text-[#6A5C70]">
                  Adres do korespondencji oraz NIP i REGON uzupełnimy po rejestracji działalności.
                </div>
              </div>
              <p className="mt-4 mb-0 text-[13px] leading-[1.65] text-[#55485A]">
                Nie publikujemy numeru telefonu, dopóki nie będzie go kto odebrać. Numer, którego
                nikt nie odbiera, szkodzi bardziej niż jego brak.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

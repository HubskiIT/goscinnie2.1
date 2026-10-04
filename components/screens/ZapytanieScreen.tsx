"use client";

import type React from "react";
import { useState } from "react";
import { Footer } from "../Footer";
import { Header } from "../Header";
import type { ScreenProps } from "../types";

export function ZapytanieScreen({ navigate }: ScreenProps) {
  const [recipients, setRecipients] = useState<
    { id: number; name: string; loc: string; price: string; checked: boolean }[]
  >([
    { id: 1, name: "Dwór pod Lipami", loc: "Kobierzyce, 18 km", price: "od 180 zł", checked: true },
    {
      id: 2,
      name: "Sala Pod Kasztanem",
      loc: "Psie Pole, 7 km",
      price: "od 145 zł",
      checked: true,
    },
    {
      id: 3,
      name: "Folwark Zielona Brama",
      loc: "Siechnice, 14 km",
      price: "od 210 zł",
      checked: true,
    },
    {
      id: 4,
      name: "Restauracja Nad Odrą",
      loc: "Stare Miasto, 1 km",
      price: "od 120 zł",
      checked: false,
    },
  ]);

  const toggleRecipient = (id: number) => {
    setRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, checked: !r.checked } : r)));
  };

  const checkedCount = recipients.filter((r) => r.checked).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      `Zapytanie zostało pomyślnie wysłane do ${checkedCount} obiektów. Odpowiedzi otrzymasz w panelu wiadomości.`,
    );
    navigate("Wiadomosci");
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <Header currentScreen="Zapytanie" navigate={navigate} />

      <section className="grow px-6 sm:px-12 md:px-[130px] pt-12 flex flex-col lg:flex-row gap-11 items-start pb-16">
        <div className="grow w-full">
          <p className="m-0 mb-3.5 text-[14px] text-[#6A5C70]">
            <button
              type="button"
              onClick={() => navigate("Lokale")}
              className="text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
            >
              Sale i lokale
            </button>{" "}
            &nbsp;›&nbsp;{" "}
            <button
              type="button"
              onClick={() => navigate("Profil")}
              className="text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
            >
              Dwór pod Lipami
            </button>{" "}
            &nbsp;›&nbsp; Zapytanie
          </p>

          <h1 className="m-0 mb-2.5 font-fraunces font-normal text-[36px] sm:text-[44px] tracking-tight">
            Zapytaj o ofertę
          </h1>
          <p className="m-0 mb-8 text-[17px] leading-[1.6] text-[#3E3344] max-w-[64ch]">
            Jedno zapytanie możesz wysłać do pięciu miejsc naraz. Każde z nich odpowiada osobno i
            nie wie, do kogo jeszcze napisałeś.
          </p>

          <form
            onSubmit={handleSubmit}
            className="border border-[#D9CCC2] rounded-[20px] bg-white p-7 sm:p-8 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row gap-4 mb-5">
              <div className="grow flex flex-col gap-2">
                <label htmlFor="q-okazja" className="text-[14px] font-semibold text-[#3E3344]">
                  Okazja
                </label>
                <input
                  id="q-okazja"
                  type="text"
                  defaultValue="Komunia"
                  className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
                />
              </div>
              <div className="grow flex flex-col gap-2">
                <label htmlFor="q-data" className="text-[14px] font-semibold text-[#3E3344]">
                  Termin
                </label>
                <input
                  id="q-data"
                  type="text"
                  defaultValue="12.06.2027"
                  className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
                />
              </div>
              <div className="w-full sm:w-[160px] flex flex-col gap-2">
                <label htmlFor="q-osoby" className="text-[14px] font-semibold text-[#3E3344]">
                  Osób
                </label>
                <input
                  id="q-osoby"
                  type="text"
                  defaultValue="80"
                  className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-5">
              <label htmlFor="q-tresc" className="text-[14px] font-semibold text-[#3E3344]">
                Wiadomość
              </label>
              <textarea
                id="q-tresc"
                rows={4}
                defaultValue="Dzień dobry, czy mają Państwo wolny ten termin i czy sala jest wtedy na wyłączność? Interesuje nas też, czy można przynieść własny tort."
                className="text-[16px] leading-[1.7] text-[#241C2B] border-[1.5px] border-[#D9CCC2] rounded-[10px] p-4 w-full box-border"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="grow flex flex-col gap-2">
                <label htmlFor="q-imie" className="text-[14px] font-semibold text-[#3E3344]">
                  Imię
                </label>
                <input
                  id="q-imie"
                  type="text"
                  defaultValue="Anna"
                  className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
                />
              </div>
              <div className="grow flex flex-col gap-2">
                <label htmlFor="q-mail" className="text-[14px] font-semibold text-[#3E3344]">
                  Adres e-mail
                </label>
                <input
                  id="q-mail"
                  type="email"
                  defaultValue="anna.kowalska@example.com"
                  className="text-[16px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] p-3.5 w-full box-border"
                />
              </div>
            </div>

            <div className="border border-[#E2D5CA] rounded-[12px] bg-[#F2E9E2] p-4 sm:px-[18px] flex gap-3 mb-6">
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
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              <div className="text-[14px] leading-[1.65] text-[#55485A]">
                Numeru telefonu nie pytamy i nie potrzebujemy. Jeśli wpiszesz go w treści, zostanie
                zasłonięty do momentu, w którym sam dodasz tę firmę do krótkiej listy.
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-8 py-4 cursor-pointer shadow-sm"
              >
                Wyślij do {checkedCount}{" "}
                {checkedCount === 1 ? "miejsca" : checkedCount < 5 ? "miejsc" : "miejsc"}
              </button>
              <span className="text-[14px] text-[#6A5C70]">Za darmo i bez zobowiązań</span>
            </div>
          </form>
        </div>

        {/* Aside: Shortlist selection */}
        <aside className="w-full lg:w-[400px] shrink-0">
          <div className="border border-[#D9CCC2] rounded-[20px] bg-[#FBF7F4] p-6 shadow-sm">
            <div className="text-[16px] font-bold mb-1.5">Wyślij również do</div>
            <p className="m-0 mb-4 text-[14px] leading-[1.6] text-[#6A5C70]">
              Z Twojej krótkiej listy. Odznacz te, które mają nie dostać zapytania.
            </p>

            <div className="flex flex-col gap-2.5">
              {recipients.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => toggleRecipient(r.id)}
                  className={`text-left border rounded-[14px] bg-white p-3.5 px-4 flex items-center gap-3.5 cursor-pointer transition-all ${
                    r.checked ? "border-[#241C2B] shadow-sm" : "border-[#E2D5CA] opacity-60"
                  }`}
                >
                  <span
                    className={`w-[22px] h-[22px] rounded-[6px] text-[#FBF7F4] text-[13px] flex items-center justify-center shrink-0 ${
                      r.checked ? "bg-[#241C2B]" : "border-[1.5px] border-[#D9CCC2]"
                    }`}
                  >
                    {r.checked ? "✓" : ""}
                  </span>
                  <span className="w-[54px] h-[54px] rounded-[10px] bg-[#E4D9CF] shrink-0 flex items-center justify-center font-bold text-[#241C2B]">
                    {r.name.charAt(0)}
                  </span>
                  <div className="grow">
                    <div className="text-[15px] font-semibold">{r.name}</div>
                    <div className="text-[13px] text-[#6A5C70]">{r.loc}</div>
                  </div>
                  <div className="text-[15px] font-semibold shrink-0">{r.price}</div>
                </button>
              ))}
            </div>

            <p className="mt-4 mb-0 text-[13px] leading-[1.65] text-[#6A5C70]">
              Limit to pięć miejsc na jedno zapytanie. Więcej nie pomaga, a utrudnia porównanie
              odpowiedzi.
            </p>
          </div>
        </aside>
      </section>

      <Footer navigate={navigate} />
    </div>
  );
}

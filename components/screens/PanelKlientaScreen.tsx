"use client";

import { useState } from "react";
import { Header } from "../Header";
import type { ScreenProps } from "../types";

export function PanelKlientaScreen({ navigate, shortlist, toggleShortlist }: ScreenProps) {
  const [sortBy, setSortBy] = useState<"Najtaniej" | "Najbliżej" | "Najnowsze">("Najtaniej");
  const [isOrderClosed, setIsOrderClosed] = useState(false);

  const initialOffers = [
    {
      id: 1,
      name: "Dwór pod Lipami",
      loc: "Kobierzyce, 18 km od centrum",
      price: "14 400 zł",
      distKm: 18,
      priceNum: 14400,
      desc: "Mamy wolny ten termin. Sala na wyłączność, 180 zł od osoby w menu komunijnym, własny tort bez opłaty. Ogród i kąt do zabawy dla dzieci są w cenie.",
      contact: "71 000 00 00, biuro@example.pl",
      bgColor: "bg-[#E4D9CF]",
    },
    {
      id: 2,
      name: "Sala Pod Kasztanem",
      loc: "Psie Pole, 7 km od centrum",
      price: "11 600 zł",
      distKm: 7,
      priceNum: 11600,
      desc: "Termin wolny. 145 zł od osoby, w tym napoje bez limitu. Sali nie wynajmujemy na wyłączność przy grupie poniżej stu osób, ale drugie przyjęcie jest w osobnym skrzydle.",
      contact: "71 333 44 55, kasztan@example.pl",
      bgColor: "bg-[#DED4DC]",
    },
    {
      id: 3,
      name: "Folwark Zielona Brama",
      loc: "Siechnice, 14 km od centrum",
      price: "16 800 zł",
      distKm: 14,
      priceNum: 16800,
      desc: "Wolne. 210 zł od osoby, sala na wyłączność, ogród z placem zabaw. Może zainteresuje Państwa nocleg dla części gości, mamy 60 miejsc.",
      contact: "71 777 88 99, folwark@example.pl",
      bgColor: "bg-[#DCE0D8]",
    },
  ];

  const sortedOffers = [...initialOffers].sort((a, b) => {
    if (sortBy === "Najtaniej") return a.priceNum - b.priceNum;
    if (sortBy === "Najbliżej") return a.distKm - b.distKm;
    return b.id - a.id;
  });

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <Header currentScreen="PanelKlienta" navigate={navigate} variant="dashboard-client" />

      <section className="grow px-6 sm:px-12 md:px-[60px] pt-10 pb-16 flex flex-col lg:flex-row gap-7.5 items-start">
        <div className="grow w-full">
          <h1 className="m-0 mb-2 font-fraunces font-normal text-[32px] sm:text-[40px] tracking-tight">
            Komunia, 80 osób, 12 czerwca 2027
          </h1>
          <p className="m-0 mb-6.5 text-[15px] text-[#6A5C70]">
            {isOrderClosed ? (
              <span className="text-[#8B7F91] font-semibold">Zlecenie zamknięte</span>
            ) : (
              "Zlecenie otwarte, zamknie się za 4 dni"
            )}{" "}
            &nbsp;·&nbsp; <strong className="text-[#241C2B] font-semibold">5 ofert</strong>{" "}
            &nbsp;·&nbsp;{" "}
            <button
              type="button"
              onClick={() => navigate("NoweZlecenie")}
              className="text-[#8A5405] hover:text-[#241C2B] underline bg-transparent border-0 cursor-pointer p-0"
            >
              edytuj zlecenie
            </button>
          </p>

          {/* Sort pills */}
          <div className="flex items-center gap-3 mb-5.5">
            <span className="text-[14px] text-[#6A5C70]">Sortuj:</span>
            {(["Najtaniej", "Najbliżej", "Najnowsze"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSortBy(s)}
                className={`text-[14px] rounded-full px-4 py-2 cursor-pointer transition-colors ${
                  sortBy === s
                    ? "font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] shadow-xs"
                    : "text-[#3E3344] bg-white border border-[#D9CCC2] hover:border-[#241C2B]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Offers list */}
          <div className="flex flex-col gap-4">
            {sortedOffers.map((offer) => {
              const inShortlist = shortlist.includes(offer.name);
              return (
                <article
                  key={offer.id}
                  className="border border-[#E2D5CA] rounded-[18px] bg-white p-5.5 sm:p-6 shadow-sm"
                >
                  <div className="flex items-start gap-4 mb-3.5">
                    <span
                      className={`w-14 h-14 rounded-[12px] shrink-0 ${offer.bgColor} flex items-center justify-center font-bold text-[#241C2B]`}
                    >
                      {offer.name.charAt(0)}
                    </span>
                    <div className="grow">
                      <div className="font-fraunces font-medium text-[20px]">{offer.name}</div>
                      <div className="text-[14px] text-[#6A5C70]">{offer.loc}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-fraunces text-[24px] font-medium">{offer.price}</div>
                      <div className="text-[13px] text-[#6A5C70]">za całość</div>
                    </div>
                  </div>

                  <p className="m-0 text-[15px] leading-[1.7] text-[#3E3344]">{offer.desc}</p>

                  <div className="mt-3.5 pt-3.5 border-t border-[#EFE5DD] text-[14px] text-[#3E3344]">
                    {inShortlist ? (
                      <span className="font-medium text-[#241C2B]">
                        ✓ Kontakt odblokowany: {offer.contact}
                      </span>
                    ) : (
                      <span className="text-[#6A5C70]">
                        Dane kontaktowe pokażą się, gdy dodasz tę ofertę do krótkiej listy.
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3.5">
                    {inShortlist ? (
                      <span className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3 py-1.5 font-semibold">
                        ✓ na krótkiej liście
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleShortlist(offer.name)}
                        className="text-[14px] font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] rounded-[10px] px-4 py-2 cursor-pointer hover:bg-[#241C2B] hover:text-white transition-colors"
                      >
                        Dodaj do krótkiej listy
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate("Wiadomosci")}
                      className="text-[15px] font-semibold text-[#241C2B] hover:text-[#8A5405] bg-transparent border-0 border-b border-[#D9CCC2] pb-0.5 cursor-pointer"
                    >
                      Napisz wiadomość
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Aside: Shortlist & Close */}
        <aside className="w-full lg:w-[360px] shrink-0 flex flex-col gap-4.5">
          <div className="border border-[#D9CCC2] rounded-[18px] bg-white p-6 shadow-sm">
            <div className="text-[16px] font-bold mb-3">Krótka lista ({shortlist.length})</div>
            <p className="m-0 mb-4 text-[14px] leading-[1.65] text-[#6A5C70]">
              Firma poznaje Twoje imię, adres i numer dopiero po dodaniu jej tutaj. To jedyny
              moment, w którym dane kontaktowe się otwierają, i decydujesz o nim Ty.
            </p>

            {shortlist.map((name) => (
              <div key={name} className="flex items-center gap-3 py-3 border-t border-[#EFE5DD]">
                <span className="w-10 h-10 rounded-[10px] bg-[#E4D9CF] shrink-0 flex items-center justify-center font-bold text-[#241C2B]">
                  {name.charAt(0)}
                </span>
                <span className="text-[15px] font-semibold grow">{name}</span>
                <button
                  type="button"
                  onClick={() => toggleShortlist(name)}
                  className="text-[14px] text-[#6A5C70] hover:text-red-700 bg-transparent border-0 cursor-pointer"
                >
                  Usuń
                </button>
              </div>
            ))}

            {Array.from(
              { length: Math.max(0, 5 - shortlist.length) },
              (_, i) => `miejsce-${i}`,
            ).map((klucz) => (
              <div
                key={klucz}
                className="flex items-center gap-3 py-3 border-t border-[#EFE5DD] text-[#8B7F91] text-[14px]"
              >
                <span className="w-10 h-10 rounded-[10px] border border-dashed border-[#D9CCC2] shrink-0" />
                Możesz dodać jeszcze {5 - shortlist.length}
              </div>
            ))}
          </div>

          <div className="border border-[#E2D5CA] rounded-[18px] bg-[#F2E9E2] p-6">
            <div className="text-[16px] font-bold mb-2">Gdy wybierzesz</div>
            <p className="m-0 mb-4 text-[14px] leading-[1.7] text-[#55485A]">
              Zamknij zlecenie, żeby pozostałe firmy przestały czekać na odpowiedź. Oferty zostają w
              Twoim koncie, nic nie znika.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsOrderClosed(true);
                alert(
                  "Zlecenie zostało pomyślnie zamknięte. Pozostałe firmy otrzymały powiadomienie.",
                );
              }}
              className="text-[15px] font-semibold text-[#241C2B] bg-white border-[1.5px] border-[#241C2B] rounded-[10px] p-3 cursor-pointer w-full hover:bg-[#241C2B] hover:text-white transition-colors"
            >
              {isOrderClosed ? "Zlecenie jest zamknięte" : "Zamknij zlecenie"}
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { ScreenProps } from '../types';
import { Header } from '../Header';
import { Footer } from '../Footer';

export function ZleceniaScreen({ navigate }: ScreenProps) {
  const [isSubscriber, setIsSubscriber] = useState(true);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState('14 400 zł');
  const [offerScope, setOfferScope] = useState('Menu komunijne 180 zł/osobę, sala balowa na wyłączność, ogród z placem zabaw, własny tort bez opłaty.');
  const [offerSubmitted, setOfferSubmitted] = useState(false);

  const handleSendOffer = (e: React.FormEvent) => {
    e.preventDefault();
    setOfferSubmitted(true);
    setTimeout(() => {
      setOfferModalOpen(false);
    }, 1800);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <Header currentScreen="Zlecenia" navigate={navigate} />

      {/* Role Toggle Bar */}
      <div className="bg-[#F2E9E2] border-b border-[#E2D5CA] px-6 sm:px-12 md:px-[130px] py-2.5 flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <div className="flex items-center gap-2 text-[#55485A]">
          <span className="font-semibold text-[#241C2B]">Tryb podglądu giełdy:</span>
          <span>Przełącz, aby zobaczyć ekran z perspektywy abonenta lub gościa</span>
        </div>
        <div className="inline-flex p-1 bg-white rounded-[10px] border border-[#D9CCC2]">
          <button
            type="button"
            onClick={() => setIsSubscriber(true)}
            className={`px-3 py-1 rounded-[8px] font-semibold cursor-pointer transition-colors ${
              isSubscriber ? 'bg-[#241C2B] text-white shadow-2xs' : 'text-[#6A5C70] hover:text-[#241C2B]'
            }`}
          >
            Firma z abonamentem (Pełny)
          </button>
          <button
            type="button"
            onClick={() => setIsSubscriber(false)}
            className={`px-3 py-1 rounded-[8px] font-semibold cursor-pointer transition-colors ${
              !isSubscriber ? 'bg-[#241C2B] text-white shadow-2xs' : 'text-[#6A5C70] hover:text-[#241C2B]'
            }`}
          >
            Firma bez abonamentu (Gość)
          </button>
        </div>
      </div>

      {/* Title */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10">
          <div>
            <h1 className="m-0 mb-3 font-fraunces font-normal text-[36px] sm:text-[44px] md:text-[48px] tracking-tight">
              Giełda zleceń
            </h1>
            <p className="m-0 text-[17px] leading-[1.6] text-[#3E3344] max-w-[70ch]">
              Klient opisuje raz, czego szuka. Firmy odpowiadają ceną. Zlecenia są anonimowe do momentu, w którym
              klient sam doda ofertę do krótkiej listy.
            </p>
          </div>
          <div className="shrink-0 text-left md:text-right">
            <div className="font-fraunces text-[34px] font-medium">46 otwartych</div>
            <div className="text-[14px] text-[#6A5C70]">w Twoich kategoriach</div>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <section className="shrink-0 px-6 sm:px-12 md:px-[130px] pt-7">
        <div className="border-[1.5px] border-[#D9CCC2] rounded-[16px] bg-white flex flex-col lg:flex-row items-stretch overflow-hidden shadow-2xs">
          <div className="grow flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Kategoria</span>
            <span className="flex items-center justify-between text-[15px] font-semibold text-[#241C2B]">
              Sale weselne i okolicznościowe
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6A5C70" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="5 9 12 16 19 9" />
              </svg>
            </span>
          </div>

          <div className="grow flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Województwo / powiat</span>
            <span className="flex items-center justify-between text-[15px] font-semibold text-[#241C2B]">
              dolnośląskie (powiat wrocławski)
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6A5C70" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="5 9 12 16 19 9" />
              </svg>
            </span>
          </div>

          <div className="grow flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Okazja</span>
            <span className="flex items-center justify-between text-[15px] font-semibold text-[#241C2B]">
              Wszystkie uroczystości
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6A5C70" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="5 9 12 16 19 9" />
              </svg>
            </span>
          </div>

          <div className="grow flex flex-col justify-center gap-1 px-5 py-3 border-b lg:border-b-0 lg:border-r border-[#EFE5DD]">
            <span className="text-[12px] text-[#6A5C70]">Termin</span>
            <span className="flex items-center justify-between text-[15px] font-semibold text-[#241C2B]">
              Czerwiec – Wrzesień 2027
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6A5C70" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="5 9 12 16 19 9" />
              </svg>
            </span>
          </div>

          <button
            type="button"
            className="p-4 px-6 bg-[#241C2B] text-[#FBF7F4] font-semibold text-[15px] cursor-pointer hover:bg-[#3E3344] transition-colors border-0"
          >
            Filtruj
          </button>
        </div>
      </section>

      {/* Listing and Aside */}
      <section className="grow px-6 sm:px-12 md:px-[130px] pt-7 flex flex-col lg:flex-row gap-[34px] items-start pb-16">
        <div className="grow w-full flex flex-col gap-[18px]">
          {/* Order 1: Primary Target */}
          <article className="border border-[#E2D5CA] rounded-[18px] bg-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-start justify-between gap-5 mb-5">
              <h3 className="m-0 font-fraunces font-medium text-[23px]">Komunia, 80 osób, powiat wrocławski</h3>
              <span className="shrink-0 text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3 py-1.5 font-semibold">
                zamyka się za 4 dni
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-4 border-y border-[#EFE5DD] mb-5">
              <div>
                <div className="text-[12px] text-[#6A5C70] mb-1">Okazja</div>
                <div className="text-[15px] font-semibold">Komunia</div>
              </div>
              <div>
                <div className="text-[12px] text-[#6A5C70] mb-1">Data wydarzenia</div>
                <div className="text-[15px] font-semibold">12.06.2027</div>
              </div>
              <div>
                <div className="text-[12px] text-[#6A5C70] mb-1">Liczba osób</div>
                <div className="text-[15px] font-semibold">80</div>
              </div>
              <div>
                <div className="text-[12px] text-[#6A5C70] mb-1">Lokalizacja</div>
                <div className="text-[15px] font-semibold">powiat wrocławski + 25 km</div>
              </div>
              <div>
                <div className="text-[12px] text-[#6A5C70] mb-1">Budżet klienta</div>
                {isSubscriber ? (
                  <div className="text-[15px] font-bold text-[#3F5142]">do 18 000 zł</div>
                ) : (
                  <div className="text-[13px] text-[#8B7F91] font-semibold italic">w abonamencie (402)</div>
                )}
              </div>
            </div>

            {isSubscriber ? (
              <>
                <p className="m-0 mb-5 text-[16px] leading-[1.7] text-[#3E3344] max-w-[78ch]">
                  Szukamy sali na komunię córki. Osiemdziesięciu gości, w tym dwadzieścioro dzieci, więc przydałby się kąt do
                  zabawy albo ogród. Zależy nam na sali na wyłączność i na własnym torcie bez opłaty. Początek około
                  trzynastej, planujemy do dwudziestej.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  {offerSubmitted ? (
                    <span className="text-[15px] font-bold text-[#3F5142] bg-[#E7EDE7] rounded-[10px] px-5 py-3">
                      ✓ Twoja oferta została wysłana ({offerPrice})
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOfferModalOpen(true)}
                      className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-7 py-3.5 cursor-pointer shadow-xs"
                    >
                      Złóż ofertę
                    </button>
                  )}
                  <span className="text-[13px] text-[#6A5C70]">
                    Jedna oferta na zlecenie. Konkurencja nie widzi Twojej ceny.
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="relative mb-5">
                  <p className="m-0 text-[16px] leading-[1.7] text-[#3E3344] max-w-[78ch] select-none">
                    Szukamy sali na komunię córki. Osiemdziesięciu gości, w tym dwadzieścioro dzieci, więc przydałby się kąt do...
                  </p>
                  <div className="absolute inset-x-0 -bottom-1 h-10 bg-gradient-to-b from-transparent to-white" />
                </div>

                <div className="border border-[#E2D5CA] rounded-[14px] bg-[#F2E9E2] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-[15px] font-bold text-[#241C2B] mb-1">Widzisz 120 znaków z 380</div>
                    <div className="text-[13px] text-[#55485A]">
                      Pełny opis, budżet i prawo złożenia oferty są dostępne dla firm z aktywnym abonamentem.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('Cennik')}
                    className="shrink-0 text-[14px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors rounded-[10px] px-5 py-2.5 border-0 cursor-pointer shadow-2xs"
                  >
                    Odblokuj w abonamencie (Cennik)
                  </button>
                </div>
              </>
            )}
          </article>

          {/* Order 2: Wesele */}
          <article className="border border-[#E2D5CA] rounded-[18px] bg-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-start justify-between gap-5 mb-5">
              <h3 className="m-0 font-fraunces font-medium text-[23px]">Wesele, 130 osób, powiat oławski</h3>
              <span className="shrink-0 text-[13px] text-[#55485A] bg-[#F2E9E2] rounded-[8px] px-3 py-1.5 font-medium">
                otwarte 2 dni temu
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-4 border-y border-[#EFE5DD] mb-5">
              <div>
                <div className="text-[12px] text-[#6A5C70] mb-1">Okazja</div>
                <div className="text-[15px] font-semibold">Wesele</div>
              </div>
              <div>
                <div className="text-[12px] text-[#6A5C70] mb-1">Data wydarzenia</div>
                <div className="text-[15px] font-semibold">04.09.2027</div>
              </div>
              <div>
                <div className="text-[12px] text-[#6A5C70] mb-1">Liczba osób</div>
                <div className="text-[15px] font-semibold">130</div>
              </div>
              <div>
                <div className="text-[12px] text-[#6A5C70] mb-1">Lokalizacja</div>
                <div className="text-[15px] font-semibold">powiat oławski + 30 km</div>
              </div>
              <div>
                <div className="text-[12px] text-[#6A5C70] mb-1">Budżet</div>
                <div className="text-[15px] font-bold text-[#3F5142]">45 000 – 60 000 zł</div>
              </div>
            </div>

            <p className="m-0 mb-5 text-[16px] leading-[1.7] text-[#3E3344] max-w-[78ch]">
              Planujemy wesele na początek września 2027. Zależy nam na pięknej sali z klimatem, możliwością zorganizowania
              zaślubin w plenerze oraz noclegach dla około 50 gości przyjezdnych.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setOfferModalOpen(true)}
                className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-7 py-3.5 cursor-pointer shadow-xs"
              >
                Złóż ofertę
              </button>
              <span className="text-[13px] text-[#6A5C70]">
                Maksymalnie 10 ofert na zlecenie.
              </span>
            </div>
          </article>

          {/* Order 3: Already submitted */}
          <article className="border border-[#E2D5CA] rounded-[18px] bg-white p-5 sm:px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="grow">
              <h3 className="m-0 mb-1 font-fraunces font-medium text-[20px]">Chrzciny, 45 osób, Wrocław</h3>
              <p className="m-0 text-[14px] text-[#6A5C70]">16.05.2027 &nbsp;·&nbsp; Wrocław &nbsp;·&nbsp; Twoja oferta została złożona</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-[13px] font-semibold text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3.5 py-2">
                ✓ Oferta złożona
              </span>
              <button
                type="button"
                onClick={() => navigate('PanelKlienta')}
                className="shrink-0 text-[14px] font-semibold text-[#241C2B] border border-[#241C2B] rounded-[8px] px-4 py-2 hover:bg-[#241C2B] hover:text-white transition-colors cursor-pointer bg-transparent"
              >
                Podejrzyj
              </button>
            </div>
          </article>
        </div>

        {/* Aside: Information for Vendors */}
        <aside className="w-full lg:w-[360px] shrink-0 sticky top-6 space-y-5">
          <div className="border border-[#E2D5CA] rounded-[18px] bg-white p-6 shadow-xs">
            <h3 className="font-fraunces text-[20px] font-medium mb-3">Zasady anonimowej giełdy</h3>
            <ul className="text-[14px] text-[#3E3344] leading-[1.6] space-y-2.5 pl-4 m-0 mb-5">
              <li>Klient opisuje wydarzenie raz, bez dzwonienia po 20 numerach.</li>
              <li>Firmy nie widzą wzajemnie swoich cen ani liczby zgłoszeń.</li>
              <li>Limit 10 ofert na jedno zlecenie — zyskują najszybsi.</li>
              <li>Dane kontaktowe klienta odblokowują się, gdy doda Cię do krótkiej listy.</li>
            </ul>
            <div className="border-t border-[#EFE5DD] pt-4">
              <div className="text-[13px] font-bold text-[#6A5C70] mb-1 uppercase tracking-wider">
                Czas powiadomień według planu:
              </div>
              <div className="text-[13px] text-[#3E3344] space-y-1">
                <div>Wyróżniony: <strong>natychmiast (0 min)</strong></div>
                <div>Pełny: <strong>po 15 minutach</strong></div>
                <div>Start: <strong>po 60 minutach</strong></div>
              </div>
            </div>
          </div>

          <div className="border border-[#E2D5CA] rounded-[18px] bg-[#FAF6F2] p-6 shadow-2xs">
            <h4 className="font-fraunces text-[18px] font-medium mb-2">Sam szukasz wykonawcy?</h4>
            <p className="text-[14px] text-[#55485A] leading-[1.5] mb-4">
              Jako właściciel lokalu możesz potrzebować DJ-a, fotografa lub dekoratora na własne wydarzenie.
            </p>
            <button
              onClick={() => navigate('NoweZlecenie')}
              className="w-full text-center text-[14px] font-bold text-[#241C2B] bg-white border border-[#241C2B] hover:bg-[#241C2B] hover:text-white transition-colors rounded-[10px] py-2.5 cursor-pointer"
            >
              Wystaw zlecenie bezpłatnie →
            </button>
          </div>
        </aside>
      </section>

      {/* Interactive Modal: Złóż ofertę */}
      {offerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#E2D5CA] max-w-[560px] w-full p-7 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setOfferModalOpen(false)}
              className="absolute top-5 right-5 text-[20px] text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer"
            >
              ✕
            </button>

            <span className="text-[12px] font-bold tracking-wider uppercase text-[#5E7360] bg-[#E7EDE7] px-3 py-1 rounded-full mb-2 inline-block">
              Zlecenie: Komunia, 80 osób (powiat wrocławski)
            </span>

            <h2 className="font-fraunces text-[26px] font-medium mb-2">
              Złóż ofertę swojemu klientowi
            </h2>
            <p className="text-[14px] text-[#6A5C70] mb-5">
              Klient widzi wszystkie oferty obok siebie. Żadna inna firma nie zobaczy Twojej ceny.
            </p>

            {offerSubmitted ? (
              <div className="text-center py-8">
                <span className="w-14 h-14 rounded-full bg-[#E7EDE7] text-[#5E7360] text-2xl font-bold flex items-center justify-center mx-auto mb-3">
                  ✓
                </span>
                <h3 className="font-fraunces text-[22px] font-medium mb-2">Oferta została przekazana!</h3>
                <p className="text-[14px] text-[#6A5C70]">
                  Gdy klient doda Twoją ofertę do krótkiej listy, otrzymasz powiadomienie z danymi kontaktowymi.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendOffer} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#6A5C70] uppercase mb-1">
                    Cena łączna brutto za całe zamówienie
                  </label>
                  <input
                    type="text"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    required
                    className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[16px] font-semibold text-[#241C2B] outline-none focus:border-[#241C2B]"
                  />
                  <span className="text-[12px] text-[#8B7F91]">Budżet klienta wynosi: do 18 000 zł</span>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#6A5C70] uppercase mb-1">
                    Zakres oferty i co zawiera cena
                  </label>
                  <textarea
                    rows={3}
                    value={offerScope}
                    onChange={(e) => setOfferScope(e.target.value)}
                    required
                    className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[14px] text-[#241C2B] outline-none focus:border-[#241C2B]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#6A5C70] uppercase mb-1">
                    Termin ważności oferty
                  </label>
                  <select className="w-full border border-[#D9CCC2] rounded-[10px] p-3 text-[14px] text-[#241C2B] outline-none focus:border-[#241C2B] bg-white">
                    <option>Ważna przez 14 dni</option>
                    <option>Ważna przez 7 dni</option>
                    <option>Ważna przez 30 dni</option>
                  </select>
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="submit"
                    className="grow text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] p-3.5 cursor-pointer shadow-xs text-center"
                  >
                    Wyślij ofertę do klienta
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferModalOpen(false)}
                    className="text-[14px] text-[#6A5C70] hover:text-[#241C2B] border border-[#D9CCC2] rounded-[12px] px-5 py-3.5 bg-transparent cursor-pointer"
                  >
                    Anuluj
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer navigate={navigate} />
    </div>
  );
}

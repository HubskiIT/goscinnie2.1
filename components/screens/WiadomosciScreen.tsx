"use client";

import { useState } from "react";
import { pobierzLokale } from "@/content/ogloszenia";

const ROZMOWY = pobierzLokale()
  .filter((lokal) => lokal.status === "active")
  .map((lokal) => ({ nazwa: lokal.nazwa }));

const PIERWSZA_ROZMOWA = ROZMOWY[0]?.nazwa ?? "";

export function WiadomosciScreen() {
  const [selectedChat, setSelectedChat] = useState(PIERWSZA_ROZMOWA);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "me",
      text: "Dzień dobry, czy mają Państwo wolny 12 czerwca i czy sala jest wtedy na wyłączność?",
      time: "24 października, 11:02",
    },
    {
      id: 2,
      sender: "them",
      text: "Dzień dobry, termin jest wolny. Sala jest na wyłączność przy grupie powyżej sześćdziesięciu osób, więc u Państwa tak. Własny tort bez opłaty.",
      time: "24 października, 13:41",
    },
    {
      id: 3,
      sender: "me",
      text: "Świetnie. Proszę o kontakt pod numerem ███ ███ ███, będzie szybciej.",
      time: "24 października, 14:05",
      warning:
        "Numer został zasłonięty, bo tej firmy nie ma jeszcze na Twojej krótkiej liście. Wiadomość doszła w całości, bez numeru.",
    },
    {
      id: 4,
      sender: "them",
      text: "Potwierdzamy termin, czekamy na decyzję. Telefon widzimy już po dodaniu nas do krótkiej listy, dziękujemy.",
      time: "dzisiaj, 14:20",
    },
  ]);
  const [inputVal, setInputVal] = useState(
    "Dziękuję, rezerwujemy. Odezwę się jutro w sprawie menu.",
  );

  const handleSend = () => {
    if (!inputVal.trim()) return;

    // Check if user is typing phone number pattern to demonstrate live masking!
    const phoneRegex = /\b\d{3}[- ]?\d{3}[- ]?\d{3}\b/g;
    let textToSend = inputVal;
    let warning: string | undefined;

    if (phoneRegex.test(inputVal)) {
      textToSend = inputVal.replace(phoneRegex, "███ ███ ███");
      warning = "Numer został automatycznie zamaskowany zgodnie z polityką prywatności serwisu.";
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "me",
        text: textToSend,
        time: "teraz",
        ...(warning === undefined ? {} : { warning }),
      },
    ]);
    setInputVal("");
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <section className="grow px-6 sm:px-12 md:px-[60px] pt-8 pb-12 flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left conversations list */}
        <div className="w-full lg:w-[360px] shrink-0 border border-[#E2D5CA] rounded-[18px] bg-white overflow-hidden shadow-sm flex flex-col">
          <div className="p-4.5 px-5 border-b border-[#E2D5CA] text-[16px] font-bold">Rozmowy</div>

          {ROZMOWY.map((rozmowa) => (
            <button
              key={rozmowa.nazwa}
              type="button"
              onClick={() => setSelectedChat(rozmowa.nazwa)}
              className={`text-left flex gap-3.5 p-4 px-4.5 cursor-pointer transition-colors border-b border-[#EFE5DD] ${
                selectedChat === rozmowa.nazwa
                  ? "bg-[#F2E9E2] border-l-4 border-l-[#241C2B]"
                  : "bg-transparent border-l-4 border-l-transparent hover:bg-[#FAF8F6]"
              }`}
            >
              <span className="w-10.5 h-10.5 rounded-[10px] bg-[#E4D9CF] shrink-0 flex items-center justify-center font-bold text-[#241C2B]">
                {rozmowa.nazwa.charAt(0)}
              </span>
              <div className="grow min-w-0">
                <span className="text-[15px] font-semibold truncate block">{rozmowa.nazwa}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Right chat message thread */}
        <div className="grow border border-[#E2D5CA] rounded-[18px] bg-[#FBF7F4] flex flex-col overflow-hidden shadow-sm">
          {/* Thread Header */}
          <div className="p-4.5 px-6.5 bg-white border-b border-[#E2D5CA] flex items-center gap-3.5">
            <span className="w-10 h-10 rounded-[10px] bg-[#E4D9CF] shrink-0 flex items-center justify-center font-bold text-[#241C2B]">
              {selectedChat.charAt(0)}
            </span>
            <div className="grow">
              <div className="text-[16px] font-bold">{selectedChat}</div>
              <div className="text-[13px] text-[#6A5C70]">Komunia, 12.06.2027, 80 osób</div>
            </div>
            <span className="text-[13px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-3 py-1.5 font-semibold">
              na krótkiej liście
            </span>
          </div>

          {/* Messages Body */}
          <div className="grow p-6 sm:p-7.5 flex flex-col overflow-y-auto max-h-[520px]">
            {messages.map((m) => {
              if (m.sender === "me") {
                return (
                  <div key={m.id} className="max-w-[85%] sm:max-w-[62%] ml-auto mb-4">
                    <div className="bg-[#241C2B] text-[#FBF7F4] rounded-[16px] rounded-br-[4px] p-4 text-[15px] leading-[1.65] shadow-xs">
                      <div>{m.text}</div>
                      {m.warning && (
                        <div className="mt-2.5 pt-2.5 border-t border-[#9A8CA0]/40 text-[13px] leading-[1.55] opacity-85 text-[#EADFD6]">
                          {m.warning}
                        </div>
                      )}
                    </div>
                    <div className="text-[12px] text-right text-[#6A5C70] mt-1.5 mr-0.5">
                      {m.time}
                    </div>
                  </div>
                );
              }

              return (
                <div key={m.id} className="max-w-[85%] sm:max-w-[62%] mr-auto mb-4">
                  <div className="bg-white border border-[#E2D5CA] text-[#241C2B] rounded-[16px] rounded-bl-[4px] p-4 text-[15px] leading-[1.65] shadow-xs">
                    <div>{m.text}</div>
                  </div>
                  <div className="text-[12px] text-[#6A5C70] mt-1.5 ml-0.5">{m.time}</div>
                </div>
              );
            })}
          </div>

          {/* Input Box */}
          <div className="p-5 px-7 bg-white border-t border-[#E2D5CA]">
            <div className="flex flex-col sm:flex-row gap-3.5 sm:items-end">
              <div className="grow flex flex-col gap-2">
                <label htmlFor="w-tresc-input" className="text-[13px] text-[#6A5C70]">
                  Twoja wiadomość
                </label>
                <textarea
                  id="w-tresc-input"
                  rows={2}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="text-[15px] leading-[1.6] text-[#241C2B] border-[1.5px] border-[#D9CCC2] rounded-[12px] p-3.5 bg-white resize-none focus:outline-none"
                  placeholder="Wpisz treść wiadomości..."
                />
              </div>

              <button
                type="button"
                onClick={handleSend}
                className="text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors border-0 rounded-[12px] px-7 py-4 cursor-pointer shrink-0 shadow-sm"
              >
                Wyślij
              </button>
            </div>
            <p className="mt-3 mb-0 text-[13px] leading-[1.6] text-[#6A5C70]">
              Numery telefonów, adresy e-mail i odnośniki są zasłaniane po obu stronach do momentu
              dodania firmy do krótkiej listy. Wiadomość zawsze dochodzi, zasłaniany jest sam
              kontakt.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

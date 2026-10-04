"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MobileSidebar } from "./MobileSidebar";

interface HeaderProps {
  variant?: "public" | "dashboard-firm" | "dashboard-client" | "simple";
}

function wariantZeSciezki(sciezka: string): NonNullable<HeaderProps["variant"]> {
  if (sciezka.startsWith("/panel")) return "dashboard-firm";
  if (sciezka === "/moje" || sciezka === "/wiadomosci") return "dashboard-client";
  if (sciezka === "/logowanie") return "simple";
  return "public";
}

export function Header({ variant }: HeaderProps) {
  const sciezka = usePathname();
  const uzytyWariant = variant ?? wariantZeSciezki(sciezka);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (uzytyWariant === "simple") {
    return (
      <>
        <header className="h-[84px] shrink-0 box-border px-6 sm:px-8 md:px-[130px] flex items-center justify-between border-b border-[#EADFD6] bg-[#FBF7F4]">
          <Link
            href="/"
            className="font-fraunces text-[25px] sm:text-[27px] font-semibold text-[#241C2B] tracking-tight bg-transparent border-0 cursor-pointer p-0"
          >
            Gościnnie
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-[15px] text-[#4A3D50] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer hidden sm:inline"
            >
              Wróć na stronę główną
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-full border border-[#D9CCC2] bg-white text-[#241C2B] hover:bg-[#F2E9E2] transition-colors cursor-pointer"
              aria-label="Wysuń pasek boczny"
            >
              <Menu className="w-5 h-5 text-[#241C2B]" />
              <span className="text-[13px] font-bold">Menu</span>
            </button>
          </div>
        </header>

        {/* Floating mobile drawer button for quick access on small screens */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden fixed bottom-20 right-4 z-40 bg-[#241C2B] hover:bg-[#3E3344] text-white shadow-xl rounded-full pl-3.5 pr-4 py-2.5 flex items-center gap-2 border border-[#4A3D50] cursor-pointer transition-transform active:scale-95"
          aria-label="Wysuń pasek boczny"
        >
          <Menu className="w-4 h-4 text-[#F0A62E]" />
          <span className="text-[13px] font-bold">Menu</span>
        </button>

        <MobileSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          variant={uzytyWariant}
        />
      </>
    );
  }

  if (uzytyWariant === "dashboard-firm") {
    return (
      <>
        <header className="h-[84px] shrink-0 box-border px-4 sm:px-6 md:px-[60px] flex items-center justify-between gap-4 md:gap-11 border-b border-[#EADFD6] bg-white">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-fraunces text-[23px] sm:text-[25px] font-semibold text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
            >
              Gościnnie
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-[#E7EDE7] text-[#3F5142] text-[12px] font-bold">
              Panel firmy
            </span>
          </div>

          <nav className="hidden lg:flex gap-4 md:gap-7 grow items-center overflow-x-auto py-2">
            <Link
              href="/panel"
              className={`text-[15px] cursor-pointer bg-transparent border-0 pb-1 whitespace-nowrap ${
                sciezka.startsWith("/panel")
                  ? "text-[#241C2B] font-bold border-b-2 border-[#241C2B]"
                  : "text-[#4A3D50] hover:text-[#241C2B]"
              }`}
            >
              Pulpit
            </Link>
            <Link
              href="/f/dwor-pod-lipami"
              className={`text-[15px] cursor-pointer bg-transparent border-0 pb-1 whitespace-nowrap ${
                sciezka.startsWith("/f/")
                  ? "text-[#241C2B] font-bold border-b-2 border-[#241C2B]"
                  : "text-[#4A3D50] hover:text-[#241C2B]"
              }`}
            >
              Profil
            </Link>
            <Link
              href="/panel"
              className="text-[15px] text-[#4A3D50] hover:text-[#241C2B] cursor-pointer bg-transparent border-0 pb-1 whitespace-nowrap"
            >
              Kalendarz
            </Link>
            <Link
              href="/zlecenia"
              className="text-[15px] text-[#4A3D50] hover:text-[#241C2B] cursor-pointer bg-transparent border-0 pb-1 whitespace-nowrap"
            >
              Zlecenia
            </Link>
            <Link
              href="/wiadomosci"
              className="text-[15px] text-[#4A3D50] hover:text-[#241C2B] cursor-pointer bg-transparent border-0 pb-1 whitespace-nowrap"
            >
              Wiadomości
            </Link>
            <Link
              href="/cennik"
              className="text-[15px] text-[#4A3D50] hover:text-[#241C2B] cursor-pointer bg-transparent border-0 pb-1 whitespace-nowrap"
            >
              Abonament
            </Link>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <span className="w-[38px] h-[38px] rounded-full bg-[#E7EDE7] text-[#3F5142] text-[14px] font-bold flex items-center justify-center">
              DL
            </span>
            <Link
              href="/"
              className="text-[15px] text-[#4A3D50] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer hidden sm:inline"
            >
              Wyloguj
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-full border border-[#D9CCC2] bg-white text-[#241C2B] hover:bg-[#F2E9E2] transition-colors cursor-pointer"
              aria-label="Wysuń pasek boczny"
            >
              <Menu className="w-5 h-5 text-[#241C2B]" />
              <span className="text-[13px] font-bold">Menu</span>
            </button>
          </div>
        </header>

        {/* Floating mobile drawer button for quick access on small screens */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden fixed bottom-20 right-4 z-40 bg-[#241C2B] hover:bg-[#3E3344] text-white shadow-xl rounded-full pl-3.5 pr-4 py-2.5 flex items-center gap-2 border border-[#4A3D50] cursor-pointer transition-transform active:scale-95"
          aria-label="Wysuń pasek boczny"
        >
          <Menu className="w-4 h-4 text-[#F0A62E]" />
          <span className="text-[13px] font-bold">Menu</span>
        </button>

        <MobileSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          variant={uzytyWariant}
        />
      </>
    );
  }

  if (uzytyWariant === "dashboard-client") {
    return (
      <>
        <header className="h-[84px] shrink-0 box-border px-4 sm:px-6 md:px-[60px] flex items-center justify-between gap-4 md:gap-11 border-b border-[#EADFD6] bg-white">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-fraunces text-[23px] sm:text-[25px] font-semibold text-[#241C2B] bg-transparent border-0 cursor-pointer p-0"
            >
              Gościnnie
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-[#EFE5DD] text-[#6A5C70] text-[12px] font-bold">
              Panel klienta
            </span>
          </div>

          <nav className="hidden lg:flex gap-4 md:gap-7 grow items-center overflow-x-auto py-2">
            <Link
              href="/moje"
              className="text-[15px] text-[#4A3D50] hover:text-[#241C2B] cursor-pointer bg-transparent border-0 pb-1 whitespace-nowrap"
            >
              Moje zlecenia
            </Link>
            <Link
              href="/moje"
              className={`text-[15px] cursor-pointer bg-transparent border-0 pb-1 whitespace-nowrap ${
                sciezka === "/moje"
                  ? "text-[#241C2B] font-bold border-b-2 border-[#241C2B]"
                  : "text-[#4A3D50] hover:text-[#241C2B]"
              }`}
            >
              Otrzymane oferty
            </Link>
            <Link
              href="/moje"
              className="text-[15px] text-[#4A3D50] hover:text-[#241C2B] cursor-pointer bg-transparent border-0 pb-1 whitespace-nowrap"
            >
              Krótka lista
            </Link>
            <Link
              href="/wiadomosci"
              className={`text-[15px] cursor-pointer bg-transparent border-0 pb-1 whitespace-nowrap ${
                sciezka === "/wiadomosci"
                  ? "text-[#241C2B] font-bold border-b-2 border-[#241C2B]"
                  : "text-[#4A3D50] hover:text-[#241C2B]"
              }`}
            >
              Wiadomości
            </Link>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <span className="w-[38px] h-[38px] rounded-full bg-[#E7EDE7] text-[#3F5142] text-[14px] font-bold flex items-center justify-center">
              AK
            </span>
            <Link
              href="/"
              className="text-[15px] text-[#4A3D50] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer hidden sm:inline"
            >
              Wyloguj
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-full border border-[#D9CCC2] bg-white text-[#241C2B] hover:bg-[#F2E9E2] transition-colors cursor-pointer"
              aria-label="Wysuń pasek boczny"
            >
              <Menu className="w-5 h-5 text-[#241C2B]" />
              <span className="text-[13px] font-bold">Menu</span>
            </button>
          </div>
        </header>

        {/* Floating mobile drawer button for quick access on small screens */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden fixed bottom-20 right-4 z-40 bg-[#241C2B] hover:bg-[#3E3344] text-white shadow-xl rounded-full pl-3.5 pr-4 py-2.5 flex items-center gap-2 border border-[#4A3D50] cursor-pointer transition-transform active:scale-95"
          aria-label="Wysuń pasek boczny"
        >
          <Menu className="w-4 h-4 text-[#F0A62E]" />
          <span className="text-[13px] font-bold">Menu</span>
        </button>

        <MobileSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          variant={uzytyWariant}
        />
      </>
    );
  }

  // Public header
  return (
    <>
      <header className="h-[84px] shrink-0 box-border px-4 sm:px-6 md:px-[130px] flex items-center justify-between gap-4 md:gap-12 border-b border-[#EADFD6] bg-[#FBF7F4]">
        <Link
          href="/"
          className="font-fraunces text-[25px] sm:text-[27px] font-semibold text-[#241C2B] tracking-tight bg-transparent border-0 cursor-pointer p-0"
        >
          Gościnnie
        </Link>

        <nav className="hidden lg:flex gap-[30px] grow items-center">
          <Link
            href="/lokale"
            className={`text-[15px] cursor-pointer bg-transparent border-0 pb-1 ${
              sciezka.startsWith("/lokale")
                ? "text-[#241C2B] font-bold border-b-2 border-[#241C2B]"
                : "text-[#4A3D50] hover:text-[#241C2B]"
            }`}
          >
            Lokale
          </Link>
          <Link
            href="/uslugodawcy"
            className={`text-[15px] cursor-pointer bg-transparent border-0 pb-1 flex items-center gap-1 ${
              sciezka.startsWith("/uslugodawcy")
                ? "text-[#241C2B] font-bold border-b-2 border-[#241C2B]"
                : "text-[#4A3D50] hover:text-[#241C2B]"
            }`}
          >
            <span>Usługodawcy</span>
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={
                sciezka.startsWith("/uslugodawcy") ? "rotate-180 transition-transform" : ""
              }
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </Link>
          <Link
            href="/zlecenia"
            className={`text-[15px] cursor-pointer bg-transparent border-0 pb-1 ${
              sciezka.startsWith("/zlecenia")
                ? "text-[#241C2B] font-bold border-b-2 border-[#241C2B]"
                : "text-[#4A3D50] hover:text-[#241C2B]"
            }`}
          >
            Zlecenia
          </Link>
          <Link
            href="/imprezy"
            className={`text-[15px] cursor-pointer bg-transparent border-0 pb-1 ${
              sciezka.startsWith("/imprezy")
                ? "text-[#241C2B] font-bold border-b-2 border-[#241C2B]"
                : "text-[#4A3D50] hover:text-[#241C2B]"
            }`}
          >
            Imprezy
          </Link>
          <Link
            href="/cennik"
            className={`text-[15px] cursor-pointer bg-transparent border-0 pb-1 ${
              sciezka === "/cennik"
                ? "text-[#241C2B] font-bold border-b-2 border-[#241C2B]"
                : "text-[#4A3D50] hover:text-[#241C2B]"
            }`}
          >
            Dla firm
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link
            href="/logowanie"
            className="text-[15px] text-[#4A3D50] hover:text-[#241C2B] cursor-pointer bg-transparent border-0 hidden sm:inline"
          >
            Zaloguj się
          </Link>
          <Link
            href="/rejestracja-firmy"
            className="text-[14px] sm:text-[15px] font-semibold text-[#241C2B] border-[1.5px] border-[#241C2B] rounded-full px-4 sm:px-5 py-2 sm:py-[10px] hover:bg-[#241C2B] hover:text-white transition-colors cursor-pointer bg-transparent hidden md:inline"
          >
            Dodaj swój lokal
          </Link>

          {/* Mobile Hamburger Button to slide out the sidebar */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-full border border-[#D9CCC2] bg-white text-[#241C2B] hover:bg-[#F2E9E2] transition-colors cursor-pointer shadow-xs"
            aria-label="Wysuń pasek boczny"
          >
            <Menu className="w-5 h-5 text-[#241C2B]" />
            <span className="text-[13px] font-bold">Menu</span>
          </button>
        </div>
      </header>

      {/* Floating mobile drawer button for quick access on small screens */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-40 bg-[#241C2B] hover:bg-[#3E3344] text-white shadow-xl rounded-full pl-3.5 pr-4 py-2.5 flex items-center gap-2 border border-[#4A3D50] cursor-pointer transition-transform active:scale-95"
        aria-label="Wysuń pasek boczny"
      >
        <Menu className="w-4 h-4 text-[#F0A62E]" />
        <span className="text-[13px] font-bold">Menu</span>
      </button>

      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        variant={uzytyWariant}
      />
    </>
  );
}

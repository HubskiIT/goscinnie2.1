"use client";

import {
  Briefcase,
  Building2,
  ChevronRight,
  ClipboardList,
  LogIn,
  LogOut,
  MessageSquare,
  PartyPopper,
  Phone,
  Plus,
  Sparkles,
  Store,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: "public" | "dashboard-firm" | "dashboard-client" | "simple";
}

export function MobileSidebar({ isOpen, onClose, variant = "public" }: MobileSidebarProps) {
  const sciezka = usePathname();
  // Prevent body scrolling when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen, onClose]);

  const navItems = [
    {
      href: "/lokale",
      label: "Lokale i sale",
      subtitle: "Sale weselne, dworki, restauracje, stodoły",
      icon: Building2,
    },
    {
      href: "/uslugodawcy",
      label: "Usługodawcy",
      subtitle: "DJ-e, fotografowie, catering, dekoracje",
      icon: Sparkles,
    },
    {
      href: "/zlecenia",
      label: "Zlecenia",
      subtitle: "Giełda zleceń i zapytań od klientów",
      icon: ClipboardList,
    },
    {
      href: "/imprezy",
      label: "Imprezy",
      subtitle: "Wesela, osiemnastki, komunie, firmowe",
      icon: PartyPopper,
    },
    {
      href: "/cennik",
      label: "Dla firm / Cennik",
      subtitle: "Stały abonament, 0% prowizji od umów",
      icon: Briefcase,
    },
  ];

  const dashboardFirmItems = [
    { href: "/panel", label: "Pulpit firmy", icon: Store },
    { href: "/f/dwor-pod-lipami", label: "Profil lokalu / Podgląd", icon: Building2 },
    { href: "/zlecenia", label: "Zlecenia i giełda", icon: ClipboardList },
    { href: "/wiadomosci", label: "Wiadomości i czat", icon: MessageSquare },
    { href: "/cennik", label: "Abonament i pakiety", icon: Briefcase },
  ];

  const dashboardClientItems = [
    { href: "/moje", label: "Panel klienta", icon: User },
    { href: "/dodaj-zlecenie", label: "Dodaj nowe zlecenie", icon: Plus },
    { href: "/wiadomosci", label: "Wiadomości z lokalami", icon: MessageSquare },
    { href: "/lokale", label: "Szukaj lokali", icon: Building2 },
    { href: "/uslugodawcy", label: "Szukaj usługodawców", icon: Sparkles },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#241C2B]/60 backdrop-blur-xs cursor-pointer"
            aria-label="Zamknij menu boczne"
          />

          {/* Drawer Sidebar */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 w-[88vw] max-w-[360px] bg-[#FBF7F4] text-[#241C2B] shadow-2xl flex flex-col border-l border-[#EADFD6] z-50 select-none overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Pasek boczny nawigacji"
          >
            {/* Header of Drawer */}
            <div className="h-[74px] px-5 flex items-center justify-between border-b border-[#EADFD6] bg-[#F7EFE9] shrink-0">
              <Link
                href="/"
                onClick={onClose}
                className="flex flex-col text-left bg-transparent border-0 cursor-pointer p-0"
              >
                <span className="font-fraunces text-[23px] font-semibold text-[#241C2B] tracking-tight leading-none">
                  Gościnnie
                </span>
                <span className="text-[11px] text-[#6A5C70] tracking-wide mt-1">
                  Miejsca i ludzie na każdą okazję
                </span>
              </Link>

              <button
                type="button"
                onClick={onClose}
                aria-label="Zamknij pasek boczny"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-[#D9CCC2] text-[#241C2B] hover:bg-[#EADFD6] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="grow overflow-y-auto px-5 py-4 space-y-5">
              {/* Quick Primary CTA */}
              {variant !== "dashboard-firm" && (
                <div className="bg-[#241C2B] text-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] uppercase tracking-wider text-[#D8CFDC] font-bold">
                      Dla właścicieli
                    </span>
                    <span className="text-[11px] bg-[#F0A62E] text-[#241C2B] font-bold px-2 py-0.5 rounded-full">
                      0% prowizji
                    </span>
                  </div>
                  <h4 className="m-0 font-fraunces text-[18px] font-medium leading-tight mb-2">
                    Prowadzisz salę lub usługę?
                  </h4>
                  <p className="m-0 text-[13px] text-[#D8CFDC] leading-snug mb-3">
                    Dołącz do katalogu i odbieraj bezpośrednie zapytania bez pośredników.
                  </p>
                  <Link
                    href="/rejestracja-firmy"
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#F0A62E] hover:bg-[#e29922] transition-colors text-[#241C2B] font-bold text-[14px] border-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Dodaj swój lokal</span>
                  </Link>
                </div>
              )}

              {/* Mode-Specific Navigation */}
              {variant === "dashboard-firm" && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#6A5C70] mb-2 px-1">
                    Panel zarządzania lokalem
                  </div>
                  <div className="space-y-1">
                    {dashboardFirmItems.map((item) => {
                      const isActive = sciezka === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          href={item.href}
                          key={item.href}
                          onClick={onClose}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border-0 cursor-pointer text-left transition-colors ${
                            isActive
                              ? "bg-[#241C2B] text-white font-semibold"
                              : "bg-white hover:bg-[#F2E9E2] text-[#241C2B]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-5 h-5 ${isActive ? "text-[#F0A62E]" : "text-[#6A5C70]"}`}
                            />
                            <span className="text-[15px]">{item.label}</span>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 ${isActive ? "text-white" : "text-[#A093A7]"}`}
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {variant === "dashboard-client" && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#6A5C70] mb-2 px-1">
                    Panel organizatora
                  </div>
                  <div className="space-y-1">
                    {dashboardClientItems.map((item) => {
                      const isActive = sciezka === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          href={item.href}
                          key={item.href}
                          onClick={onClose}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border-0 cursor-pointer text-left transition-colors ${
                            isActive
                              ? "bg-[#241C2B] text-white font-semibold"
                              : "bg-white hover:bg-[#F2E9E2] text-[#241C2B]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-5 h-5 ${isActive ? "text-[#F0A62E]" : "text-[#6A5C70]"}`}
                            />
                            <span className="text-[15px]">{item.label}</span>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 ${isActive ? "text-white" : "text-[#A093A7]"}`}
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Main Public Catalog Navigation */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#6A5C70] mb-2 px-1">
                  Katalog i zlecenia
                </div>
                <div className="space-y-1.5">
                  {navItems.map((item) => {
                    const isActive = sciezka === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        href={item.href}
                        key={item.href}
                        onClick={onClose}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-0 cursor-pointer text-left transition-all ${
                          isActive
                            ? "bg-[#241C2B] text-white shadow-sm"
                            : "bg-white hover:bg-[#F2E9E2] text-[#241C2B] border border-[#EFE5DD]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                              isActive
                                ? "bg-white/10 text-[#F0A62E]"
                                : "bg-[#FBF7F4] text-[#4A3D50]"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div
                              className={`text-[15px] font-semibold leading-tight ${isActive ? "text-white" : "text-[#241C2B]"}`}
                            >
                              {item.label}
                            </div>
                            <div
                              className={`text-[12px] leading-tight mt-1 ${isActive ? "text-[#D8CFDC]" : "text-[#6A5C70]"}`}
                            >
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-[#A093A7]"}`}
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Additional Sections & Quick Links */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#6A5C70] mb-2 px-1">
                  Strefa użytkownika
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/moje"
                    onClick={onClose}
                    className="p-3 bg-white border border-[#EFE5DD] rounded-xl text-left cursor-pointer hover:bg-[#F2E9E2] transition-colors"
                  >
                    <User className="w-4 h-4 text-[#241C2B] mb-1.5" />
                    <div className="text-[13px] font-bold text-[#241C2B]">Panel klienta</div>
                    <div className="text-[11px] text-[#6A5C70]">Oferty i zlecenia</div>
                  </Link>

                  <Link
                    href="/panel"
                    onClick={onClose}
                    className="p-3 bg-white border border-[#EFE5DD] rounded-xl text-left cursor-pointer hover:bg-[#F2E9E2] transition-colors"
                  >
                    <Store className="w-4 h-4 text-[#241C2B] mb-1.5" />
                    <div className="text-[13px] font-bold text-[#241C2B]">Panel lokalu</div>
                    <div className="text-[11px] text-[#6A5C70]">Pulpit i kalendarz</div>
                  </Link>

                  <Link
                    href="/wiadomosci"
                    onClick={onClose}
                    className="p-3 bg-white border border-[#EFE5DD] rounded-xl text-left cursor-pointer hover:bg-[#F2E9E2] transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-[#241C2B] mb-1.5" />
                    <div className="text-[13px] font-bold text-[#241C2B]">Wiadomości</div>
                    <div className="text-[11px] text-[#6A5C70]">Czat i odpowiedzi</div>
                  </Link>

                  <Link
                    href="/kontakt"
                    onClick={onClose}
                    className="p-3 bg-white border border-[#EFE5DD] rounded-xl text-left cursor-pointer hover:bg-[#F2E9E2] transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#241C2B] mb-1.5" />
                    <div className="text-[13px] font-bold text-[#241C2B]">Pomoc</div>
                    <div className="text-[11px] text-[#6A5C70]">Kontakt z biurem</div>
                  </Link>
                </div>
              </div>

              {/* Status information */}
              <div className="p-3 bg-[#EFE5DD]/60 rounded-xl border border-[#E5D7CC] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[12px] font-medium text-[#4A3D50]">
                    Katalog aktywny w całej Polsce
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[11px] font-bold text-[#241C2B] bg-transparent border-0 cursor-pointer underline"
                >
                  Stany
                </button>
              </div>
            </div>

            {/* Bottom Account Row */}
            <div className="p-4 border-t border-[#EADFD6] bg-[#F7EFE9] shrink-0 flex items-center justify-between gap-3">
              {variant === "dashboard-firm" || variant === "dashboard-client" ? (
                <>
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-full bg-[#E7EDE7] text-[#3F5142] text-[13px] font-bold flex items-center justify-center">
                      {variant === "dashboard-firm" ? "DL" : "AK"}
                    </span>
                    <div className="text-left">
                      <div className="text-[13px] font-bold text-[#241C2B]">Zalogowany</div>
                      <div className="text-[11px] text-[#6A5C70]">
                        {variant === "dashboard-firm" ? "Dworek Leśny" : "Anna Kowalska"}
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/"
                    onClick={onClose}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-white"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Wyloguj</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/logowanie"
                    onClick={onClose}
                    className="grow flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-[#D9CCC2] text-[#241C2B] font-bold text-[14px] hover:bg-[#F2E9E2] transition-colors cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-[#6A5C70]" />
                    <span>Zaloguj się</span>
                  </Link>
                  <Link
                    href="/rejestracja-firmy"
                    onClick={onClose}
                    className="grow flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#241C2B] text-white font-bold text-[14px] hover:bg-[#3E3344] transition-colors cursor-pointer border-0"
                  >
                    <span>Rejestracja</span>
                  </Link>
                </>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

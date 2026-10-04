"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { Footer } from "../Footer";
import { Header } from "../Header";
import type { ScreenProps } from "../types";

interface SubCategoryItem {
  id: string;
  name: string;
  count: number;
}

interface MegaCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  subcategories: SubCategoryItem[];
}

const MEGA_CATEGORIES: MegaCategory[] = [
  {
    id: "muzyka",
    name: "Muzyka i oprawa",
    count: 412,
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    subcategories: [
      { id: "dj", name: "DJ", count: 173 },
      { id: "oprawa-ceremonii", name: "Oprawa ceremonii", count: 36 },
      { id: "naglosnienie", name: "Nagłośnienie", count: 27 },
      { id: "zespol", name: "Zespół muzyczny", count: 88 },
      { id: "skrzypce-saksofon", name: "Skrzypce i saksofon", count: 29 },
      { id: "wodzirej", name: "Wodzirej", count: 41 },
      { id: "chor-schola", name: "Chór i schola", count: 18 },
    ],
  },
  {
    id: "foto-wideo",
    name: "Foto i wideo",
    count: 388,
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
    subcategories: [
      { id: "fotograf", name: "Fotograf", count: 214 },
      { id: "kamerzysta", name: "Kamerzysta / Film 4K", count: 96 },
      { id: "fotobudka", name: "Fotobudka 360 i lustro", count: 42 },
      { id: "sesja-plener", name: "Sesja plenerowa", count: 21 },
      { id: "dron", name: "Ujęcia z drona", count: 15 },
    ],
  },
  {
    id: "jedzenie",
    name: "Jedzenie i napoje",
    count: 356,
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
    subcategories: [
      { id: "catering", name: "Catering okolicznościowy", count: 142 },
      { id: "barmani", name: "Drink Bar i barmani", count: 64 },
      { id: "torty", name: "Torty i słodki stół", count: 58 },
      { id: "foodtruck", name: "Food trucki", count: 38 },
      { id: "stol-wiejski", name: "Stół wiejski", count: 32 },
      { id: "barista", name: "Mobilny barista", count: 22 },
    ],
  },
  {
    id: "dekoracje",
    name: "Dekoracje i kwiaty",
    count: 294,
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a4 4 0 0 1 4 4c0 3-4 7-4 7s-4-4-4-7a4 4 0 0 1 4-4z" />
        <path d="M12 13v9" />
      </svg>
    ),
    subcategories: [
      { id: "florystyka", name: "Florystyka i bukiety", count: 112 },
      { id: "scianki", name: "Ścianki kwiatowe i tła", count: 68 },
      { id: "oswietlenie-dek", name: "Oświetlenie dekoracyjne", count: 54 },
      { id: "wypozyczalnia", name: "Wypożyczalnia dekoracji", count: 36 },
      { id: "balony", name: "Balony i girlandy", count: 24 },
    ],
  },
  {
    id: "atrakcje",
    name: "Atrakcje",
    count: 268,
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    subcategories: [
      { id: "ciezki-dym", name: "Ciężki dym i fontanny", count: 78 },
      { id: "animator", name: "Animatorzy dla dzieci", count: 52 },
      { id: "iluzja", name: "Pokazy iluzji i ognia", count: 42 },
      { id: "fotobudka-retro", name: "Fotobudka retro", count: 38 },
      { id: "gry-plenerowe", name: "Gry plenerowe", count: 34 },
      { id: "pirotechnika", name: "Pirotechnika i fajerwerki", count: 24 },
    ],
  },
  {
    id: "transport",
    name: "Transport",
    count: 147,
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    subcategories: [
      { id: "auto-retro", name: "Samochód retro / klasyk", count: 48 },
      { id: "nowoczesne-auto", name: "Nowoczesne auto do ślubu", count: 39 },
      { id: "busy", name: "Bus / transport gości", count: 36 },
      { id: "bryczka", name: "Bryczka i kareta", count: 14 },
      { id: "limuzyna", name: "Limuzyna", count: 10 },
    ],
  },
  {
    id: "uroda",
    name: "Uroda i przygotowania",
    count: 211,
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
        <line x1="9" y1="21" x2="15" y2="21" />
      </svg>
    ),
    subcategories: [
      { id: "makijaz", name: "Makijaż ślubny", count: 84 },
      { id: "fryzury", name: "Fryzury okolicznościowe", count: 72 },
      { id: "stylistka", name: "Stylistka i suknie", count: 32 },
      { id: "barber", name: "Barber ślubny", count: 23 },
    ],
  },
  {
    id: "organizacja",
    name: "Organizacja i obsługa",
    count: 163,
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    subcategories: [
      { id: "wedding-planner", name: "Konsultant ślubny / Planner", count: 54 },
      { id: "kelnerzy", name: "Obsługa kelnerska", count: 48 },
      { id: "koordynacja", name: "Koordynacja dnia ślubu", count: 36 },
      { id: "hostessy", name: "Ochrona i hostessy", count: 25 },
    ],
  },
  {
    id: "papier",
    name: "Papier i pamiątki",
    count: 126,
    icon: (
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    subcategories: [
      { id: "zaproszenia", name: "Zaproszenia i papeteria", count: 56 },
      { id: "winietki", name: "Winietki i plany stołów", count: 38 },
      { id: "albumy", name: "Ręcznie oprawiane albumy", count: 22 },
      { id: "podziekowania", name: "Podziękowania dla gości", count: 10 },
    ],
  },
];

// Lista jest stala i niepusta. Niezmiennik sprawdzany raz, przy wczytaniu modulu,
// zeby nie siegac po indeks 0 bez gwarancji typu.
const DOMYSLNA_KATEGORIA: MegaCategory = (() => {
  const pierwsza = MEGA_CATEGORIES[0];
  if (pierwsza === undefined) {
    throw new Error("MEGA_CATEGORIES nie moze byc puste");
  }
  return pierwsza;
})();

interface ProviderCardData {
  id: string;
  category: string;
  categoryId: string;
  subcategoryId: string;
  name: string;
  base: string;
  tags: string[];
  price: string;
  unit: string;
  bgColor: string;
  description: string;
}

const PROVIDERS_CATALOG: ProviderCardData[] = [
  {
    id: "1",
    category: "Zespół muzyczny",
    categoryId: "muzyka",
    subcategoryId: "zespol",
    name: "Zespół Cztery Ćwiartki",
    base: "Baza: Wrocław · dojeżdża do 200 km",
    tags: ["gra na ceremonii", "pięć osób", "saksofon", "wokal na żywo"],
    price: "6 500 zł",
    unit: "od, za wesele",
    bgColor: "bg-[#E8DED2]",
    description:
      "Pięcioosobowy skład na żywo. Gramy muzykę taneczną oraz zapewniamy akustyczną oprawę ceremonii ślubnej w plenerze lub kościele.",
  },
  {
    id: "2",
    category: "DJ i Wodzirej",
    categoryId: "muzyka",
    subcategoryId: "dj",
    name: "DJ Sound & Light Show",
    base: "Baza: Wrocław · dojeżdża do 120 km",
    tags: ["DJ weselny", "wodzirej", "ciężki dym", "nagłośnienie ceremonii"],
    price: "3 800 zł",
    unit: "od, cała noc",
    bgColor: "bg-[#DCD8DF]",
    description:
      "Kompleksowa oprawa muzyczna i oświetlenie. Doświadczony wodzirej prowadzący imprezę z klasą. Dodatkowy zestaw nagłośnienia na ceremonię.",
  },
  {
    id: "3",
    category: "Fotograf",
    categoryId: "foto-wideo",
    subcategoryId: "fotograf",
    name: "Studio Lipowa",
    base: "Baza: Wrocław · dojeżdża do 120 km",
    tags: ["reportaż", "dwie osoby", "plener"],
    price: "3 200 zł",
    unit: "od, cały dzień",
    bgColor: "bg-[#E4D9CF]",
    description:
      "Naturalny reportaż ślubny bez sztucznego pozowania. Pracujemy w duecie, oddajemy minimum 500 autorsko obrobionych zdjęć.",
  },
  {
    id: "4",
    category: "Kamerzysta i Fotograf",
    categoryId: "foto-wideo",
    subcategoryId: "kamerzysta",
    name: "Kadr i Światło Films",
    base: "Baza: Wrocław · dojeżdża do 150 km",
    tags: ["film 4K", "dron", "teledysk"],
    price: "5 900 zł",
    unit: "od, pakiet foto+wideo",
    bgColor: "bg-[#DCE0D8]",
    description:
      "Film w jakości 4K z ujęciami z drona. Dynamiczny teledysk oraz pełny reportaż filmowy z profesjonalnym masteringiem dźwięku.",
  },
  {
    id: "5",
    category: "Catering okolicznościowy",
    categoryId: "jedzenie",
    subcategoryId: "catering",
    name: "Kuchnia Siechnicka Catering",
    base: "Baza: Siechnice · dojeżdża do 60 km",
    tags: ["menu wegetariańskie", "obsługa kelnerska", "stół wiejski"],
    price: "95 zł",
    unit: "od, za osobę",
    bgColor: "bg-[#D9CCC2]",
    description:
      "Catering okolicznościowy oparty na świeżych produktach. Bogate warianty menu tradycyjnego, wegetariańskiego i wegańskiego.",
  },
  {
    id: "6",
    category: "Barmani i Drink Bar",
    categoryId: "jedzenie",
    subcategoryId: "barmani",
    name: "Craft Bar Cocktail Service",
    base: "Baza: Wrocław · dojeżdża do 90 km",
    tags: ["mobilny bar", "open bar", "drinki autorskie"],
    price: "2 200 zł",
    unit: "od, pakiet 50 osób",
    bgColor: "bg-[#E0DAD3]",
    description:
      "Mobilny drewniany drink bar z dwójką profesjonalnych barmanów. 8 autorskich koktajli na świeżych owocach i ziołach.",
  },
  {
    id: "7",
    category: "Dekoracje",
    categoryId: "dekoracje",
    subcategoryId: "florystyka",
    name: "Pracownia Kwiat i Wstążka",
    base: "Baza: Wrocław · dojeżdża do 90 km",
    tags: ["ściana kwiatowa", "stoły", "bukiety"],
    price: "1 800 zł",
    unit: "od, za realizację",
    bgColor: "bg-[#E7EDE7]",
    description:
      "Florystyka ślubna i dekoracje sal. Ścianki kwiatowe, kompozycje z żywych kwiatów, neony okolicznościowe.",
  },
  {
    id: "8",
    category: "Animator dla dzieci",
    categoryId: "atrakcje",
    subcategoryId: "animator",
    name: "Kolorowe Chmurki Animacje",
    base: "Baza: Wrocław · dojeżdża do 70 km",
    tags: ["animator na urodziny", "malowanie twarzy", "bańki mydlane"],
    price: "700 zł",
    unit: "od, 3 godziny",
    bgColor: "bg-[#EBE4DC]",
    description:
      "Kreatywna opieka i zabawy dla dzieci na uroczystościach. Warsztaty slime, gry ruchowe i bezpieczny kącik malucha.",
  },
];

export function UslugodawcyScreen({ navigate }: ScreenProps) {
  // Wybrana kategoria po lewej stronie mega menu
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("muzyka");
  // Wybrana podkategoria
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

  // Wyszukiwarka
  const [searchInput, setSearchInput] = useState("zespół na wesele, który gra też na ceremonii");
  const [locationInput, setLocationInput] = useState("Wrocław i 60 km");

  const selectedCategory =
    MEGA_CATEGORIES.find((c) => c.id === selectedCategoryId) ?? DOMYSLNA_KATEGORIA;

  // Często szukane pigułki z grafiki
  const quickSearchTags = [
    "fotograf na komunię",
    "zespół weselny z wodzirejem",
    "catering wegetański",
    "animator na urodziny",
    "ciężki dym",
    "auto do ślubu",
  ];

  // Filtrowanie usługodawców
  const filteredProviders = useMemo(() => {
    return PROVIDERS_CATALOG.filter((p) => {
      // Jeśli wybrana podkategoria
      if (selectedSubcategoryId) {
        if (p.subcategoryId === selectedSubcategoryId) return true;
      }
      // Jeśli wybrana kategoria główna
      if (selectedCategoryId) {
        if (p.categoryId === selectedCategoryId) return true;
      }
      // Wyszukiwanie frazy w tagach lub tytule
      if (searchInput.trim()) {
        const q = searchInput.toLowerCase();
        if (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q)
        ) {
          return true;
        }
      }
      return true;
    });
  }, [selectedCategoryId, selectedSubcategoryId, searchInput]);

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen font-figtree">
      {/* Header z aktywnym stanem Usługodawcy ^ */}
      <Header currentScreen="Uslugodawcy" navigate={navigate} />

      {/* 1. MEGA DROPDOWN MENU Z KATEGORIAMI I PODZIAŁAMI (DOKŁADNIE JAK NA ZRZUCIE EKRANU) */}
      <section className="shrink-0 px-6 sm:px-10 lg:px-[130px] pt-6 pb-4">
        <div className="border border-[#E2D5CA] rounded-[24px] bg-white shadow-md overflow-hidden flex flex-col lg:flex-row">
          {/* LEWA KOLUMNA: LISTA 9 KATEGORII GŁÓWNYCH */}
          <div className="w-full lg:w-[280px] shrink-0 p-4 border-b lg:border-b-0 lg:border-r border-[#EFE5DD] flex flex-col gap-1">
            {MEGA_CATEGORIES.map((cat) => {
              const isActive = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    setSelectedSubcategoryId(null);
                  }}
                  className={`w-full text-left p-3.5 px-4 rounded-[14px] cursor-pointer border-0 flex items-center justify-between transition-colors ${
                    isActive
                      ? "bg-[#EFE8DF] text-[#241C2B] font-semibold"
                      : "bg-transparent text-[#241C2B] hover:bg-[#F7F2ED]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#3E3344] shrink-0">{cat.icon}</span>
                    <span className="text-[15px] font-medium leading-none">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <span className="text-[#241C2B] font-bold text-[14px]">›</span>
                    ) : (
                      <span className="text-[13px] text-[#6A5C70] font-normal">{cat.count}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ŚRODKOWA KOLUMNA: PODZIAŁY WYBRANEJ KATEGORII (NP. MUZYKA I OPRAWA -> DJ 173, ZESPÓŁ 88...) */}
          <div className="grow p-7 sm:p-9 flex flex-col justify-between">
            <div>
              {/* Nagłówek kategorii i link "Zobacz wszystkie" */}
              <div className="flex items-center justify-between gap-4 mb-7">
                <h2 className="m-0 font-fraunces font-normal text-[26px] sm:text-[28px] text-[#241C2B] tracking-tight">
                  {selectedCategory.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedSubcategoryId(null)}
                  className="text-[14px] font-semibold text-[#8A5405] hover:text-[#241C2B] underline bg-transparent border-0 cursor-pointer p-0"
                >
                  Zobacz wszystkie {selectedCategory.count}
                </button>
              </div>

              {/* 3 kolumny podkategorii z liczbami */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-4">
                {selectedCategory.subcategories.map((sub) => {
                  const isSubSelected = selectedSubcategoryId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubcategoryId(sub.id)}
                      className={`text-left flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer border-0 bg-transparent transition-colors ${
                        isSubSelected
                          ? "bg-[#F2E9E2] text-[#241C2B] font-bold"
                          : "hover:bg-[#FAF8F6] text-[#241C2B]"
                      }`}
                    >
                      <span className="text-[15px] hover:text-[#8A5405]">{sub.name}</span>
                      <span className="text-[13px] text-[#6A5C70] tabular-nums font-normal ml-3">
                        {sub.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PRAWA KOLUMNA: KARTA "POTRZEBUJESZ KILKU NARAZ?" */}
          <div className="w-full lg:w-[320px] shrink-0 p-6 lg:p-7 flex items-center">
            <div className="w-full bg-[#F2E9E2] rounded-[18px] p-6 sm:p-7 flex flex-col justify-between gap-5 border border-[#E8DDD2]">
              <div>
                <h3 className="m-0 font-fraunces font-medium text-[19px] sm:text-[20px] text-[#241C2B] mb-2.5">
                  Potrzebujesz kilku naraz?
                </h3>
                <p className="m-0 text-[14px] leading-[1.6] text-[#3E3344]">
                  Wystaw jedno zlecenie na fotografa, zespół i catering. Każda kategoria dostanie je
                  osobno.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("NoweZlecenie")}
                className="w-full py-3.5 px-5 bg-white hover:bg-[#241C2B] hover:text-white transition-colors text-[#241C2B] text-[15px] font-semibold rounded-[12px] border border-[#241C2B] cursor-pointer shadow-xs"
              >
                Wystaw zlecenie
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SEKCJA GŁÓWNA: 2 365 USŁUGODAWCÓW W DZIEWIĘCIU KATEGORIACH */}
      <section className="shrink-0 px-6 sm:px-10 lg:px-[130px] pt-10 pb-6">
        <h1 className="m-0 mb-3.5 font-fraunces font-normal text-[36px] sm:text-[46px] md:text-[50px] tracking-tight leading-[1.12]">
          2 365 usługodawców w dziewięciu kategoriach
        </h1>
        <p className="m-0 mb-8 text-[17px] leading-[1.6] text-[#3E3344] max-w-[76ch]">
          Jeśli wiesz, kogo szukasz, wpisz to w jednym polu. Jeśli nie wiesz, zjedź niżej i
          przeglądaj kategoriami. Te dwie drogi prowadzą w to samo miejsce i obie działają bez
          konta.
        </p>

        {/* Wyszukiwarka z podziałem na treść i lokalizację */}
        <div className="border-[2px] border-[#241C2B] rounded-[16px] bg-white p-2 sm:p-2.5 flex flex-col sm:flex-row items-center gap-2 shadow-sm">
          {/* Input tekstowy */}
          <div className="grow w-full flex items-center px-4 py-2 gap-3">
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6A5C70"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Wpisz kogo szukasz, np. zespół na wesele, który gra też na ceremonii..."
              className="w-full text-[16px] text-[#241C2B] bg-transparent border-0 focus:outline-none placeholder:text-[#6A5C70]"
            />
          </div>

          {/* Separator pionowy */}
          <div className="hidden sm:block w-[1px] h-9 bg-[#D9CCC2]" />

          {/* Lokalizacja */}
          <div className="w-full sm:w-[170px] shrink-0 px-4 py-2 text-[15px] font-semibold text-[#241C2B] flex items-center justify-between sm:justify-start">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="w-full text-[15px] font-semibold text-[#241C2B] bg-transparent border-0 focus:outline-none"
            />
          </div>

          {/* Przycisk Szukaj */}
          <button
            type="button"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#F0A62E] hover:bg-[#e29922] transition-colors rounded-[12px] text-[16px] font-bold text-[#241C2B] border-0 cursor-pointer shrink-0 shadow-xs"
          >
            Szukaj
          </button>
        </div>

        {/* Często szukane pigułki */}
        <div className="mt-5 flex items-center gap-2.5 flex-wrap">
          <span className="text-[13px] font-semibold text-[#6A5C70] mr-1">Często szukane:</span>
          {quickSearchTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSearchInput(tag)}
              className="text-[13px] text-[#241C2B] bg-white border border-[#D9CCC2] hover:border-[#241C2B] rounded-full px-4 py-2 cursor-pointer transition-colors shadow-2xs"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Tekst wyjaśniający działanie wyszukiwarki */}
        <p className="m-0 mt-5 text-[14px] leading-[1.65] text-[#6A5C70] max-w-[85ch]">
          Wyszukiwarka przeszukuje nazwy kategorii, nazwy firm, miejscowości oraz opisy, które firmy
          same o sobie napisały. Dzięki temu fraza w rodzaju „gra też na ceremonii” trafia, nawet
          jeśli nie ma takiej kategorii.
        </p>
      </section>

      {/* 3. SIATKA WYNIKÓW I KART USŁUGODAWCÓW */}
      <section className="grow px-6 sm:px-10 lg:px-[130px] pt-8 pb-14">
        <div className="flex items-center justify-between mb-6">
          <div className="text-[15px] text-[#55485A]">
            Pokazuję: <strong>{filteredProviders.length} wykonawców</strong>
            {selectedSubcategoryId && (
              <>
                {" "}
                w podkategorii <strong>{selectedSubcategoryId}</strong>
              </>
            )}
          </div>
          {(selectedSubcategoryId || searchInput) && (
            <button
              type="button"
              onClick={() => {
                setSelectedSubcategoryId(null);
                setSearchInput("");
              }}
              className="text-[13px] text-[#8A5405] hover:text-[#241C2B] font-semibold underline bg-transparent border-0 cursor-pointer"
            >
              Wyczyść filtry i pokaż wszystkich
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((p) => (
            <article
              key={p.id}
              className="border border-[#E2D5CA] rounded-[18px] bg-white overflow-hidden flex flex-col shadow-xs hover:shadow-md transition-shadow"
            >
              <div className={`h-[168px] ${p.bgColor}`} />
              <div className="p-5 sm:p-6 flex flex-col grow">
                <div className="text-[13px] text-[#3F5142] mb-1 font-medium">{p.category}</div>
                <h3 className="m-0 mb-2 font-fraunces font-medium text-[21px]">
                  <button
                    type="button"
                    onClick={() => navigate("Profil")}
                    className="text-[#241C2B] hover:text-[#8A5405] text-left bg-transparent border-0 cursor-pointer p-0 font-inherit"
                  >
                    {p.name}
                  </button>
                </h3>
                <p className="m-0 mb-3 text-[14px] leading-[1.6] text-[#6A5C70]">{p.base}</p>
                <p className="m-0 mb-3.5 text-[14px] leading-[1.6] text-[#3E3344] line-clamp-2">
                  {p.description}
                </p>

                <div className="flex gap-2 flex-wrap mb-4">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[12px] text-[#3F5142] bg-[#E7EDE7] rounded-[8px] px-2.5 py-1.5 font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-3 flex items-end justify-between gap-3 border-t border-[#EFE5DD]">
                  <div>
                    <div className="font-fraunces text-[22px] font-medium text-[#241C2B]">
                      {p.price}
                    </div>
                    <div className="text-[12px] text-[#6A5C70]">{p.unit}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("Zapytanie")}
                    className="text-[14px] font-semibold text-[#241C2B] border-[1.5px] border-[#241C2B] rounded-[10px] px-4 py-2 hover:bg-[#241C2B] hover:text-white transition-colors cursor-pointer bg-transparent"
                  >
                    Zapytaj
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Footer navigate={navigate} />
    </div>
  );
}

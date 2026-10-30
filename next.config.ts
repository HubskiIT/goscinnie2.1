import type { NextConfig } from "next";
import { PLATNOSCI_WLACZONE } from "./lib/serwis";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Trasy, które nic nie renderują, tylko odsyłają dalej.
   *
   * Tu, a nie w `page.tsx`, bo przekierowanie ze strony pod `app/(panel)/`
   * jest poprzedzone layoutem panelu, a layout czyta `headers()` i ustala
   * widza, czyli pięć zapytań tożsamościowych. Przy `/panel/abonament`
   * liczyło się to dwa razy, bo celem jest `/panel`, znowu pod tym samym
   * layoutem. Przekierowanie z konfiguracji dzieje się przed renderowaniem
   * czegokolwiek, więc nie kosztuje ani jednego zapytania, a router Next
   * idzie za nim tak samo przy nawigacji klienckiej.
   *
   * `PLATNOSCI_WLACZONE` zostaje jedynym źródłem prawdy: jest stałą w kodzie
   * (lib/serwis.ts tłumaczy, dlaczego nie zmienną środowiskową), więc ta
   * konfiguracja czyta dokładnie tę samą wartość, co ekrany pod nią.
   *
   * `permanent: false`, bo oba przekierowania opisują dzisiejszy stan serwisu,
   * a nie zmianę adresu. Przeglądarka, która zapamiętałaby je na stałe,
   * nie trafiłaby już nigdy na ekran zamówienia abonamentu po włączeniu
   * płatności.
   */
  async redirects() {
    return [
      // Profil edytuje się tym samym kreatorem, którym się go dodaje.
      { source: "/panel/profil", destination: "/rejestracja-firmy", permanent: false },
      // Płatności wyłączone: zamawiania abonamentu nie pokazujemy.
      ...(PLATNOSCI_WLACZONE
        ? []
        : [{ source: "/panel/abonament", destination: "/panel", permanent: false }]),
    ];
  },

  experimental: {
    serverActions: {
      /*
       * Ile wolno przysłać do akcji serwerowej.
       *
       * DOMYŚLNA WARTOŚĆ TO 1 MB i to ona psuła wysyłkę zdjęć. Powyżej niej
       * Next odrzuca żądanie wyjątkiem `ApiError 413`
       * (server/app-render/action-handler.js), zanim akcja zdąży się wykonać.
       * Formularz obiecywał 8 MB, więc praktycznie każde zdjęcie z telefonu
       * dostawało 413, a `WysylkaZdjec` nie łapał tego wyjątku i milczał.
       *
       * Dlaczego akurat 4,5 MB, a nie tyle, ile wynosi MAKS_BAJTOW: Vercel
       * ucina ciało żądania na 4,5 MB na poziomie infrastruktury i żadna
       * opcja tego nie podnosi (FUNCTION_PAYLOAD_TOO_LARGE). Wpisanie tu
       * większej liczby dałoby limit, który działa lokalnie i nie działa na
       * produkcji, czyli najgorszy rodzaj limitu.
       *
       * MAKS_BAJTOW w lib/zdjecia/granice.ts jest o pół megabajta niższe
       * i musi takie zostać: różnica to narzut multipart, czyli nagłówki
       * części i nazwa pliku, które jadą razem z bajtami zdjęcia.
       */
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

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

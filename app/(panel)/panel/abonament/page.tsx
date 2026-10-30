import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ZamowienieAbonamentuScreen } from "@/components/screens/ZamowienieAbonamentuScreen";
import { PLATNOSCI_WLACZONE } from "@/lib/serwis";

export const metadata: Metadata = {
  title: "Abonament",
  description: "Zamówienie abonamentu.",
};

export default function Strona() {
  /*
   * Płatności wyłączone (lib/serwis.ts): zamawiania abonamentu nie pokazujemy.
   *
   * Przy wyłączonych płatnościach to sprawdzenie nie ma kiedy zadziałać, bo
   * `next.config.ts` odsyła z tego adresu, zanim cokolwiek się wyrenderuje.
   * Zostaje jako zamek: konfiguracja opisuje trasę, a ten warunek pilnuje
   * samego ekranu, więc pomyłka w jednym miejscu nie wystawia cennika,
   * za którym nie stoją płatności.
   */
  if (!PLATNOSCI_WLACZONE) redirect("/panel");
  return <ZamowienieAbonamentuScreen />;
}

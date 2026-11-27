import { headers } from "next/headers";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PasekMobilny } from "@/components/PasekMobilny";
import { widzZZadania } from "@/lib/auth/widz";
import { mozeModerowac } from "@/lib/permissions";

export default async function LayoutPubliczny({ children }: { children: React.ReactNode }) {
  // Nagłówek musi wiedzieć, czy ktoś jest zalogowany, a sam tego nie ustali:
  // jest komponentem klienckim i nie ma dostępu do ciasteczka sesji.
  const widz = await widzZZadania(await headers());

  return (
    <>
      <Header zalogowany={widz.rodzaj !== "anonim"} moderator={mozeModerowac(widz).wolno} />
      {children}
      <Footer />
      <PasekMobilny />
    </>
  );
}

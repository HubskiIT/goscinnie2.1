import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PasekMobilny } from "@/components/PasekMobilny";

export default function LayoutPubliczny({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <PasekMobilny />
    </>
  );
}

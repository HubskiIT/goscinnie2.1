import { Header } from "@/components/Header";

export default function LayoutPanelu({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}

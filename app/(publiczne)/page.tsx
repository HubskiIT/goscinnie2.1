import type { Metadata } from "next";
import { MainScreen } from "@/components/screens/MainScreen";

export const metadata: Metadata = {
  title: "Gościnnie",
  description:
    "Miejsca i ludzie na każdą okazję, od chrzcin po firmową wigilię. Zero prowizji od umów.",
};

export default function Strona() {
  return <MainScreen />;
}

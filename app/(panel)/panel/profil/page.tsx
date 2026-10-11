import { redirect } from "next/navigation";

/**
 * Profil edytuje się tym samym kreatorem, którym się go dodaje.
 * Wcześniej stał tu ekran prototypu z wpisanymi na sztywno cudzymi danymi.
 */
export default function Strona() {
  redirect("/rejestracja-firmy");
}

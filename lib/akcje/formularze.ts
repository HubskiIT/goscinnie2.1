"use server";

import type { ZodType } from "zod";
import type { StanFormularza } from "@/lib/formularze";
import {
  schematAbonamentu,
  schematKontaktu,
  schematLogowania,
  schematOferty,
  schematRejestracji,
  schematZapytania,
  schematZgloszenia,
  schematZlecenia,
} from "@/lib/validators/formularze";

/**
 * Wspólna obsługa: sprawdź pola, zwróć błędy albo komunikat o budowie.
 *
 * Walidacja dzieje się na serwerze, więc działa też z wyłączonym
 * JavaScriptem. Nic nie zapisujemy, bo nie ma jeszcze gdzie.
 */
function sprawdz(schemat: ZodType, dane: FormData): StanFormularza {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = schemat.safeParse(wejscie);
  if (!wynik.success) {
    const bledy: Record<string, string[]> = {};
    for (const problem of wynik.error.issues) {
      const pole = String(problem.path[0] ?? "_");
      const dotychczasowe = bledy[pole] ?? [];
      dotychczasowe.push(problem.message);
      bledy[pole] = dotychczasowe;
    }
    const wartosci: Record<string, string> = {};
    for (const [pole, wartosc] of Object.entries(wejscie)) {
      if (typeof wartosc === "string") wartosci[pole] = wartosc;
    }
    return { status: "bledy", bledy, wartosci };
  }
  return { status: "wbudowie" };
}

export async function wyslijZapytanie(_poprzedni: StanFormularza, dane: FormData) {
  return sprawdz(schematZapytania, dane);
}

export async function wyslijZlecenie(_poprzedni: StanFormularza, dane: FormData) {
  return sprawdz(schematZlecenia, dane);
}

export async function wyslijKontakt(_poprzedni: StanFormularza, dane: FormData) {
  return sprawdz(schematKontaktu, dane);
}

export async function wyslijZgloszenie(_poprzedni: StanFormularza, dane: FormData) {
  return sprawdz(schematZgloszenia, dane);
}

export async function wyslijRejestracje(_poprzedni: StanFormularza, dane: FormData) {
  return sprawdz(schematRejestracji, dane);
}

export async function wyslijOferte(_poprzedni: StanFormularza, dane: FormData) {
  return sprawdz(schematOferty, dane);
}

export async function wyslijZamowienieAbonamentu(_poprzedni: StanFormularza, dane: FormData) {
  return sprawdz(schematAbonamentu, dane);
}

export async function zaloguj(_poprzedni: StanFormularza, dane: FormData) {
  return sprawdz(schematLogowania, dane);
}

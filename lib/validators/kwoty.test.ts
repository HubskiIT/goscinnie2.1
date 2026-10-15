/**
 * Kwoty wpisane przez człowieka: komunikat musi być po polsku i musi mówić,
 * co jest nie tak.
 *
 * Reguła, na której stoi ten plik: **żaden komunikat walidacji kwoty nie jest
 * komunikatem Zoda**. Wcześniej schemat był unią z pustym napisem, a Zod przy
 * niepowodzeniu wszystkich gałęzi unii zasłania komunikaty gałęzi własnym
 * `Invalid input`. Pod polem „Cena od" stało więc angielskie „Invalid input".
 *
 * Czułość sprawdzona: po powrocie do `z.union([z.literal(""), ...])` padają
 * testy „tekst zamiast liczby dostaje polski komunikat" oraz „zero i kwota
 * poza granicą mają własne komunikaty".
 */
import { describe, expect, it } from "vitest";
import { kwotaZlotowkiOpcjonalna, MAKS_KWOTA_ZLOTOWKI } from "./kwoty";

const cena = kwotaZlotowkiOpcjonalna("Cena");

/** Pierwszy komunikat odmowy albo `null`, gdy schemat przyjął wartość. */
function odmowa(wejscie: unknown): string | null {
  const wynik = cena.safeParse(wejscie);
  return wynik.success ? null : (wynik.error.issues[0]?.message ?? "");
}

describe("kwotaZlotowkiOpcjonalna", () => {
  it("złotówki zamienia na grosze", () => {
    expect(cena.parse("180")).toBe(18_000);
    expect(cena.parse("180.50")).toBe(18_050);
  });

  it("pusto znaczy „nie podano”, a nie zero", () => {
    expect(cena.parse("")).toBeNull();
    expect(cena.parse("   ")).toBeNull();
  });

  it("tekst zamiast liczby dostaje polski komunikat", () => {
    expect(odmowa("sto osiemdziesiąt")).toBe("Cena musi być liczbą.");
    expect(odmowa("do ustalenia")).toBe("Cena musi być liczbą.");
  });

  it("zero i kwota poza granicą mają własne komunikaty", () => {
    // Trzy różne pomyłki, trzy różne komunikaty. Jeden wspólny znaczyłby,
    // że człowiek sam musi się domyślić, która to jego.
    expect(odmowa("0")).toBe("Cena musi być większa od zera.");
    expect(odmowa(String(MAKS_KWOTA_ZLOTOWKI + 1))).toBe("Ta kwota wygląda na pomyłkę.");
  });

  it("nazwa pola wchodzi do komunikatu", () => {
    // Ten sam schemat obsługuje cenę w kreatorze i budżet w zleceniu.
    const budzet = kwotaZlotowkiOpcjonalna("Budżet");
    const wynik = budzet.safeParse("tyle, ile trzeba");

    expect(wynik.success).toBe(false);
    if (wynik.success) return;
    expect(wynik.error.issues[0]?.message).toBe("Budżet musi być liczbą.");
  });
});

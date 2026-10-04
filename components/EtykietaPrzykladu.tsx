/**
 * Dopóki ogłoszenia nie zastąpi prawdziwa firma, musi być widoczne, że jest
 * przykładowe. Punkt 6.5 planu: pokazanie zmyślonej firmy jako istniejącej
 * wprowadzałoby ludzi w błąd.
 */
export function EtykietaPrzykladu() {
  return (
    <span className="text-[12px] font-bold uppercase tracking-wider text-[#6A5C70] bg-[#EDE6E9] rounded-[8px] px-2.5 py-1">
      Ogłoszenie przykładowe
    </span>
  );
}

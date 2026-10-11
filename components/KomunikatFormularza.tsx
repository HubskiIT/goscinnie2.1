import { KOMUNIKAT_W_BUDOWIE, type StanFormularza } from "@/lib/formularze";

/**
 * Jeden komponent na oba wyniki wysłania formularza: listę błędów
 * albo komunikat, że serwis jest w budowie.
 */
export function KomunikatFormularza({ stan }: { stan: StanFormularza }) {
  // Udany zapis nie ma tu nic do powiedzenia: o tym, że się udało, mówi
  // przejście do kolejnego kroku, a nie pasek nad formularzem.
  if (stan.status === "poczatkowy" || stan.status === "zapisano") return null;

  if (stan.status === "informacja") {
    return (
      <p
        role="status"
        className="m-0 rounded-[12px] border border-[#D9CCC2] bg-[#F2E9E2] p-4 text-[15px] leading-[1.6] text-[#3E3344]"
      >
        {stan.tresc}
      </p>
    );
  }

  if (stan.status === "wbudowie") {
    return (
      <p
        role="status"
        className="m-0 rounded-[12px] border border-[#C7D6C8] bg-[#E7EDE7] p-4 text-[15px] leading-[1.6] text-[#3F5142]"
      >
        {KOMUNIKAT_W_BUDOWIE}
      </p>
    );
  }

  const komunikaty = Object.values(stan.bledy).flat();
  return (
    <div
      role="alert"
      className="rounded-[12px] border border-[#D8B4A0] bg-[#F7E9E2] p-4 text-[15px] leading-[1.6] text-[#7A3B1E]"
    >
      <p className="m-0 mb-1.5 font-semibold">Popraw te pola, zanim wyślesz:</p>
      <ul className="m-0 list-disc pl-5">
        {komunikaty.map((komunikat) => (
          <li key={komunikat}>{komunikat}</li>
        ))}
      </ul>
    </div>
  );
}

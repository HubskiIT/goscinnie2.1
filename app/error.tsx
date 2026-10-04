"use client";

export default function Blad({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 sm:px-8 md:px-[130px] py-20 flex flex-col items-center text-center gap-4">
      <h1 className="m-0 font-fraunces font-normal text-[32px] sm:text-[40px] text-[#241C2B] tracking-tight">
        Coś poszło nie tak
      </h1>
      <p className="m-0 max-w-[560px] text-[16px] leading-[1.7] text-[#6A5C70]">
        Spróbuj jeszcze raz. Jeśli błąd się powtarza, napisz do nas.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 text-[16px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors rounded-[12px] px-6 py-3.5 border-0 cursor-pointer"
      >
        Spróbuj ponownie
      </button>
    </main>
  );
}

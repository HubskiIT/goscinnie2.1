import Link from "next/link";

export function LejekKonwersji() {
  return (
    <section className="px-6 sm:px-12 md:px-[130px] pb-16 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-[20px] bg-[#241C2B] text-[#FBF7F4] p-7 sm:p-8 flex flex-col justify-between gap-5">
          <div>
            <div className="text-[12px] font-bold uppercase tracking-wider text-[#F0A62E] mb-2">
              Dla organizujących uroczystość
            </div>
            <h2 className="m-0 mb-2 font-fraunces font-normal text-[26px] leading-[1.25] text-[#FBF7F4]">
              Nie masz czasu dzwonić po 20 miejscach?
            </h2>
            <p className="m-0 text-[15px] leading-[1.6] text-[#D5C7D0]">
              Opisz wydarzenie raz, a lokale i usługodawcy z okolicy sami przyślą Ci ceny.
              Bezpłatnie i bez podawania numeru telefonu.
            </p>
          </div>
          <div>
            <Link
              href="/dodaj-zlecenie"
              className="inline-block text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors rounded-[12px] px-6 py-3"
            >
              Wystaw zlecenie za darmo
            </Link>
          </div>
        </div>

        <div className="rounded-[20px] border border-[#E2D5CA] bg-white p-7 sm:p-8 flex flex-col justify-between gap-5">
          <div>
            <div className="text-[12px] font-bold uppercase tracking-wider text-[#3F5142] mb-2">
              Dla lokali i usługodawców
            </div>
            <h2 className="m-0 mb-2 font-fraunces font-normal text-[26px] leading-[1.25] text-[#241C2B]">
              Prowadzisz salę, restaurację lub usługi?
            </h2>
            <p className="m-0 text-[15px] leading-[1.6] text-[#55485A]">
              Dodaj swój profil w 3 minuty. Odbieraj zapytania od klientów i zapowiadaj imprezy
              otwarte — 0 zł na start i 0% prowizji.
            </p>
          </div>
          <div>
            <Link
              href="/rejestracja-firmy"
              className="inline-block text-[15px] font-bold text-[#241C2B] border-[1.5px] border-[#241C2B] hover:bg-[#241C2B] hover:text-white transition-colors rounded-[12px] px-6 py-3"
            >
              Dodaj firmę bezpłatnie
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { wylogujSie } from "@/lib/akcje/logowanie";
import type { MojaFirma } from "@/lib/db/queries/katalog";

interface PanelScreenProps {
  firmy: readonly MojaFirma[];
  /** Po publikacji kreator wraca tu z ?opublikowano=1. */
  poPublikacji: boolean;
}

const PRZYCISK =
  "inline-block text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] transition-colors rounded-[12px] px-5 py-3";
const PRZYCISK_OBRYS =
  "inline-block text-[15px] font-semibold text-[#241C2B] border-[1.5px] border-[#241C2B] rounded-[12px] px-5 py-2.5 hover:bg-[#241C2B] hover:text-white transition-colors bg-white";

/**
 * Panel po zalogowaniu.
 *
 * Pokazuje prawdziwy stan z bazy: firmy tego konta i to, czy są w katalogu.
 * Statystyk, wiadomości i kalendarza tu nie ma, bo ich jeszcze nie zbieramy.
 */
export function PanelScreen({ firmy, poPublikacji }: PanelScreenProps) {
  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 sm:px-12 md:px-[130px] pt-12 pb-20 bg-[#FBF7F4] text-[#241C2B]">
      <h1 className="m-0 mb-8 font-fraunces font-normal text-[34px] sm:text-[42px] tracking-tight">
        Twój panel
      </h1>

      {poPublikacji ? (
        <p
          role="status"
          className="m-0 mb-8 max-w-[720px] rounded-[12px] border border-[#C7D6C8] bg-[#E7EDE7] p-4 text-[15px] leading-[1.6] text-[#3F5142]"
        >
          Gotowe. Firma jest w katalogu i klienci mogą ją znaleźć w wyszukiwarce.
        </p>
      ) : null}

      {firmy.length === 0 ? (
        <section className="max-w-[720px] border border-[#E2D5CA] rounded-[20px] bg-white p-7">
          <h2 className="m-0 mb-2 font-fraunces font-medium text-[24px]">
            Nie masz jeszcze firmy w katalogu
          </h2>
          <p className="m-0 mb-5 text-[15px] leading-[1.6] text-[#6A5C70]">
            Dodanie firmy zajmuje kilka minut i jest bezpłatne.
          </p>
          <Link href="/rejestracja-firmy" className={PRZYCISK}>
            Dodaj firmę
          </Link>
        </section>
      ) : (
        <ul className="m-0 p-0 list-none flex flex-col gap-4 max-w-[720px]">
          {firmy.map((firma) => (
            <li key={firma.slug} className="border border-[#E2D5CA] rounded-[20px] bg-white p-7">
              <h2 className="m-0 mb-1 font-fraunces font-medium text-[24px]">{firma.nazwa}</h2>
              <p className="m-0 mb-5 text-[15px] text-[#6A5C70]">{opisStanu(firma)}</p>
              <div className="flex flex-wrap gap-3">
                {firma.status === "draft" ? (
                  <Link href="/rejestracja-firmy" className={PRZYCISK}>
                    Dokończ dodawanie
                  </Link>
                ) : null}
                {firma.wKatalogu ? (
                  <>
                    <Link href={`/f/${firma.slug}`} className={PRZYCISK}>
                      Zobacz profil
                    </Link>
                    <Link href="/rejestracja-firmy?krok=3" className={PRZYCISK_OBRYS}>
                      Edytuj profil
                    </Link>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={wylogujSie} className="mt-10">
        <button
          type="submit"
          className="text-[15px] font-semibold text-[#6A5C70] hover:text-[#241C2B] bg-transparent border-0 p-0 cursor-pointer"
        >
          Wyloguj się
        </button>
      </form>
    </main>
  );
}

function opisStanu(firma: MojaFirma): string {
  if (firma.wKatalogu) return "W katalogu. Klienci widzą profil i znajdują go w wyszukiwarce.";
  if (firma.status === "draft") return "Szkic. Firma nie jest jeszcze widoczna dla klientów.";
  if (firma.status === "suspended") {
    return "Profil jest zawieszony. Napisz do nas przez stronę kontaktu, wyjaśnimy dlaczego.";
  }
  return "Profil nie jest teraz widoczny w katalogu. Napisz do nas przez stronę kontaktu.";
}

import Link from "next/link";
import { wylogujSie } from "@/lib/akcje/logowanie";
import type { MojaFirma } from "@/lib/db/queries/katalog";

interface PanelScreenProps {
  firmy: readonly MojaFirma[];
  /** Po publikacji kreator wraca tu z ?opublikowano=1. */
  poPublikacji: boolean;
  /**
   * Czy pokazać wejście do panelu moderacji.
   *
   * Rozstrzyga o tym strona, pytając `mozeModerowac`. Komponent nie zna
   * roli widza i nie powinien: drugie miejsce decydujące o uprawnieniach
   * to drugie miejsce, w którym da się je pomylić. Tutaj to tylko
   * odnośnik, bo prawdziwą bramą jest sama trasa /moderacja.
   */
  moderator: boolean;
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
export function PanelScreen({ firmy, poPublikacji, moderator }: PanelScreenProps) {
  return (
    <main className="w-full max-w-[1440px] mx-auto px-6 sm:px-12 md:px-[130px] pt-12 pb-20 bg-[#FBF7F4] text-[#241C2B]">
      <h1 className="m-0 mb-8 font-fraunces font-normal text-[34px] sm:text-[42px] tracking-tight">
        Twój panel
      </h1>

      {moderator ? (
        <section className="max-w-[720px] mb-8 border border-[#E2D5CA] rounded-[20px] bg-white p-7">
          <h2 className="m-0 mb-2 font-fraunces font-medium text-[24px]">Moderacja</h2>
          <p className="m-0 mb-5 text-[15px] leading-[1.6] text-[#6A5C70]">
            Wpisy czekające na Twoją decyzję.
          </p>
          <Link href="/moderacja" className={PRZYCISK}>
            Otwórz kolejkę
          </Link>
        </section>
      ) : null}

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

              <StanModeracji stan={firma.stanModeracji} />
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
                {/*
                  Odesłany wpis dostaje drogę powrotną od razu, bez szukania
                  jej w menu. Prowadzi do kroku z opisem, bo tam trafia
                  większość uwag moderacji; resztę kreator ma na pasku kroków.
                */}
                {firma.stanModeracji.rodzaj === "odrzucony" ? (
                  <Link href="/rejestracja-firmy?krok=3" className={PRZYCISK}>
                    Popraw i wyślij ponownie
                  </Link>
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

/**
 * Co moderacja powiedziała o tym wpisie.
 *
 * Osobny blok nad przyciskami, a nie zdanie w opisie stanu, bo odmowa
 * niesie komentarz od człowieka i ma go być widać. Komentarz wciśnięty
 * w jedno zdanie obok „nie jesteś w katalogu” czyta się jak komunikat
 * systemowy, a jest wiadomością do przeczytania i wykonania.
 *
 * Stan przyjęty nie rysuje niczego: „wszystko w porządku” powtórzone przy
 * każdej firmie przy każdym wejściu do panelu przestaje cokolwiek znaczyć,
 * a o tym, że wpis jest w katalogu, mówi już zdanie wyżej.
 */
function StanModeracji({ stan }: { stan: MojaFirma["stanModeracji"] }) {
  if (stan.rodzaj === "nigdy-nie-zgloszony" || stan.rodzaj === "przyjety") return null;

  if (stan.rodzaj === "czeka") {
    return (
      <p className="m-0 mb-5 rounded-[12px] border border-[#E2D5CA] bg-[#F7F1EB] p-4 text-[15px] leading-[1.6] text-[#55485A]">
        Wpis czeka na sprawdzenie. Odezwiemy się mailem, gdy tylko będzie decyzja. Do tego czasu
        klienci go nie widzą.
      </p>
    );
  }

  return (
    <div className="mb-5 rounded-[12px] border border-[#D8B4A0] bg-[#F7E9E2] p-4">
      <p className="m-0 mb-2 text-[15px] font-bold text-[#7A3B1E]">Wpis wrócił do poprawki</p>
      {/*
        `whitespace-pre-line`, bo komentarz bywa listą rzeczy do zmiany
        rozpisaną w kilku linijkach. Zlanie ich w jeden akapit zamienia
        czytelną listę w ścianę tekstu.
      */}
      <p className="m-0 mb-3 text-[15px] leading-[1.6] text-[#241C2B] whitespace-pre-line">
        {stan.powod}
      </p>
      <p className="m-0 text-[14px] leading-[1.6] text-[#7A3B1E]">
        Popraw wpis i wyślij go ponownie. Nic nie przepadło: wszystko, co wpisałeś, czeka tak, jak
        było.
      </p>
    </div>
  );
}

function opisStanu(firma: MojaFirma): string {
  /*
   * Oczekiwanie na decyzję rozstrzyga przed wszystkim innym. Bez tego
   * firma czekająca na sprawdzenie dostawała zdanie „profil nie jest
   * widoczny, napisz do nas przez stronę kontaktu”, czyli prośbę
   * o napisanie w sprawie, która właśnie się toczy.
   */
  if (firma.stanModeracji.rodzaj === "czeka") {
    return "Wpis jest kompletny i czeka na sprawdzenie.";
  }
  if (firma.stanModeracji.rodzaj === "odrzucony") {
    return "Wpis wymaga poprawki, zanim trafi do katalogu.";
  }
  if (firma.wKatalogu) return "W katalogu. Klienci widzą profil i znajdują go w wyszukiwarce.";
  if (firma.status === "draft") return "Szkic. Firma nie jest jeszcze widoczna dla klientów.";
  if (firma.status === "suspended") {
    return "Profil jest zawieszony. Napisz do nas przez stronę kontaktu, wyjaśnimy dlaczego.";
  }
  return "Profil nie jest teraz widoczny w katalogu. Napisz do nas przez stronę kontaktu.";
}

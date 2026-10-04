/**
 * Limity prób logowania. Dwa niezależne, bo chronią przed dwoma różnymi rzeczami.
 *
 * Limit po adresie IP zatrzymuje kogoś, kto próbuje wielu haseł do wielu kont
 * z jednej maszyny. Limit po koncie zatrzymuje rozproszony atak na jedno konkretne
 * konto, w którym każde żądanie przychodzi z innego adresu. Sam limit po IP
 * tego drugiego nie łapie i odwrotnie.
 *
 * Wierszy nie kasujemy, zgodnie z zasadą 5. Okno przesuwa się przez nadpisanie
 * `window_start`, a nie przez zniknięcie wiersza.
 */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/** Ile nieudanych prób w oknie i jak długie jest okno. */
export const LIMIT_PO_KONCIE = { proby: 5, oknoSekund: 15 * 60 } as const;
export const LIMIT_PO_IP = { proby: 20, oknoSekund: 15 * 60 } as const;

/**
 * Zapisuje próbę i mówi, czy mieści się jeszcze w limicie.
 *
 * Całość to jedna instrukcja z `on conflict`, więc dwa równoległe żądania nie
 * potrafią policzyć się nawzajem podwójnie ani się zgubić. Liczenie w kodzie
 * aplikacji, przez odczyt i zapis, przepuściłoby atak zrównoleglony.
 */
export async function zuzyjProbe(
  klucz: string,
  limit: { proby: number; oknoSekund: number },
): Promise<{ wolno: boolean; zuzyte: number }> {
  const wynik = await db.execute<{ count: number }>(sql`
    insert into rate_limits (key, count, window_start)
    values (${klucz}, 1, now())
    on conflict (key) do update set
      count = case
        when rate_limits.window_start < now() - make_interval(secs => ${limit.oknoSekund})
          then 1
        else rate_limits.count + 1
      end,
      window_start = case
        when rate_limits.window_start < now() - make_interval(secs => ${limit.oknoSekund})
          then now()
        else rate_limits.window_start
      end,
      updated_at = now()
    returning count
  `);

  const zuzyte = Number(wynik[0]?.count ?? 0);
  return { wolno: zuzyte <= limit.proby, zuzyte };
}

/** Klucz limitu dla konta. Mail normalizujemy, żeby wielkość liter nie omijała limitu. */
export function kluczKonta(email: string): string {
  return `logowanie:konto:${email.trim().toLowerCase()}`;
}

/** Klucz limitu dla adresu IP. */
export function kluczIp(ip: string): string {
  return `logowanie:ip:${ip}`;
}

/**
 * Nagłówek, któremu ufamy na produkcji.
 *
 * Vercel nadpisuje `x-vercel-forwarded-for` na swoim brzegu, więc klient nie
 * jest w stanie go podrobić. Surowy `x-forwarded-for` klient dopisuje sam
 * i przy zaufaniu mu limit po adresie IP staje się ozdobą: atakujący podaje
 * nowy adres przy każdej próbie, każda zakłada nowy licznik i nic nie blokuje.
 *
 * Patrz docs/decyzje/003.
 */
const NAGLOWEK_ZAUFANY = "x-vercel-forwarded-for";

/**
 * Adres IP żądania. Za odwrotnym proxy prawdziwy adres jest w nagłówku,
 * a nie w połączeniu.
 *
 * Kolejność ma znaczenie i nie jest kwestią gustu:
 *
 *   1. nagłówek dostawcy, jedyny niepodrabialny z zewnątrz
 *   2. `x-forwarded-for` WYŁĄCZNIE poza produkcją, do pracy lokalnej i testów
 *   3. wartość zastępcza, gdy nie ma żadnego
 *
 * Na produkcji surowego `x-forwarded-for` nie czytamy wcale. Lepszy jeden
 * wspólny licznik dla żądań bez nagłówka dostawcy niż licznik, który atakujący
 * resetuje sobie sam.
 */
export function adresIp(naglowki: Headers): string {
  const odDostawcy = naglowki.get(NAGLOWEK_ZAUFANY);
  if (odDostawcy) {
    const pierwszy = odDostawcy.split(",")[0]?.trim();
    if (pierwszy) return pierwszy;
  }

  if (process.env.NODE_ENV !== "production") {
    const lokalny = naglowki.get("x-forwarded-for");
    const pierwszy = lokalny?.split(",")[0]?.trim();
    if (pierwszy) return pierwszy;
  }

  return "nieznany";
}

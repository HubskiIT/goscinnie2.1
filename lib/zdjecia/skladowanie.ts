/**
 * Składowanie zdjęć w Supabase Storage.
 *
 * DLACZEGO SUPABASE, A NIE KOLEJNY DOSTAWCA. Baza już tam stoi, więc nie
 * dokładamy trzeciego rachunku obok Vercela i Resend. Darmowy próg to 1 GB,
 * co przy zdjęciach po obróbce ważących około 200 kB wystarcza na kilka
 * tysięcy — czyli na długo dłużej niż na start.
 *
 * DLACZEGO PRZEZ `fetch`, A NIE PRZEZ BIBLIOTEKĘ SUPABASE. Potrzebujemy
 * dwóch operacji: wyślij plik i zbuduj adres. Pełny klient to kilkaset
 * kilobajtów zależności i drugie miejsce, w którym żyje konfiguracja
 * połączenia z Supabase, obok `DATABASE_URL`.
 *
 * KLUCZ SERWISOWY OMIJA REGUŁY DOSTĘPU SUPABASE, więc ten moduł nie ma prawa
 * trafić do kodu wysyłanego do przeglądarki. Importują go wyłącznie akcje
 * serwerowe i warstwa zapytań. Nie wołaj go z komponentu klienckiego i nie
 * reeksportuj przez moduł, który taki komponent wczytuje.
 */

/** Kosz na zdjęcia. Publiczny do odczytu, bo karty w katalogu są publiczne. */
export const KOSZ = "zdjecia";

export type BladSkladowania = { powod: "konfiguracja" | "wysylka"; opis: string };

export type WynikWysylki = { ok: true; sciezka: string } | { ok: false; blad: BladSkladowania };

type Konfiguracja = { adres: string; klucz: string };

/**
 * Adres projektu, bez klucza.
 *
 * Osobno od `konfiguracja`, bo publiczny adres zdjęcia nie ma nic wspólnego
 * z kluczem do zapisu. Gdy jedna funkcja odpowiadała za jedno i drugie, brak
 * klucza ukrywał **wszystkie** zdjęcia, także te dawno wysłane: odczyt padał
 * na warunku, który dotyczy wyłącznie zapisu.
 */
function adresProjektu(srodowisko: NodeJS.ProcessEnv = process.env): string | null {
  const adres = srodowisko.SUPABASE_URL?.trim();
  if (!adres) return null;

  return adres.replace(/\/+$/, "");
}

/**
 * Adres projektu i klucz serwisowy, czyli komplet potrzebny do wysłania.
 *
 * Brak którejkolwiek zmiennej to błąd konfiguracji, nie pusty wynik: firma
 * dostałaby wtedy komunikat „nie udało się wysłać zdjęcia" bez żadnego śladu,
 * dlaczego, a przyczyna byłaby po naszej stronie.
 */
function konfiguracja(srodowisko: NodeJS.ProcessEnv = process.env): Konfiguracja | null {
  const adres = adresProjektu(srodowisko);
  const klucz = srodowisko.SUPABASE_KLUCZ_SERWISOWY?.trim();

  if (!adres || !klucz) return null;
  return { adres, klucz };
}

/**
 * Publiczny adres zdjęcia. Składany przy odczycie, nie zapisywany w bazie.
 *
 * `null`, a nie pusty napis, gdy brakuje konfiguracji: pusty napis w `src`
 * obrazka znaczy dla przeglądarki „pobierz jeszcze raz tę stronę", a dla
 * człowieka wygląda jak zepsute zdjęcie. `null` da się odfiltrować.
 */
export function adresZdjecia(
  sciezka: string,
  srodowisko: NodeJS.ProcessEnv = process.env,
): string | null {
  const adres = adresProjektu(srodowisko);
  if (!adres) return null;

  return `${adres}/storage/v1/object/public/${KOSZ}/${sciezka}`;
}

/**
 * Ścieżka pliku w koszu.
 *
 * Identyfikator firmy w ścieżce, żeby dało się sprzątnąć po firmie jednym
 * prefiksem. Losowy człon, żeby adres poprzedniego zdjęcia przestał działać
 * po podmianie — bez niego firma podmieniłaby zdjęcie, a pamięci podręczne
 * pokazywałyby stare.
 */
export function sciezkaZdjecia(companyId: string, pozycja: number): string {
  return `${companyId}/${pozycja}-${crypto.randomUUID()}.webp`;
}

export async function wyslijZdjecie(
  sciezka: string,
  dane: Buffer,
  pobierz: typeof fetch = globalThis.fetch,
  srodowisko: NodeJS.ProcessEnv = process.env,
): Promise<WynikWysylki> {
  const ustawienia = konfiguracja(srodowisko);

  if (!ustawienia) {
    return {
      ok: false,
      blad: {
        powod: "konfiguracja",
        opis:
          "Brak SUPABASE_URL albo SUPABASE_KLUCZ_SERWISOWY. Bez nich zdjęcia nie mają " +
          "gdzie trafić. Ustaw zmienne w Vercel, patrz README.",
      },
    };
  }

  const odpowiedz = await pobierz(`${ustawienia.adres}/storage/v1/object/${KOSZ}/${sciezka}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ustawienia.klucz}`,
      "Content-Type": "image/webp",
      // Nadpisanie tej samej ścieżki nie powinno się zdarzyć, bo ścieżka
      // ma losowy człon. Gdyby się zdarzyło, lepiej się o tym dowiedzieć.
      "x-upsert": "false",
    },
    body: new Uint8Array(dane),
  });

  if (!odpowiedz.ok) {
    return {
      ok: false,
      blad: {
        powod: "wysylka",
        opis: `Supabase Storage zwróciło ${odpowiedz.status}: ${await odpowiedz.text()}`,
      },
    };
  }

  return { ok: true, sciezka };
}

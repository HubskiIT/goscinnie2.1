/**
 * Zapytania o konto człowieka: rola nadawana przy rejestracji i odczyt tej
 * roli po potwierdzeniu adresu.
 *
 * KONWENCJA MODUŁU: każda eksportowana funkcja przyjmuje widza jako pierwszy
 * argument i odmawia, zanim dotknie pozostałych. Pilnuje tego
 * tests/konwencja-zapytan.test.ts.
 *
 * CO ZNACZY `users.role`, A CZEGO NIE ZNACZY
 *
 * Rola jest **podpowiedzią nawigacyjną i niczym więcej**. Mówi, po co ktoś
 * przyszedł zakładać konto, więc wiadomo, dokąd go odesłać po wpisaniu kodu
 * z maila. Nie nadaje żadnych uprawnień i nigdy nie ma ich nadawać.
 *
 * O tym, w czyim imieniu ktoś działa, rozstrzyga członkostwo w
 * `company_members`, czytane przez `lib/auth/widz.ts`. Zasiew ma na to żywy
 * przykład: wnioskodawca po zatwierdzonym przejęciu profilu ma `role` równe
 * `client`, a jest widzem typu firma. Gdyby kiedykolwiek ktoś oparł na tej
 * kolumnie dostęp do czegokolwiek, rozminie się z rzeczywistością w dniu,
 * w którym ktoś doda człowieka do firmy.
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Wynik } from "@/lib/db/queries/wynik";
import { users } from "@/lib/db/schema/tozsamosc";
import { upewnijSieZeGalazUprawnienIstnieje, type Widz } from "@/lib/permissions";

/** Rola konta w rozumieniu kolumny `users.role`. */
export type RolaKonta = (typeof users.role.enumValues)[number];

/**
 * Oznacza świeżo założone konto jako firmowe.
 *
 * DLACZEGO TO WOŁA WIDZ ANONIMOWY. W chwili zakładania konta sesji jeszcze
 * nie ma: ciasteczko powstaje dopiero po potwierdzeniu adresu. Nie ma więc
 * zalogowanego, w którego imieniu dałoby się tu wystąpić.
 *
 * Bezpieczeństwo nie stoi na widzu, tylko na dwóch rzeczach naraz:
 *
 * 1. identyfikator pochodzi z odpowiedzi `signUpEmail`, czyli zna go wyłącznie
 *    serwer w tym jednym przebiegu. Z formularza nie przychodzi nic.
 * 2. `where` jest zawężone do konta **niepotwierdzonego i z rolą client**,
 *    czyli do konta założonego przed chwilą. Cudze konto, potwierdzone albo
 *    już oznaczone, nie da się tą drogą ruszyć, nawet gdyby ktoś zgadł uuid.
 *
 * Zwraca liczbę zmienionych wierszy, żeby wywołujący mógł to zalogować.
 * Zero nie jest błędem: znaczy tylko, że konto nie było świeże.
 */
export async function oznaczKontoJakoFirmowe(widz: Widz, userId: string): Promise<number> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "oznaczKontoJakoFirmowe");

  const zmienione = await db
    .update(users)
    .set({ role: "company_owner" })
    .where(and(eq(users.id, userId), eq(users.role, "client"), eq(users.emailVerified, false)))
    .returning({ id: users.id });

  return zmienione.length;
}

/**
 * Rola konta o podanym adresie.
 *
 * Czytane **po** poprawnym kodzie potwierdzającym, nie wcześniej. Kod
 * przyszedł na ten adres, więc ten, kto go wpisał, ma do niego dostęp —
 * to ten sam dowód tożsamości, na którym stoi cała weryfikacja.
 *
 * Sesji w tym momencie jeszcze nie widać: ciasteczko powstaje w odpowiedzi
 * na to samo żądanie, więc `widzZZadania` zwróciłby anonima. Stąd adres jako
 * argument, a nie identyfikator z sesji.
 *
 * `null` znaczy „nie wiadomo” i wywołujący ma to potraktować jak klienta,
 * bo to jest kierunek, w którym pomyłka nic nie odsłania.
 */
export async function rolaKonta(widz: Widz, email: string): Promise<RolaKonta | null> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "rolaKonta");

  const [wiersz] = await db
    .select({ rola: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return wiersz?.rola ?? null;
}

/** Profil klienta: to, co człowiek może o sobie zmienić na /moje. */
export type ProfilKlienta = {
  /** Adres jest tożsamością konta i tu się go nie zmienia. */
  email: string;
  imie: string;
  telefon: string | null;
};

/**
 * Profil zalogowanego człowieka.
 *
 * `null` dla anonima: panel i tak odeśle go do logowania, a wyjątek
 * w tym miejscu zamieniłby zwykłe wejście bez sesji w awarię.
 */
export async function pobierzProfilKlienta(widz: Widz): Promise<ProfilKlienta | null> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "pobierzProfilKlienta");

  if (widz.rodzaj === "anonim") return null;

  const [wiersz] = await db
    .select({ email: users.email, imie: users.name, telefon: users.phone })
    .from(users)
    .where(eq(users.id, widz.userId))
    .limit(1);

  return wiersz ?? null;
}

/**
 * Zapis profilu.
 *
 * Zmienia **wyłącznie wiersz pytającego**. Identyfikator użytkownika nie jest
 * tu argumentem i nie ma być: gdyby przychodził z formularza, byłby polem,
 * które da się podmienić, czyli drogą do edytowania cudzego konta.
 *
 * Pusty telefon zapisuje `null`, bo brak numeru to brak informacji, a nie
 * pusty napis. To `update`, nie `delete`: wiersz konta nie znika nigdy.
 */
export async function zapiszProfilKlienta(
  widz: Widz,
  dane: { imie: string; telefon: string | null },
): Promise<Wynik<{ id: string }>> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "zapiszProfilKlienta");

  if (widz.rodzaj === "anonim") return { ok: false, powod: "brak-dostepu" };

  const [zmienione] = await db
    .update(users)
    .set({ name: dane.imie, phone: dane.telefon, updatedAt: new Date() })
    .where(eq(users.id, widz.userId))
    .returning({ id: users.id });

  if (!zmienione) return { ok: false, powod: "brak-dostepu" };

  return { ok: true, dane: { id: zmienione.id } };
}

/**
 * Czy istnieje konto o tym adresie.
 *
 * Potrzebne, bo `createVerificationOTP` z better-auth **nie sprawdza istnienia
 * konta** — inaczej niż `sendVerificationOTP`, które dla nieznanego adresu
 * kasuje zgłoszenie i kończy bez wysyłki (email-otp/routes.mjs:102-105).
 * Bez tego sprawdzenia dowolny wpisany adres zostawiałby wiersz w `verification`
 * i dostawał od nas maila, czyli formularz stałby się narzędziem do wysyłania
 * poczty obcym ludziom.
 *
 * Wynik tej funkcji **nie ma prawa trafić do komunikatu** pokazywanego temu,
 * kto wpisał adres. Służy wyłącznie do rozstrzygnięcia, czy wysyłać.
 */
export async function czyKontoIstnieje(widz: Widz, email: string): Promise<boolean> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "czyKontoIstnieje");

  const [wiersz] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return wiersz !== undefined;
}

/**
 * Czy konto o tym adresie istnieje i wciąż czeka na potwierdzenie.
 *
 * Ponowne wysłanie kodu potwierdzającego ma sens tylko dla takiego konta.
 * Dla konta już potwierdzonego kod byłby do niczego, a jego wysłanie
 * powiadamiałoby właściciela o cudzej próbie.
 */
export async function czyKontoCzekaNaPotwierdzenie(widz: Widz, email: string): Promise<boolean> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "czyKontoCzekaNaPotwierdzenie");

  const [wiersz] = await db
    .select({ potwierdzony: users.emailVerified })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return wiersz !== undefined && !wiersz.potwierdzony;
}

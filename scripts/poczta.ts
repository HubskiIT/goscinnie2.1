/**
 * Czy poczta w ogóle zadziała. Jedno polecenie zamiast czytania logów produkcji.
 *
 * PO CO TO ISTNIEJE. Ustalenie, dlaczego kody nie dochodzą, zajęło kiedyś pół
 * dnia i sprowadzało się do wyciągnięcia jednej linii z logów Vercela.
 * Przyczyna była prozaiczna: domena nadawcy nie była zweryfikowana w Resend,
 * więc konto wysyłało wyłącznie na adres właściciela. Tego nie widać nigdzie
 * w serwisie, bo wysyłka kończy się po stronie Resend.
 *
 * Polecenie odpowiada na jedno pytanie: czy z tym nadawcą i tym kluczem
 * da się dziś wysłać pocztę do obcego człowieka.
 *
 * Użycie:  pnpm poczta:sprawdz
 * Kończy się kodem 1, gdy wysyłka jest niemożliwa, więc nadaje się na krok
 * odbioru przed wdrożeniem.
 */
import { z } from "zod";
import { domenaNadawcy } from "@/lib/poczta";
import { DOMYSLNY_NADAWCA } from "@/lib/poczta/resend";

/** Odpowiedź Resend na pytanie o domeny. Granica, więc Zod. */
export const odpowiedzDomen = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      status: z.string(),
      region: z.string().optional(),
    }),
  ),
});

export type DomenaResend = z.infer<typeof odpowiedzDomen>["data"][number];

/** Co da się dziś wysłać. */
export type OcenaPoczty = {
  mozna: "dowolne" | "tylko-wlasny" | "zadne";
  nadawca: string;
  domena: string | null;
  status: string | null;
  powod: string;
  coZrobic: string;
};

/**
 * Ocena możliwości wysyłki. Czysta funkcja, więc da się ją sprawdzić
 * bez odpytywania Resend.
 *
 * Dopasowanie domeny idzie przez **równość**, nie przez `includes`. Przy
 * `includes` domena `goscinnie.pl.cokolwiek.com` uchodziłaby za zweryfikowaną
 * `goscinnie.pl` i polecenie mówiłoby, że wszystko gra.
 */
export function ocenaPoczty(nadawca: string, domeny: readonly DomenaResend[]): OcenaPoczty {
  const domena = domenaNadawcy(nadawca);

  if (domena === null) {
    return {
      mozna: "zadne",
      nadawca,
      domena: null,
      status: null,
      powod: "Z adresu nadawcy nie da się odczytać domeny.",
      coZrobic: 'Popraw POCZTA_NADAWCA do postaci "Nazwa <adres@domena.pl>".',
    };
  }

  const wpis = domeny.find((d) => d.name.trim().toLowerCase() === domena);

  if (!wpis) {
    return {
      mozna: "tylko-wlasny",
      nadawca,
      domena,
      status: null,
      powod: `Domeny ${domena} nie ma w Twoim koncie Resend.`,
      coZrobic:
        `Dodaj ${domena} w panelu Resend (Domains → Add Domain) i wpisz wskazane ` +
        "tam rekordy DNS u swojego rejestratora. Do tego czasu kody dojdą wyłącznie " +
        "na adres właściciela konta Resend.",
    };
  }

  if (wpis.status.trim().toLowerCase() === "verified") {
    return {
      mozna: "dowolne",
      nadawca,
      domena,
      status: wpis.status,
      powod: `Domena ${domena} jest zweryfikowana.`,
      coZrobic: "Nic. Wysyłka na dowolny adres działa.",
    };
  }

  return {
    mozna: "tylko-wlasny",
    nadawca,
    domena,
    status: wpis.status,
    powod: `Domena ${domena} jest w stanie "${wpis.status}", a nie "verified".`,
    coZrobic:
      "Sprawdź wpisy DNS w panelu Resend i kliknij Verify. Dopóki domena nie jest " +
      "zweryfikowana, kody dojdą wyłącznie na adres właściciela konta Resend.",
  };
}

/** Domeny widziane przez Twoje konto Resend. */
export async function pobierzDomeny(
  klucz: string,
  pobierz: typeof fetch = globalThis.fetch,
): Promise<DomenaResend[]> {
  const odpowiedz = await pobierz("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${klucz}` },
  });

  if (!odpowiedz.ok) {
    throw new Error(`Resend odpowiedziało ${odpowiedz.status}: ${await odpowiedz.text()}`);
  }

  return odpowiedzDomen.parse(await odpowiedz.json()).data;
}

async function main(): Promise<void> {
  const klucz = process.env.RESEND_API_KEY;
  if (!klucz) {
    console.error(
      [
        "Brak RESEND_API_KEY.",
        "",
        "Lokalnie:   dopisz go do .env, klucz znajdziesz w panelu Resend.",
        "Produkcja:  vercel env pull albo sprawdź zmienne projektu w panelu Vercela.",
      ].join("\n"),
    );
    process.exit(1);
  }

  const nadawca = process.env.POCZTA_NADAWCA?.trim() || DOMYSLNY_NADAWCA;
  const domeny = await pobierzDomeny(klucz);
  const ocena = ocenaPoczty(nadawca, domeny);

  console.info(
    [
      `Nadawca:        ${ocena.nadawca}`,
      `Domena:         ${ocena.domena ?? "nie do odczytania"}`,
      `Stan w Resend:  ${ocena.status ?? "brak tej domeny"}`,
      `Domeny w koncie: ${domeny.map((d) => `${d.name} (${d.status})`).join(", ") || "żadnej"}`,
      "",
      `Werdykt: ${WERDYKT[ocena.mozna]}`,
      ocena.powod,
      "",
      `Co zrobić: ${ocena.coZrobic}`,
    ].join("\n"),
  );

  if (ocena.mozna === "zadne") process.exit(1);
}

const WERDYKT: Record<OcenaPoczty["mozna"], string> = {
  dowolne: "wysyłka na dowolny adres DZIAŁA",
  "tylko-wlasny": "wysyłka TYLKO na adres właściciela konta Resend",
  zadne: "wysyłka NIE DZIAŁA",
};

/*
 * Uruchomienie z wiersza poleceń, nie przy imporcie w teście. Ten sam wzorzec
 * co w scripts/migrate.ts i scripts/slowniki.ts, i z tego samego powodu:
 * import w teście nie ma odpytywać Resend ani kończyć procesu.
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}

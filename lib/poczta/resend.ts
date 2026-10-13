import { KONTAKT_EMAIL, NAZWA } from "@/lib/serwis";
import { BladWysylki, sklasyfikujOdmowe } from "./bledy";
import type { Email, Nadawca } from "./index";

/**
 * Nadawca poczty przez Resend. Używany na produkcji, gdy jest RESEND_API_KEY.
 */

/**
 * Nadawca widoczny w skrzynce.
 *
 * Składany z `KONTAKT_EMAIL`, a nie wpisany osobno, bo to ma być **ten sam
 * adres**, który stoi w stopce serwisu. Dwa osobne adresy znaczą dwie skrzynki
 * do pilnowania i dzień, w którym jedna z nich przestaje odbierać, a nikt tego
 * nie zauważa. Odpowiedź na kod potwierdzający ma trafiać tam, gdzie ktoś ją
 * przeczyta.
 *
 * Domena tego adresu musi być zweryfikowana w Resend, inaczej Resend odrzuci
 * wysyłkę. Sprawdza to `pnpm poczta:sprawdz`.
 */
export const DOMYSLNY_NADAWCA = `${NAZWA} <${KONTAKT_EMAIL}>`;

export class ResendNadawca implements Nadawca {
  private readonly nadawca: string;

  constructor(
    private readonly apiKey: string,
    nadawca?: string,
    /**
     * Szew do testów: pozwala sprawdzić klasyfikację odmów bez sieci
     * i bez podmieniania globalnego `fetch`, który jest wspólny dla
     * całego przebiegu testów.
     */
    private readonly pobierz: typeof fetch = globalThis.fetch,
  ) {
    this.nadawca = nadawca?.trim() || DOMYSLNY_NADAWCA;
  }

  async wyslij(email: Email): Promise<void> {
    const odpowiedz = await this.pobierz("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        from: this.nadawca,
        to: email.do,
        subject: email.temat,
        html: email.html,
      }),
    });

    if (odpowiedz.ok) return;

    const tresc = await odpowiedz.text();
    const klasyfikacja = sklasyfikujOdmowe(odpowiedz.status, tresc);

    throw new BladWysylki({
      komunikat: `Resend API zwróciło ${odpowiedz.status}: ${tresc}`,
      klasyfikacja,
      status: odpowiedz.status,
      tresc,
    });
  }
}

import type { Email, Nadawca } from "./index";

/**
 * Nadawca poczty przez Resend. Produkcyjny nadawca używany
 * gdy RESEND_API_KEY jest ustawiony.
 */

/**
 * Nadawca widoczny w skrzynce. Domena musi być zweryfikowana w Resend,
 * inaczej Resend odrzuci wysyłkę. Do czasu weryfikacji domeny `goscinnie.pl`
 * można podać adres testowy Resend w zmiennej POCZTA_NADAWCA.
 */
const DOMYSLNY_NADAWCA = "Gościnnie <noreply@goscinnie.pl>";

export class ResendNadawca implements Nadawca {
  private readonly nadawca: string;

  constructor(
    private readonly apiKey: string,
    nadawca?: string,
  ) {
    this.nadawca = nadawca?.trim() || DOMYSLNY_NADAWCA;
  }

  async wyslij(email: Email): Promise<void> {
    const odpowiedz = await fetch("https://api.resend.com/emails", {
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

    if (!odpowiedz.ok) {
      const tresc = await odpowiedz.text();
      throw new Error(`Resend API zwróciło ${odpowiedz.status}: ${tresc}`);
    }
  }
}

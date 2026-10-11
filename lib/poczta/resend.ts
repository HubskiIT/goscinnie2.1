import type { Email, Nadawca } from "./index";

/**
 * Nadawca poczty przez Resend. Produkcyjny nadawca używany
 * gdy RESEND_API_KEY jest ustawiony.
 */

export class ResendNadawca implements Nadawca {
  constructor(private readonly apiKey: string) {}

  async wyslij(email: Email): Promise<void> {
    const odpowiedz = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        from: "Gościnnie <noreply@goscinnie.pl>",
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

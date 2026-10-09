import type { Email, Nadawca } from "./index";

/**
 * Nadawca poczty dla lokalnego dev. Wypisuje email do konsoli
 * zamiast wysyłać go.
 */

export class KonsolaNadawca implements Nadawca {
  async wyslij(email: Email): Promise<void> {
    console.info("[DEV] Email wysłany:");
    console.info(`  Do: ${email.do}`);
    console.info(`  Temat: ${email.temat}`);
    console.info(`  Treść:\n${email.html}`);
  }
}

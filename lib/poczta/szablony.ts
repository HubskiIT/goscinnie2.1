import type { Email } from "./index";

/**
 * Szablony emaili. HTML uproszczony - bez CSS inline, bez responsywności.
 * W prototypie liczy się działanie, nie wygląd.
 */

export function weryfikacjaEmail(adres: string, kod: string): Email {
  return {
    do: adres,
    temat: "Potwierdź adres email - Gościnnie",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #0a0d12; font-size: 24px; margin-bottom: 16px;">
          Witaj w Gościnnie!
        </h1>

        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Aby dokończyć rejestrację, wpisz poniższy kod weryfikacyjny:
        </p>

        <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0a0d12;">
            ${kod}
          </div>
        </div>

        <p style="color: #999; font-size: 14px; line-height: 1.6;">
          Kod jest ważny przez 15 minut. Jeśli nie zakładałeś konta, zignoruj tę wiadomość.
        </p>
      </div>
    `,
  };
}

export function resetHasla(adres: string, url: string): Email {
  return {
    do: adres,
    temat: "Reset hasła - Gościnnie",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #0a0d12; font-size: 24px; margin-bottom: 16px;">
          Reset hasła
        </h1>

        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Otrzymaliśmy prośbę o reset hasła do Twojego konta. Kliknij poniższy przycisk,
          aby ustawić nowe hasło:
        </p>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${url}" style="display: inline-block; background: #0a0d12; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Ustaw nowe hasło
          </a>
        </div>

        <p style="color: #999; font-size: 14px; line-height: 1.6;">
          Link jest ważny przez 1 godzinę. Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5;">
          Jeśli przycisk nie działa, skopiuj i wklej ten link do przeglądarki:<br/>
          <span style="color: #666;">${url}</span>
        </p>
      </div>
    `,
  };
}

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

/**
 * Reset hasła sześciocyfrowym kodem.
 *
 * Kod, nie link, i to z jednego powodu: wysyłkę kodu robimy sami, więc jej
 * awarię widzimy, a wysyłka linku szła przez better-auth, które każdy błąd
 * połyka. Patrz docs/decyzje/011.
 *
 * Zdanie o unieważnieniu poprzedniego kodu jest tu, bo tak działa baza:
 * `findVerificationValue` bierze najnowszy wiersz. Bez tego zdania człowiek,
 * który poprosił o kod dwa razy, wpisuje ten pierwszy i nie rozumie odmowy.
 */
export function resetHaslaKodem(adres: string, kod: string): Email {
  return {
    do: adres,
    temat: "Kod do zmiany hasła - Gościnnie",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #0a0d12; font-size: 24px; margin-bottom: 16px;">
          Zmiana hasła
        </h1>

        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Ktoś poprosił o zmianę hasła do konta w Gościnnie. Wpisz ten kod na stronie,
          na której o niego poprosiłeś:
        </p>

        <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0a0d12;">
            ${kod}
          </div>
        </div>

        <p style="color: #999; font-size: 14px; line-height: 1.6;">
          Kod jest ważny przez 15 minut. Jeśli poprosisz o kolejny, ten przestanie działać.
          Jeśli to nie Ty prosiłeś o zmianę hasła, zignoruj tę wiadomość — hasło zostaje
          takie, jakie było.
        </p>
      </div>
    `,
  };
}

/**
 * Decyzja moderacji w sprawie wpisu firmy.
 *
 * Jeden szablon na zgodę i na odmowę, bo to jedna wiadomość o tej samej
 * sprawie i rozsypanie jej na dwie funkcje kończy się rozjazdem w stopce
 * albo w adresie panelu.
 *
 * ODMOWA ZAWSZE NIESIE POWÓD i to nie jest uprzejmość. List bez powodu
 * wraca pytaniem „dlaczego”, na które trzeba odpowiedzieć ręcznie, więc
 * powód napisany od razu jest tańszy. Dlatego `powod` przy odmowie jest
 * wymagany przez typ, a nie opcjonalny.
 *
 * Czego tu NIE MA: treści samego wpisu. Firma zna swój wpis i widzi go
 * w panelu, a przepisywanie go do listu dokłada miejsce, w którym opis
 * i cena mogą się rozjechać z tym, co jest w bazie.
 */
export type DecyzjaModeracji = { rodzaj: "zgoda" } | { rodzaj: "odmowa"; powod: string };

export function decyzjaModeracjiWpisu(
  adres: string,
  nazwaFirmy: string,
  decyzja: DecyzjaModeracji,
  adresPanelu: string,
): Email {
  if (decyzja.rodzaj === "zgoda") {
    return {
      do: adres,
      temat: `Wpis „${nazwaFirmy}” jest już w katalogu - Gościnnie`,
      html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #0a0d12; font-size: 24px; margin-bottom: 16px;">
          Wpis przyjęty
        </h1>

        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Sprawdziliśmy wpis „${nazwaFirmy}” i jest już widoczny w katalogu Gościnnie.
          Klienci mogą go znaleźć w wyszukiwaniu.
        </p>

        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          <a href="${adresPanelu}" style="color: #8A5405;">Zobacz wpis w swoim panelu</a>
        </p>

        <p style="color: #999; font-size: 14px; line-height: 1.6;">
          Zmiany we wpisie możesz wprowadzać w panelu w każdej chwili. Każda z nich
          trafia do sprawdzenia, zanim pokaże się klientom.
        </p>
      </div>
    `,
    };
  }

  return {
    do: adres,
    temat: `Wpis „${nazwaFirmy}” wymaga poprawki - Gościnnie`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #0a0d12; font-size: 24px; margin-bottom: 16px;">
          Wpis wraca do poprawki
        </h1>

        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Sprawdziliśmy wpis „${nazwaFirmy}” i na razie nie trafia do katalogu.
          Oto co trzeba zmienić:
        </p>

        <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; margin-bottom: 24px; color: #0a0d12; font-size: 16px; line-height: 1.6; white-space: pre-line;">${decyzja.powod}</div>

        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          <a href="${adresPanelu}" style="color: #8A5405;">Popraw wpis w panelu</a>
          i wyślij go ponownie. Nic nie przepadło: wpis czeka taki, jaki był.
        </p>

        <p style="color: #999; font-size: 14px; line-height: 1.6;">
          Jeśli coś jest niejasne, odpisz na tę wiadomość.
        </p>
      </div>
    `,
  };
}

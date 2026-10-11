"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { wyslijKodPonownie, zweryfikujEmail } from "@/lib/akcje/weryfikacja";
import { STAN_POCZATKOWY, wartoscPola } from "@/lib/formularze";
import { DLUGOSC_KODU } from "@/lib/validators/konto";

/**
 * `useSearchParams` wymaga granicy Suspense nad sobą.
 *
 * Bez niej budowanie produkcyjne przerywa się na prerenderowaniu tej strony
 * komunikatem „useSearchParams() should be wrapped in a suspense boundary".
 * Nie wychodziło to wcześniej, bo wdrożenie padało pierwsze na /sitemap.xml
 * i nie dochodziło do tej strony.
 *
 * Adres e-mail jest w zapytaniu, więc strony i tak nie da się wygenerować
 * statycznie z sensowną treścią: Suspense pozwala wygenerować obudowę,
 * a resztę dokłada przeglądarka.
 */
export default function WeryfikacjaPage() {
  return (
    <Suspense fallback={null}>
      <Weryfikacja />
    </Suspense>
  );
}

function Weryfikacja() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [stan, akcja, czeka] = useActionState(zweryfikujEmail, STAN_POCZATKOWY);
  const [stanWysylki, akcjaWysylki, czekaWysylka] = useActionState(
    wyslijKodPonownie,
    STAN_POCZATKOWY,
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "white",
          borderRadius: "12px",
          padding: "40px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "28px",
            fontWeight: "600",
            color: "#0a0d12",
          }}
        >
          Sprawdź skrzynkę
        </h1>
        <p
          style={{
            margin: "0 0 32px",
            fontSize: "15px",
            lineHeight: "1.5",
            color: "#666",
          }}
        >
          Wysłaliśmy kod weryfikacyjny na adres <strong>{email}</strong>
        </p>

        <form action={akcja}>
          <input type="hidden" name="email" value={email} />

          <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="kod"
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#1e2636",
              }}
            >
              Kod weryfikacyjny
            </label>
            <input
              id="kod"
              name="kod"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={DLUGOSC_KODU}
              placeholder="000000"
              defaultValue={wartoscPola(stan, "kod")}
              autoComplete="one-time-code"
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "16px",
                border: "1px solid #e5e5e5",
                borderRadius: "8px",
                fontFamily: "monospace",
                letterSpacing: "0.2em",
                textAlign: "center",
              }}
            />
            {stan.status === "bledy" && stan.bledy.kod && (
              <p id="kod-error" style={{ margin: "8px 0 0", fontSize: "14px", color: "#dc2626" }}>
                {stan.bledy.kod[0]}
              </p>
            )}
          </div>

          {stan.status === "bledy" && stan.bledy._ && (
            <div
              style={{
                marginBottom: "24px",
                padding: "12px 16px",
                background: "#fef2f2",
                borderRadius: "8px",
              }}
            >
              <p style={{ margin: 0, fontSize: "14px", color: "#dc2626" }}>{stan.bledy._[0]}</p>
            </div>
          )}

          {stanWysylki.status === "informacja" && (
            <p
              role="status"
              style={{
                margin: "0 0 16px",
                padding: "12px 16px",
                background: "#f2e9e2",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#3e3344",
              }}
            >
              {stanWysylki.tresc}
            </p>
          )}

          <button
            type="submit"
            disabled={czeka}
            style={{
              width: "100%",
              padding: "14px 24px",
              fontSize: "16px",
              fontWeight: "600",
              color: "white",
              background: czeka ? "#9ca3af" : "#3b6dff",
              border: "none",
              borderRadius: "999px",
              cursor: czeka ? "not-allowed" : "pointer",
            }}
          >
            {czeka ? "Weryfikuję..." : "Potwierdź"}
          </button>
        </form>

        {/*
          Ponowne wysłanie kodu jako osobny formularz, a nie przycisk w tamtym.
          Dwa przyciski w jednym formularzu wysyłałyby ten sam zestaw pól,
          więc kliknięcie „wyślij ponownie" z pustym kodem kończyłoby się
          błędem walidacji kodu, zamiast wysłać nowy.
        */}
        {/*
          Wyjście dla kogoś, kto ma już konto i przez pomyłkę przeszedł
          rejestrację drugi raz. Zakładanie konta na zajęty adres kończy się
          po cichu, bez komunikatu „adres zajęty", bo taki komunikat byłby
          sprawdzarką cudzych adresów. Ten odnośnik jest zamiast niego.
        */}
        <p style={{ margin: "24px 0 0", textAlign: "center", fontSize: "14px", color: "#666" }}>
          Masz już konto?{" "}
          <a href="/logowanie" style={{ color: "#3b6dff" }}>
            Zaloguj się
          </a>
        </p>

        <form action={akcjaWysylki} style={{ marginTop: "12px", textAlign: "center" }}>
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            disabled={czekaWysylka}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: "14px",
              color: czekaWysylka ? "#9ca3af" : "#3b6dff",
              cursor: czekaWysylka ? "not-allowed" : "pointer",
              textDecoration: "underline",
            }}
          >
            {czekaWysylka ? "Wysyłam..." : "Nie dostałeś kodu? Wyślij ponownie"}
          </button>
        </form>
      </div>
    </div>
  );
}

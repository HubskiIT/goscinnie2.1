/**
 * Obrazek podglądu linku, czyli to, co widzi człowiek, któremu ktoś wysyła
 * adres serwisu na Messengerze albo wkleja go na grupie.
 *
 * DLACZEGO TO NIE JEST OZDOBA
 *
 * Bez `og:image` karta podglądu nie powstaje i link jedzie jako goły napis.
 * Wysłanie takiego linku kosztuje tyle samo, a daje kilka razy mniej wejść,
 * więc przy serwisie, który ma rosnąć z polecenia, to brakujący obrazek,
 * a nie tekst ogłoszenia, ustawia sufit.
 *
 * Plik w `app/` zamiast pola w metadanych, bo konwencja Next dokłada ten
 * obrazek do każdej trasy sama, razem z `og:image:width`, `og:image:height`
 * i `twitter:image`. Wpisane ręcznie trzy pola rozjechałyby się z plikiem
 * przy pierwszej zmianie wymiarów.
 *
 * Kolory wyłącznie z `docs/tokeny.md`: paper, night, honey i mute.
 */
import { ImageResponse } from "next/og";

/** Wymiar, którego oczekują wszystkie komunikatory i wyszukiwarki. */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Gościnnie, sale i usługodawcy na każdą okazję";

export default function Obrazek() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "92px",
        background: "#FBF7F4",
      }}
    >
      <div style={{ fontSize: 88, fontWeight: 700, color: "#241C2B", letterSpacing: "-0.02em" }}>
        Gościnnie
      </div>
      <div
        style={{
          marginTop: 26,
          fontSize: 42,
          lineHeight: 1.35,
          color: "#241C2B",
          maxWidth: 880,
        }}
      >
        Sale, lokale i usługodawcy na każdą okazję
      </div>
      {/*
       * Akcent miodowy pod zdaniem, które mówi, co serwis robi, a nie pod
       * informacją o braku. Zasada 2 z docs/tokeny.md: honey znaczy fakt
       * albo działanie, nigdy pustkę.
       */}
      <div
        style={{ marginTop: 44, width: 190, height: 12, borderRadius: 6, background: "#F0A62E" }}
      />
      <div style={{ marginTop: 44, fontSize: 30, color: "#6A5C70" }}>
        Zero prowizji od umów. Klient nie płaci nigdy.
      </div>
    </div>,
    size,
  );
}

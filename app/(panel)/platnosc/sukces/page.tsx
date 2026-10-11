import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function PlatnoscSukcesPage() {
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
          maxWidth: "600px",
          background: "white",
          borderRadius: "12px",
          padding: "48px",
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <CheckCircle size={64} style={{ color: "#10b981" }} />
        </div>

        <h1 style={{ margin: "0 0 16px", fontSize: "32px", fontWeight: "600", color: "#0a0d12" }}>
          Płatność zakończona!
        </h1>

        <p style={{ margin: "0 0 32px", fontSize: "16px", lineHeight: "1.6", color: "#666" }}>
          Twoja firma została dodana do katalogu Gościnnie. Abonament jest już aktywny i możesz
          zacząć odpowiadać na zlecenia.
        </p>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}
        >
          <Link
            href="/panel/profil"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              fontSize: "16px",
              fontWeight: "600",
              color: "white",
              background: "#0a0d12",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            Przejdź do panelu
          </Link>

          <Link
            href="/zlecenia"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              fontSize: "16px",
              fontWeight: "500",
              color: "#0a0d12",
              background: "transparent",
              border: "1px solid #e5e5e5",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            Zobacz dostępne zlecenia
          </Link>
        </div>

        <div style={{ marginTop: "40px", paddingTop: "32px", borderTop: "1px solid #e5e5e5" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: "600", color: "#0a0d12" }}>
            Co dalej?
          </h2>
          <ul
            style={{
              margin: 0,
              padding: "0 0 0 20px",
              textAlign: "left",
              fontSize: "14px",
              lineHeight: "1.8",
              color: "#666",
            }}
          >
            <li>Uzupełnij profil firmy - dodaj zdjęcia i szczegóły oferty</li>
            <li>Przeglądaj zlecenia od klientów w Twoim regionie</li>
            <li>Składaj oferty i zdobywaj nowych klientów</li>
            <li>Sprawdź statystyki w panelu firmy</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

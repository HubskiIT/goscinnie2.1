import { StanPusty } from "@/components/StanPusty";

export default function NieZnaleziono() {
  return (
    <StanPusty
      tytul="Nie ma takiej strony"
      opis="Adres jest błędny albo strona została przeniesiona."
      akcja={{ etykieta: "Wróć na stronę główną", adres: "/" }}
    />
  );
}

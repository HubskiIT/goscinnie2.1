/**
 * Schematy wejścia dla zdjęć firmy.
 *
 * Plik przychodzi jako `File` w `FormData` i jego treść sprawdza
 * `lib/zdjecia/obrobka.ts`, bo o formacie rozstrzyga zawartość, nie napis
 * w żądaniu. Tutaj żyje to, co przychodzi obok pliku i jest zwykłym tekstem.
 */
import { z } from "zod";

/**
 * Klucz jednej próby wysyłki, nadawany w przeglądarce przy wyborze pliku.
 *
 * Trafia do `company_photos.upload_key`, gdzie indeks unikalny odrzuca drugi
 * zapis tej samej próby. Dlatego musi przejść walidację, zanim dotknie bazy:
 * to pole z formularza, czyli coś, co da się podmienić.
 *
 * `uuid`, a nie dowolny tekst, z dwóch powodów. Pierwszy: długość i kształt
 * są z góry znane, więc nie ma jak wepchnąć tu kilobajta. Drugi: klucz
 * zgadnięty przez kogoś obcego nie daje nic, bo indeks jest zawężony do
 * `company_id`, a firma bierze się z sesji, nie z formularza.
 */
export const kluczWysylki = z.uuid("Nieprawidłowy klucz wysyłki.");

/** Usunięcie zdjęcia: wskazanie, którego. */
export const daneUsunieciaZdjecia = z.object({
  zdjecieId: z.uuid("Nie wiadomo, które zdjęcie usunąć."),
});

export type KluczWysylki = z.infer<typeof kluczWysylki>;

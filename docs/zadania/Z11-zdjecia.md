# Z11. Zdjęcia w profilu

**Status:** do zrobienia

**BLOKADA:** wybór magazynu plików przez właściciela (Supabase Storage albo Vercel Blob) i zgoda na zależność.

**Zadanie:** firma dodaje, porządkuje i usuwa zdjęcia profilu, a profil pokazuje galerię.

**Reguła biznesowa:** zdjęcia profilu w stanie szkicu nie są dostępne publicznie pod żadnym adresem.

**Skille:** `realizacja-zadania`, `pionowy-plaster`, `migracja-bazy`.

**Wchodzi:** przesyłanie z limitem rozmiaru i typu, miniatury przez `next/image`, kolejność, zdjęcie główne, opis alternatywny, limit liczby zdjęć.

**Nie wchodzi:** wideo, wirtualny spacer, edycja zdjęć, moderacja zdjęć, import z zewnętrznych serwisów.

**Ryzyka:** publiczny adres pliku przed publikacją profilu, przesłanie pliku innego typu niż obraz, dane lokalizacji w metadanych zdjęcia.

---

Po zakończeniu odpowiedz na pytania kontrolne z `docs/zadania/README.md`.

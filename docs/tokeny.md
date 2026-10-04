# Tokeny wizualne

Źródło: artefakt "Gościnnie, podgląd strony". Nie wymyślaj wartości spoza tej listy.

## Kolory

| Token | Hex | Do czego |
| --- | --- | --- |
| `night` | `#241C2B` | tekst główny, ciemne pasy, stopka |
| `night-2` | `#3A2D42` | karty na ciemnym tle |
| `honey` | `#F0A62E` | jedyny mocny akcent: przyciski, podkreślenia, aktywna pinezka |
| `honey-ink` | `#8A5405` | miodowy na jasnym tle, gdy potrzebny kontrast tekstu |
| `paper` | `#FBF7F4` | tło główne |
| `linen` | `#F2E9E2` | tło sekcji przeplatanych |
| `sage` | `#5E7360` | ikony, znaczniki udogodnień |
| `sage-bg` | `#E7EDE7` | tło znaczników |
| `mute` | `#6A5C70` | tekst drugorzędny |
| `line` | `#E2D5CA` | obramowania kart |

Świadomie omijamy zestaw kremowo-terakotowy. Jest dziś domyślnym wyglądem
każdej "ciepłej" strony i czyta się jako wygenerowany.

## Typografia

- Nagłówki: **Fraunces**, `font-variation-settings: 'SOFT' 60, 'WONK' 1`
- Interfejs i treść: **Figtree**
- Oba mają komplet polskich znaków. Sprawdź `ą ę ć ś ź ż ł ó ń` przy każdej
  zmianie kroju, bo większość modnych fontów tego nie ma.

## Zasady

1. Jeden mocny akcent na ekran. Miodowy prowadzi do jednej akcji, nie do pięciu.
2. **Akcent miodowy oznacza fakty i działania, nigdy braki.** Brak danych,
   stan pusty i informacja o czymś, czego nie ma, idą kolorem drugorzędnym
   (`mute`). Wyróżnienie braku tym samym kolorem co danej sprawia, że oko
   zatrzymuje się na pustce zamiast na treści.
3. Cena zawsze widoczna. Karta lokalu bez ceny nie przechodzi moderacji.
4. Bez liczników odliczających i bez "ostatnie 2 wolne terminy".
   Organizacja imprezy jest wystarczająco stresująca.
5. Kontrast tekstu minimum 4.5:1, przy 24px i większych 3:1.

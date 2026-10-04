/**
 * REGUŁA „CO KTO WIDZI” — jedyne źródło prawdy.
 *
 * Pełna tabela widoczności i uzasadnienia: docs/uprawnienia.md.
 * Cała wartość abonamentu opiera się na tym pliku. Jeśli ta ściana przecieknie,
 * przychód znika.
 *
 * ZASADA NACZELNA TEGO PLIKU: DOMYŚLNA ODMOWA.
 *
 * Gałąź, której jeszcze nie zaimplementowano, rzuca wyjątkiem. Nie zwraca
 * pustego obiektu, nie zwraca pełnych danych, nie przechodzi dalej. Najgroźniejszy
 * błąd w tym projekcie to gałąź uprawnień, która nie istnieje i dlatego
 * przepuszcza wszystko. Hałaśliwa awaria jest tu tańsza niż cichy wyciek.
 *
 * Trzy rzeczy, o których łatwo zapomnieć:
 *
 * 1. Reguła jest egzekwowana **na poziomie zapytania do bazy**. Zapytanie nie
 *    pobiera pól, których odbiorca nie ma prawa zobaczyć. Nie pobiera ich
 *    i potem filtruje. Ukrycie pola w komponencie przy jawnym API to żadne
 *    zabezpieczenie: wystarczy otworzyć narzędzia deweloperskie.
 * 2. Firma **nie widzi liczby ofert** na zleceniu. To świadoma decyzja
 *    produktowa, nie przeoczenie. Nie „naprawiaj” tego licznikiem.
 * 3. Abonament jest aktywny, gdy `status = 'active'` **i** `expires_at > now()`.
 *    Oba warunki, zawsze.
 *
 * STAN PLIKU: zaimplementowane są gałęzie anonima, klienta, autora zlecenia
 * oraz firmy, z abonamentem i bez. Moderator wciąż rzuca. Składanie ofert
 * (mozeZlozycOferte dla firmy) czeka na osobny plaster.
 */

/** Kto pyta. Kolejność odpowiada kolumnom tabeli w docs/uprawnienia.md. */
export type Widz =
  | { rodzaj: "anonim" }
  | { rodzaj: "klient"; userId: string }
  | { rodzaj: "firma"; userId: string; companyId: string; abonament: boolean }
  | { rodzaj: "autor"; userId: string }
  | { rodzaj: "moderator"; userId: string };

/** Dokładność lokalizacji, jaką wolno pokazać danemu widzowi. */
export type DokladnoscLokalizacji = "powiat" | "powiat-i-promien" | "dokladna";

/**
 * Ile opisu wolno pokazać.
 *
 * Suma rozłączna, a nie liczba z wartością specjalną. Przy `number | null`
 * „cały opis” trzeba by zapisać jako nieskończoność albo bardzo dużą liczbę,
 * a takie umowne wartości prędzej czy później ktoś przeoczy w porównaniu.
 */
export type ZakresOpisu =
  | { rodzaj: "brak" }
  | { rodzaj: "zajawka"; znakow: number }
  | { rodzaj: "caly" };

/** Maksymalna długość zajawki opisu dla firmy bez abonamentu. */
export const ZAJAWKA_OPISU_ZNAKOW = 120;

/**
 * Które pola zlecenia wolno pobrać z bazy dla tego widza.
 * To jest wynik, który warstwa zapytań zamienia na listę kolumn w `select`.
 */
export type WidocznoscZlecenia = {
  rodzajOkazji: boolean;
  dataWydarzenia: boolean;
  liczbaOsob: boolean;
  lokalizacja: DokladnoscLokalizacji;
  opis: ZakresOpisu;
  budzet: boolean;
  daneKontaktowe: boolean;
  liczbaOfert: boolean;
  cenyKonkurencji: boolean;
};

/** Powód odmowy. Każdy ma przypisany kod HTTP niosący logikę biznesową. */
export type PowodOdmowy =
  /** 402 — treść za abonamentem. Front pokazuje ekran sprzedażowy, nie błąd. */
  | "brak-abonamentu"
  /** 409 — jedna firma, jedna oferta. */
  | "oferta-juz-zlozona"
  /** 429 — wyczerpany limit ofert w planie Start. Front prowadzi do wyższego planu. */
  | "limit-planu-wyczerpany"
  /**
   * 409 — zlecenie nie przyjmuje już ofert: jest pełne, zamknięte albo wygasłe.
   *
   * Te trzy przyczyny są celowo **nierozróżnialne**. Firma nie widzi liczby
   * ofert, więc komunikat „zlecenie ma już dziesięć ofert” oddałby jej dokładnie
   * tę liczbę, której nie miała poznać, a wystarczyłoby próbować.
   */
  | "zlecenie-nie-przyjmuje-ofert"
  /** 403 — widz w ogóle nie ma tu czego szukać. */
  | "brak-dostepu";

export type Rozstrzygniecie = { wolno: true } | { wolno: false; powod: PowodOdmowy };

/** Mapowanie powodu odmowy na kod HTTP. Jedyne miejsce, gdzie to żyje. */
export const KOD_HTTP: Record<PowodOdmowy, 402 | 403 | 409 | 429> = {
  "brak-abonamentu": 402,
  "oferta-juz-zlozona": 409,
  "zlecenie-nie-przyjmuje-ofert": 409,
  "limit-planu-wyczerpany": 429,
  "brak-dostepu": 403,
};

/**
 * Maksymalna liczba ofert na jednym zleceniu.
 *
 * Limit jest po stronie klienta, nie firmy: dziesięć ofert to tyle, ile człowiek
 * jest w stanie porównać. Jedenasta nikomu nie pomaga, a firmie, która ją
 * składa, tylko zabiera czas.
 */
export const MAKS_OFERT_NA_ZLECENIE = 10;

/**
 * Rzucane przez gałąź uprawnień, której jeszcze nie napisano.
 *
 * Osobna klasa, a nie zwykły Error, żeby dało się ją wprost sprawdzić w teście
 * i żeby nikt nie pomylił jej z awarią bazy albo błędem walidacji.
 */
export class NiezaimplementowanaGalazUprawnien extends Error {
  constructor(opisWidza: string, funkcja: string) {
    super(
      `${funkcja}: gałąź uprawnień „${opisWidza}” nie jest zaimplementowana. ` +
        "Domyślną odpowiedzią jest odmowa. Dopisz tę gałąź w lib/permissions.ts " +
        "razem z przypadkiem w tests/permissions.test.ts, zanim jej użyjesz.",
    );
    this.name = "NiezaimplementowanaGalazUprawnien";
  }
}

/** Czytelny opis widza do komunikatów błędów. Firma rozbita po abonamencie. */
function opiszWidza(widz: Widz): string {
  if (widz.rodzaj === "firma") {
    return widz.abonament ? "firma z abonamentem" : "firma bez abonamentu";
  }
  return widz.rodzaj;
}

/**
 * Co ten widz może zobaczyć w zleceniu.
 * Wywoływane przez zapytania w lib/db/queries/, zanim zbudują `select`.
 */
export function widocznoscZlecenia(widz: Widz): WidocznoscZlecenia {
  switch (widz.rodzaj) {
    // Anonim i klient dzielą jedną kolumnę tabeli w docs/uprawnienia.md.
    // Zalogowanie się samo w sobie niczego nie odsłania: klient, który nie jest
    // autorem tego zlecenia, widzi dokładnie tyle co ktoś z ulicy.
    case "anonim":
    case "klient":
      return {
        rodzajOkazji: true,
        dataWydarzenia: true,
        liczbaOsob: true,
        lokalizacja: "powiat",
        opis: { rodzaj: "brak" },
        budzet: false,
        daneKontaktowe: false,
        liczbaOfert: false,
        cenyKonkurencji: false,
      };

    // Autor widzi wszystko o własnym zleceniu, łącznie z liczbą ofert
    // i cenami konkurencji. To jedyny widz, który je widzi.
    case "autor":
      return {
        rodzajOkazji: true,
        dataWydarzenia: true,
        liczbaOsob: true,
        lokalizacja: "dokladna",
        opis: { rodzaj: "caly" },
        budzet: true,
        daneKontaktowe: true,
        liczbaOfert: true,
        cenyKonkurencji: true,
      };

    // Firma bez abonamentu. To jest ta ściana, na której stoi cały przychód:
    // widzi, że zlecenie istnieje, i zajawkę opisu, żeby wiedziała, czy warto,
    // ale nie pozna ani całego opisu, ani budżetu.
    case "firma":
      if (!widz.abonament) {
        return {
          rodzajOkazji: true,
          dataWydarzenia: true,
          liczbaOsob: true,
          lokalizacja: "powiat",
          opis: { rodzaj: "zajawka", znakow: ZAJAWKA_OPISU_ZNAKOW },
          budzet: false,
          daneKontaktowe: false,
          liczbaOfert: false,
          cenyKonkurencji: false,
        };
      }

      // Firma z abonamentem. Dane kontaktowe wciąż na nie: odsłania je dopiero
      // wpis w `shortlist`, czyli działanie klienta. Rozstrzyga o tym
      // mozeZobaczycKontakt, nie ta funkcja.
      return {
        rodzajOkazji: true,
        dataWydarzenia: true,
        liczbaOsob: true,
        lokalizacja: "powiat-i-promien",
        opis: { rodzaj: "caly" },
        budzet: true,
        daneKontaktowe: false,
        // Liczby ofert nie widzi żadna firma, także ta z abonamentem.
        // To decyzja produktowa z docs/uprawnienia.md, nie przeoczenie.
        liczbaOfert: false,
        cenyKonkurencji: false,
      };

    case "moderator":
      throw new NiezaimplementowanaGalazUprawnien(opiszWidza(widz), "widocznoscZlecenia");

    default: {
      // Jeśli ktoś dopisze wariant do typu Widz i zapomni o gałęzi tutaj,
      // TypeScript zerwie kompilację na tym przypisaniu.
      const nigdy: never = widz;
      throw new NiezaimplementowanaGalazUprawnien(String(nigdy), "widocznoscZlecenia");
    }
  }
}

/**
 * Czy ten widz może zobaczyć zlecenie w zakresie, jaki wynika z jego wiersza
 * tabeli. Odmowa z powodem `brak-abonamentu` to 402 i ekran sprzedażowy.
 */
export function mozeZobaczycSzczegoly(widz: Widz): Rozstrzygniecie {
  switch (widz.rodzaj) {
    case "anonim":
    case "klient":
    case "autor":
      // Wszyscy troje widzą zlecenie, tyle że w różnym zakresie. Który to
      // zakres, rozstrzyga widocznoscZlecenia, nie ta funkcja.
      return { wolno: true };

    case "firma":
      // Firma bez abonamentu też widzi zlecenie, tyle że w wersji z zajawką.
      // Odmowa z powodem „brak-abonamentu” należy do prób wyjścia poza ten
      // zakres, na przykład do złożenia oferty, a nie do samego podejrzenia.
      return { wolno: true };

    case "moderator":
      throw new NiezaimplementowanaGalazUprawnien(opiszWidza(widz), "mozeZobaczycSzczegoly");

    default: {
      const nigdy: never = widz;
      throw new NiezaimplementowanaGalazUprawnien(String(nigdy), "mozeZobaczycSzczegoly");
    }
  }
}

export type KontekstOferty = {
  requestId: string;
  /**
   * Czy ta firma ma już ofertę na tym zleceniu. Źródłem prawdy jest unikalny
   * indeks `bids(request_id, company_id)`, ta flaga służy tylko do wcześniejszej,
   * uprzejmej odmowy.
   */
  jestJuzOferta: boolean;
  /**
   * Czy zlecenie w ogóle przyjmuje oferty.
   *
   * Jedna flaga, nie trzy. Wywołujący zwija tu pełne, zamknięte i wygasłe
   * w jedno, żeby ta funkcja nie miała czym rozróżnić przyczyny nawet wtedy,
   * gdyby ktoś chciał ją w komunikacie wypisać.
   */
  przyjmujeOferty: boolean;
  /** Ile ofert firma złożyła w bieżącym okresie abonamentowym. */
  ofertWOkresie: number;
  /** Limit z planu. `null` = bez limitu. */
  limitPlanu: number | null;
};

/**
 * Czy ta firma może złożyć ofertę na to zlecenie.
 *
 * Kolejność sprawdzeń ma znaczenie dla konwersji: najpierw abonament (402),
 * potem duplikat (409), na końcu limit planu (429). Firma bez abonamentu ma
 * zobaczyć ekran sprzedażowy, a nie komunikat o limicie planu, którego nie ma.
 */
export function mozeZlozycOferte(widz: Widz, kontekst: KontekstOferty): Rozstrzygniecie {
  switch (widz.rodzaj) {
    case "anonim":
    case "klient":
    case "autor":
      // Oferty składają wyłącznie firmy. Klient i autor nie mają tu czego
      // szukać, a autor tym bardziej nie składa oferty na własne zlecenie.
      // To pełnoprawne gałęzie, nie zaślepki.
      return { wolno: false, powod: "brak-dostepu" };

    case "firma": {
      // 1. Abonament. Najpierw, bo to jest miejsce konwersji: firma bez
      //    abonamentu ma zobaczyć ekran sprzedażowy, a nie cokolwiek innego.
      if (!widz.abonament) return { wolno: false, powod: "brak-abonamentu" };

      // 2. Duplikat. Dotyczy wyłącznie tej firmy, więc nie zdradza niczego
      //    o innych i może iść przed pozostałymi sprawdzeniami.
      if (kontekst.jestJuzOferta) return { wolno: false, powod: "oferta-juz-zlozona" };

      // 3. Limit planu PRZED sprawdzeniem, czy zlecenie przyjmuje oferty.
      //
      //    Kolejność wygląda na odwróconą względem CLAUDE.md (402, 409, 429)
      //    i jest odwrócona celowo. Gdyby „zlecenie nie przyjmuje ofert” szło
      //    wcześniej, firma na wyczerpanym limicie dostawałaby raz 409, raz 429
      //    w zależności od tego, czy zlecenie jest pełne. Porównując te dwie
      //    odpowiedzi, poznałaby liczbę ofert na cudzym zleceniu, a tego
      //    nie wolno jej poznać w żaden sposób.
      //
      //    Przy tej kolejności firma na limicie dostaje 429 zawsze, niezależnie
      //    od stanu zlecenia, więc nie ma z czego wnioskować.
      if (kontekst.limitPlanu !== null && kontekst.ofertWOkresie >= kontekst.limitPlanu) {
        return { wolno: false, powod: "limit-planu-wyczerpany" };
      }

      // 4. Stan zlecenia, zwinięty do jednej flagi przez wywołującego.
      if (!kontekst.przyjmujeOferty) {
        return { wolno: false, powod: "zlecenie-nie-przyjmuje-ofert" };
      }

      return { wolno: true };
    }

    case "moderator":
      throw new NiezaimplementowanaGalazUprawnien(opiszWidza(widz), "mozeZlozycOferte");

    default: {
      const nigdy: never = widz;
      throw new NiezaimplementowanaGalazUprawnien(String(nigdy), "mozeZlozycOferte");
    }
  }
}

/**
 * Czy ta firma może wycofać tę ofertę.
 *
 * Wycofanie jest możliwe do momentu, w którym klient doda ofertę do krótkiej
 * listy. Potem nie: klient podjął już na jej podstawie decyzję i zaczął
 * rozmowę, a znikająca oferta zostawiłaby go z rozmową bez treści.
 *
 * Wycofanie oznacza `status = 'withdrawn'`, nie usunięcie wiersza.
 */
export function mozeWycofacOferte(widz: Widz, kontekst: KontekstWycofania): Rozstrzygniecie {
  switch (widz.rodzaj) {
    case "anonim":
    case "klient":
    case "autor":
      return { wolno: false, powod: "brak-dostepu" };

    case "firma":
      // Cudza oferta i oferta nieistniejąca dają tę samą odmowę. Rozróżnienie
      // powiedziałoby firmie, że oferta o tym identyfikatorze istnieje.
      if (!kontekst.wlasna) return { wolno: false, powod: "brak-dostepu" };
      if (kontekst.naKrotkiejLiscie) return { wolno: false, powod: "brak-dostepu" };
      return { wolno: true };

    case "moderator":
      throw new NiezaimplementowanaGalazUprawnien(opiszWidza(widz), "mozeWycofacOferte");

    default: {
      const nigdy: never = widz;
      throw new NiezaimplementowanaGalazUprawnien(String(nigdy), "mozeWycofacOferte");
    }
  }
}

export type KontekstWycofania = {
  /** Czy oferta należy do firmy tego widza. */
  wlasna: boolean;
  /** Czy klient dodał ją już do krótkiej listy. */
  naKrotkiejLiscie: boolean;
};

/**
 * Czy ten widz może zarządzać krótką listą zlecenia.
 *
 * Wyłącznie autor. Dodanie oferty do krótkiej listy odsłania firmie dane
 * kontaktowe klienta, więc jest to decyzja klienta i nikogo innego. Gdyby
 * mogła ją wywołać firma, cała ochrona kontaktu byłaby pozorna.
 */
export function mozeZarzadzacKrotkaLista(widz: Widz): Rozstrzygniecie {
  switch (widz.rodzaj) {
    case "autor":
      return { wolno: true };

    case "anonim":
    case "klient":
    case "firma":
      return { wolno: false, powod: "brak-dostepu" };

    case "moderator":
      throw new NiezaimplementowanaGalazUprawnien(opiszWidza(widz), "mozeZarzadzacKrotkaLista");

    default: {
      const nigdy: never = widz;
      throw new NiezaimplementowanaGalazUprawnien(String(nigdy), "mozeZarzadzacKrotkaLista");
    }
  }
}

/** Co ten widz widzi na liście ofert zlecenia. */
export type ZakresOfert =
  /** Autor: wszystkie oferty, z cenami i treścią. */
  | { rodzaj: "wszystkie" }
  /** Firma: wyłącznie własna oferta. Cudzych nie widzi nawet w liczbie. */
  | { rodzaj: "wlasna"; companyId: string };

/**
 * Które oferty wolno pokazać. Rzuca dla gałęzi bez implementacji.
 *
 * Nie ma tu wariantu „żadne”: widz, który nie ma prawa do żadnej oferty,
 * dostaje odmowę wcześniej, z mozeZobaczycSzczegoly, zamiast pustej listy.
 * Pusta lista i brak dostępu wyglądają tak samo, a znaczą co innego.
 */
export function zakresOfert(widz: Widz): Rozstrzygniecie & { zakres?: ZakresOfert } {
  switch (widz.rodzaj) {
    case "autor":
      return { wolno: true, zakres: { rodzaj: "wszystkie" } };

    case "firma":
      // Także firma bez abonamentu widzi własną ofertę. Abonament rozstrzyga
      // o składaniu i o szczegółach zlecenia, nie o dostępie do własnych danych.
      return { wolno: true, zakres: { rodzaj: "wlasna", companyId: widz.companyId } };

    case "anonim":
    case "klient":
      return { wolno: false, powod: "brak-dostepu" };

    case "moderator":
      throw new NiezaimplementowanaGalazUprawnien(opiszWidza(widz), "zakresOfert");

    default: {
      const nigdy: never = widz;
      throw new NiezaimplementowanaGalazUprawnien(String(nigdy), "zakresOfert");
    }
  }
}

/**
 * Status profilu firmy, w takiej postaci, w jakiej interesuje regułę widoczności.
 * Odpowiada kolumnie `companies.status`.
 */
export type StatusProfilu = "draft" | "active" | "visitcard" | "suspended";

export type KontekstProfilu = {
  status: StatusProfilu;
  /** Czy pytający należy do tej firmy. */
  czlonekTejFirmy: boolean;
};

export type WidocznoscProfilu = {
  /** `false` oznacza prawdziwe 404, nie pustą stronę z nagłówkiem. */
  widoczny: boolean;
  /** Kalendarz dostępności. Tylko profil w pełni aktywny. */
  kalendarz: boolean;
  /** Wezwanie „przejmij ten profil”, widoczne przy profilu importowanym. */
  wezwanieDoPrzejecia: boolean;
  /** Dane kontaktowe firmy. Dziś zawsze `false`: nie ma takich kolumn. */
  daneKontaktowe: boolean;
};

/**
 * Co widać na publicznym profilu firmy.
 *
 * Cztery statusy, trzy różne zachowania:
 *
 *   draft      widoczny, z wezwaniem do przejęcia. To profil zaimportowany,
 *              którego właściciel jeszcze nie odebrał.
 *   active     widoczny w pełni, z kalendarzem dostępności.
 *   visitcard  widoczny w okrojonej formie, bez kalendarza. Tu trafia firma
 *              po wygaśnięciu abonamentu: profil nie znika, schodzi do wizytówki.
 *   suspended  niewidoczny. Ma być prawdziwe 404, bo strona zwracająca 200
 *              z pustą treścią zostanie zaindeksowana i zostanie w wynikach
 *              wyszukiwania na długo po zawieszeniu.
 *
 * Profil jest publiczny, więc widz nie zmienia zakresu treści. Zmienia tylko
 * to, czy widzi wezwanie do przejęcia: członkowi tej firmy nie proponujemy
 * przejęcia czegoś, co już do niego należy.
 */
export function widocznoscProfilu(widz: Widz, kontekst: KontekstProfilu): WidocznoscProfilu {
  // Domyślna odmowa dla gałęzi, których jeszcze nie ma.
  upewnijSieZeGalazUprawnienIstnieje(widz, "widocznoscProfilu");

  if (kontekst.status === "suspended") {
    return {
      widoczny: false,
      kalendarz: false,
      wezwanieDoPrzejecia: false,
      daneKontaktowe: false,
    };
  }

  return {
    widoczny: true,
    kalendarz: kontekst.status === "active",
    wezwanieDoPrzejecia: kontekst.status === "draft" && !kontekst.czlonekTejFirmy,
    // Kontakt do firmy idzie przez formularz zapytania, a tego jeszcze nie ma.
    // Nie ma też kolumn z telefonem i mailem i nie dodajemy ich tutaj.
    daneKontaktowe: false,
  };
}

/**
 * Czy ten widz może zgłosić, że profil firmy należy do niego.
 *
 * Wymaga zalogowania i nic poza tym: zgłosić może każdy, łącznie z konkurencją
 * zza rogu. Dlatego zgłoszenie **nie daje żadnego dostępu**, tylko tworzy
 * wniosek do ręcznego rozpatrzenia. Cała ochrona siedzi w zatwierdzaniu,
 * nie w tym, kto może wnioskować.
 *
 * Członek tej firmy dostaje odmowę, bo nie ma czego przejmować.
 */
export function mozeZglosicPrzejecie(widz: Widz, czlonekTejFirmy: boolean): Rozstrzygniecie {
  upewnijSieZeGalazUprawnienIstnieje(widz, "mozeZglosicPrzejecie");

  if (widz.rodzaj === "anonim") return { wolno: false, powod: "brak-dostepu" };
  if (czlonekTejFirmy) return { wolno: false, powod: "brak-dostepu" };
  return { wolno: true };
}

/**
 * Czy ten widz może edytować profil firmy.
 *
 * Wyłącznie członek tej firmy. **Wniosek o przejęcie, nawet oczekujący, nie
 * daje tu niczego**: człowiek z wnioskiem dostaje dokładnie tę samą odmowę,
 * co zupełnie obcy. Gdyby było inaczej, wystarczyłoby kliknąć „to moja firma”,
 * żeby zacząć edytować cudzy profil, a ręczne zatwierdzanie byłoby ozdobą.
 */
export function mozeEdytowacProfil(widz: Widz, czlonekTejFirmy: boolean): Rozstrzygniecie {
  upewnijSieZeGalazUprawnienIstnieje(widz, "mozeEdytowacProfil");

  return czlonekTejFirmy ? { wolno: true } : { wolno: false, powod: "brak-dostepu" };
}

/**
 * Rzuca, gdy gałąź uprawnień dla tego widza nie jest jeszcze zaimplementowana.
 *
 * Wydzielone, bo zapytania muszą odmówić **zanim** dotkną bazy, a nie mają
 * jeszcze czego rozstrzygać: kontekst poznają dopiero po odczycie. Bez tego
 * funkcja dla niezaimplementowanego widza najpierw pytałaby bazę, a dopiero
 * potem odmawiała, i gdyby ktoś zapomniał o tym drugim kroku, przepuściłaby
 * dane. Domyślna odmowa ma być pierwszą linią, nie ostatnią.
 */
export function upewnijSieZeGalazUprawnienIstnieje(widz: Widz, funkcja: string): void {
  switch (widz.rodzaj) {
    case "anonim":
    case "klient":
    case "autor":
    case "firma":
      return;

    case "moderator":
      throw new NiezaimplementowanaGalazUprawnien(opiszWidza(widz), funkcja);

    default: {
      const nigdy: never = widz;
      throw new NiezaimplementowanaGalazUprawnien(String(nigdy), funkcja);
    }
  }
}

/**
 * Czy firma widzi dane kontaktowe klienta.
 * Warunkiem jest wpis w `shortlist`, czyli działanie klienta, nigdy firmy.
 */
export function mozeZobaczycKontakt(widz: Widz, jestNaShortliscie: boolean): Rozstrzygniecie {
  switch (widz.rodzaj) {
    case "anonim":
    case "klient":
      return { wolno: false, powod: "brak-dostepu" };

    case "autor":
      // Autor zawsze widzi własne dane kontaktowe. Shortlist rozstrzyga
      // o tym, czy widzi je firma, a nie o tym, czy widzi je właściciel.
      return { wolno: true };

    case "firma":
      // Dane kontaktowe odsłania wyłącznie wpis w `shortlist`, czyli działanie
      // klienta. Sam abonament nie wystarcza i nigdy nie miał wystarczać.
      if (!widz.abonament) return { wolno: false, powod: "brak-abonamentu" };
      return jestNaShortliscie ? { wolno: true } : { wolno: false, powod: "brak-dostepu" };

    case "moderator":
      throw new NiezaimplementowanaGalazUprawnien(opiszWidza(widz), "mozeZobaczycKontakt");

    default: {
      const nigdy: never = widz;
      throw new NiezaimplementowanaGalazUprawnien(String(nigdy), "mozeZobaczycKontakt");
    }
  }
}

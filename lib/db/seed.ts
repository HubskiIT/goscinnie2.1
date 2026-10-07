/**
 * Dane zasiewowe. Skala z CLAUDE.md: 300 firm, 50 zleceń, 20 użytkowników.
 *
 * Zasiew celowo zawiera warianty złośliwe, bo to na nich wykłada się interfejs:
 * apostrof w nazwie, komplet polskich znaków, puste pola opcjonalne, wartości
 * graniczne budżetu i pojemności, firma z wygasłym abonamentem.
 */
import { hash } from "@node-rs/argon2";
import { db, schema } from "./index";

/**
 * Hasło do kont zasiewowych. Wyłącznie do pracy lokalnej: dzięki niemu da się
 * wejść na dowolne konto z zasiewu i zobaczyć widok autora bez zakładania
 * konta ręcznie za każdym resetem bazy.
 */
const HASLO_ZASIEWOWE = "goscinnie-lokalnie-2026";

const MIASTA = [
  {
    name: "Warszawa",
    slug: "warszawa",
    powiat: "Warszawa",
    woj: "mazowieckie",
    lon: 21.0122,
    lat: 52.2297,
  },
  {
    name: "Żyrardów",
    slug: "zyrardow",
    powiat: "żyrardowski",
    woj: "mazowieckie",
    lon: 20.4462,
    lat: 52.0489,
  },
  {
    name: "Kraków",
    slug: "krakow",
    powiat: "Kraków",
    woj: "małopolskie",
    lon: 19.945,
    lat: 50.0647,
  },
  { name: "Gdańsk", slug: "gdansk", powiat: "Gdańsk", woj: "pomorskie", lon: 18.6466, lat: 54.352 },
  { name: "Łódź", slug: "lodz", powiat: "Łódź", woj: "łódzkie", lon: 19.4559, lat: 51.7592 },
  {
    name: "Świdnica",
    slug: "swidnica",
    powiat: "świdnicki",
    woj: "dolnośląskie",
    lon: 16.4887,
    lat: 50.8449,
  },
];

const KATEGORIE = [
  { slug: "sale", name: "Sale i lokale" },
  { slug: "catering", name: "Catering" },
  { slug: "fotograf", name: "Fotograf" },
  { slug: "dj", name: "DJ i muzyka" },
  { slug: "dekoracje", name: "Dekoracje" },
  { slug: "tort", name: "Torty i słodki stół" },
];

// Decyzja 001: rodzaj okazji to pierwszorzędny wymiar, nie dopisek.
// Wesela są jedną z kategorii, nie osią produktu.
const OKAZJE = [
  { slug: "urodziny", name: "Urodziny" },
  { slug: "wesele", name: "Wesele" },
  { slug: "komunia", name: "Komunia" },
  { slug: "chrzciny", name: "Chrzciny" },
  { slug: "osiemnastka", name: "Osiemnastka" },
  { slug: "stypa", name: "Stypa" },
  { slug: "event-firmowy", name: "Event firmowy" },
  { slug: "plener", name: "Plener" },
];

/**
 * Nazwy firm razem z kategorią, do której należą.
 *
 * Nazwa musi pasować do branży. Wcześniej kategoria była przydzielana
 * niezależnie od nazwy i wychodziły z tego firmy w rodzaju „Muzyka i Światło”
 * z kategorią „Catering”. Zasiew ma być złośliwy w danych, nie bezsensowny
 * w treści: taki szum niczego nie sprawdza, a każde spojrzenie na stronę
 * kończy się potknięciem o niego.
 *
 * Złośliwość zostaje tam, gdzie coś sprawdza: apostrof w nazwie, pusty opis,
 * brak ceny, firma należąca do dwóch kategorii.
 */
const NAZWY_FIRM: ReadonlyArray<{ nazwa: string; kategoria: string }> = [
  { nazwa: "Dworek pod Dębem", kategoria: "sale" },
  // Apostrof w nazwie: wariant złośliwy dla slugów i dla cytowania w SQL.
  { nazwa: "Zajazd u Grzegorza'a", kategoria: "sale" },
  { nazwa: "Willa Źródło", kategoria: "sale" },
  { nazwa: "Sala Bankietowa Łąka", kategoria: "sale" },
  { nazwa: "Kuchnia Ćwierć Miary", kategoria: "catering" },
  { nazwa: "Stół Świętokrzyski", kategoria: "catering" },
  { nazwa: "Fotografia Ćmielów", kategoria: "fotograf" },
  { nazwa: "Muzyka i Światło", kategoria: "dj" },
  { nazwa: "Dekoracje pod Klonem", kategoria: "dekoracje" },
  { nazwa: "Tort od Krystyny", kategoria: "tort" },
];

/** Prosty, powtarzalny generator: ten sam zasiew przy każdym uruchomieniu. */
function pseudolosowa(ziarno: number): () => number {
  let stan = ziarno;
  return () => {
    stan = (stan * 1664525 + 1013904223) % 4294967296;
    return stan / 4294967296;
  };
}

/**
 * Zasiew tworzy świat pokazowy: firmy, konta i zlecenia, których nikt nie
 * zakładał. Na produkcji byłyby to dane udające prawdziwe, więc skrypt tam
 * nie rusza. Słowniki, czyli to, czego serwis naprawdę potrzebuje, wypełnia
 * osobny `scripts/slowniki.ts`.
 */
function odmowNaProdukcji(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Zasiew pokazowy nie działa na produkcji. Słowniki wypełnia pnpm db:slowniki.");
  }
}

async function zasiej(): Promise<void> {
  odmowNaProdukcji();
  const losuj = pseudolosowa(20260923);

  const wierszeMiast = await db
    .insert(schema.cities)
    .values(
      MIASTA.map((m) => ({
        name: m.name,
        slug: m.slug,
        powiat: m.powiat,
        wojewodztwo: m.woj,
        point: { lon: m.lon, lat: m.lat },
      })),
    )
    .returning();

  // Baza zwraca `point` jako wartość sterownika, więc współrzędne do losowania
  // bierzemy ze stałej MIASTA, nie z odpowiedzi.
  const miasta = wierszeMiast.map((wiersz, i) => {
    const zrodlo = MIASTA[i];
    if (!zrodlo) throw new Error("Zasiew: rozjazd między MIASTA a wstawionymi wierszami.");
    return { id: wiersz.id, lon: zrodlo.lon, lat: zrodlo.lat };
  });

  const kategorie = await db.insert(schema.categories).values(KATEGORIE).returning();
  const okazje = await db.insert(schema.eventTypes).values(OKAZJE).returning();

  // 20 użytkowników: 14 klientów, 5 właścicieli firm, 1 moderator.
  const uzytkownicy = await db
    .insert(schema.users)
    .values(
      Array.from({ length: 20 }, (_, i) => ({
        email: `uzytkownik${i + 1}@przyklad.pl`,
        name: i === 19 ? "Łucja Żmuda-Ćwiek" : `Osoba ${i + 1}`,
        phone: i % 3 === 0 ? null : `+4860000${String(i).padStart(4, "0")}`,
        role:
          i === 19
            ? ("moderator" as const)
            : i < 5
              ? ("company_owner" as const)
              : ("client" as const),
      })),
    )
    .returning();

  // Poświadczenia do logowania. Bez wiersza w `accounts` konto z zasiewu
  // istnieje, ale nie da się na nie wejść, więc widok autora byłby nie do
  // sprawdzenia ręcznie.
  const skrot = await hash(HASLO_ZASIEWOWE, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
  await db.insert(schema.accounts).values(
    uzytkownicy.map((u) => ({
      userId: u.id,
      // better-auth trzyma tu identyfikator użytkownika, nie adres e-mail.
      // Wpisanie tu maila daje konto, na które nie da się zalogować.
      accountId: u.id,
      providerId: "credential",
      password: skrot,
    })),
  );

  const wlasciciele = uzytkownicy.filter((u) => u.role === "company_owner");
  const klienci = uzytkownicy.filter((u) => u.role === "client");

  // Ceny planów zależą od kategorii — nie ma jednego cennika dla sali i dla DJ-a.
  const wstawionePlany = await db
    .insert(schema.plans)
    .values(
      kategorie.flatMap((k) => [
        { categoryId: k.id, code: "start" as const, priceAnnual: 99900, bidsLimit: 15 },
        { categoryId: k.id, code: "pro" as const, priceAnnual: 249900, bidsLimit: null },
      ]),
    )
    .returning();

  const planyWgKategorii = new Map(
    wstawionePlany.filter((p) => p.code === "start").map((p) => [p.categoryId, p.id]),
  );

  // 300 firm. Co dziesiąta zostaje wizytówką (wygasły abonament), co dwudziesta
  // jest szkicem bez ceny — oba stany muszą mieć na czym się pokazać.
  const firmy = await db
    .insert(schema.companies)
    .values(
      Array.from({ length: 300 }, (_, i) => {
        const miasto = miasta[i % miasta.length];
        const wlasciciel = wlasciciele[i % wlasciciele.length];
        if (!miasto || !wlasciciel) throw new Error("Zasiew: brak miasta albo właściciela.");
        /*
         * Pierwsza dziesiątka to firmy wykorzystywane przez testy i przez pracę
         * ręczną, więc ich stan jest ustawiony jawnie, a nie losowo:
         *
         *   0..6   aktywne, z ceną i opisem (warianty abonamentu i limitów)
         *   7      profil importowany: draft, bez opisu i bez ceny
         *   8      zawieszony, ma zwracać 404
         *   9      wizytówka po wygasłym abonamencie
         *
         * Reszta zachowuje losowy rozrzut.
         */
        const wyrozniona = i < 10;
        const importowany = i === 7;
        const zawieszony = i === 8;
        const wizytowka = i === 9;
        const szkic = importowany || (!wyrozniona && i % 20 === 0);
        return {
          ownerUserId: wlasciciel.id,
          name: `${NAZWY_FIRM[i % NAZWY_FIRM.length]?.nazwa ?? ""} ${i + 1}`,
          slug: `firma-${i + 1}`,
          cityId: miasto.id,
          point: {
            lon: miasto.lon + (losuj() - 0.5) * 0.2,
            lat: miasto.lat + (losuj() - 0.5) * 0.2,
          },
          description: importowany
            ? // Profil z importu: znamy nazwę i miasto, nic więcej. To jest
              // stan domyślny sześciuset profili, nie przypadek brzegowy.
              ""
            : i === 0
              ? "Dworek z 1908 roku, sala na sto dwadzieścia osób, ogród z zadaszeniem " +
                "i własna kuchnia. Prowadzimy go rodzinnie od trzech pokoleń."
              : i % 7 === 0
                ? ""
                : "Miejsce na każdą okazję. Ćwierć wieku doświadczenia.",
          // Szkic bez ceny: karta bez ceny nie przechodzi moderacji (docs/tokeny.md).
          priceFrom: szkic ? null : 5000 + Math.floor(losuj() * 50) * 1000,
          capacityMin: i % 5 === 0 ? null : 20,
          capacityMax: i % 5 === 0 ? null : 60 + i,
          status: zawieszony
            ? ("suspended" as const)
            : wizytowka
              ? ("visitcard" as const)
              : szkic
                ? ("draft" as const)
                : !wyrozniona && i % 10 === 0
                  ? ("visitcard" as const)
                  : ("active" as const),
        };
      }),
    )
    .returning();

  /*
   * Kalendarz dostępności dla firmy-1, czyli profilu kompletnego. Bez tego
   * publiczny profil nie miałby czego pokazać w sekcji terminów, a to jest
   * jedna z dwóch rzeczy, dla których ktoś w ogóle otwiera profil.
   *
   * Terminy są przyszłe i policzone od dzisiaj, nie wpisane na sztywno:
   * data wpisana w zasiewie zestarzałaby się po kilku miesiącach i kalendarz
   * wyglądałby na zepsuty.
   */
  const dzisiaj = new Date();
  await db.insert(schema.availability).values(
    Array.from({ length: 30 }, (_, i) => {
      const dzien = new Date(dzisiaj);
      dzien.setDate(dzien.getDate() + i + 3);
      const iso = dzien.toISOString().slice(0, 10);
      return {
        companyId: firmy[0]?.id ?? "",
        date: iso,
        // Co czwarty dzień zajęty, żeby kalendarz nie wyglądał na wygenerowany.
        status: i % 4 === 0 ? ("booked" as const) : ("free" as const),
      };
    }),
  );

  /** Kategoria firmy wynika z jej nazwy, nie z niezależnego licznika. */
  const kategorieWgSluga = new Map(kategorie.map((k) => [k.slug, k]));

  function kategoriaFirmy(indeksFirmy: number) {
    const slug = NAZWY_FIRM[indeksFirmy % NAZWY_FIRM.length]?.kategoria;
    const kategoria = slug ? kategorieWgSluga.get(slug) : undefined;
    if (!kategoria) throw new Error(`Zasiew: brak kategorii dla firmy ${indeksFirmy}.`);
    return kategoria;
  }

  await db
    .insert(schema.companyCategories)
    .values(firmy.map((f, i) => ({ companyId: f.id, categoryId: kategoriaFirmy(i).id })));

  // Członkostwa i abonamenty. Cztery warianty firm, bo na nich stoi cała
  // reguła „co kto widzi” po stronie firmowej:
  //
  //   firma-1  abonament aktywny
  //   firma-2  abonament wygasły: status active, ale data w przeszłości
  //   firma-3  abonament odwołany: status cancelled, data jeszcze w przyszłości
  //   firma-4  brak jakiegokolwiek abonamentu
  //
  // Wariant trzeci istnieje po to, żeby dało się sprawdzić każdy z dwóch
  // warunków aktywności osobno. Przy samym wygasłym nie da się odróżnić kodu,
  // który sprawdza datę, od kodu, który sprawdza jedno i drugie.
  const [
    firmaAktywna,
    firmaWygasla,
    firmaOdwolana,
    firmaBezAbonamentu,
    firmaPrzyLimicie,
    firmaNaLimicie,
    firmaTylkoBez,
  ] = firmy;
  if (
    !firmaAktywna ||
    !firmaWygasla ||
    !firmaOdwolana ||
    !firmaBezAbonamentu ||
    !firmaPrzyLimicie ||
    !firmaNaLimicie ||
    !firmaTylkoBez
  ) {
    throw new Error("Zasiew: za mało firm na warianty abonamentu.");
  }

  const [pracownikA, pracownikB, pracownikC, pracownikD, pracownikE] = wlasciciele;
  if (!pracownikA || !pracownikB || !pracownikC || !pracownikD || !pracownikE) {
    throw new Error("Zasiew: za mało właścicieli.");
  }

  // Daty członkostw ustawiamy jawnie, bo od ich kolejności zależy wybór firmy
  // przy braku przełącznika w panelu. Bez tego wszystkie wiersze miałyby ten sam
  // created_at, kolejność rozstrzygałby losowy identyfikator, a scenariusz
  // „właściciel firmy z abonamentem należy też do firmy bez” raz by działał,
  // raz nie. Test przechodzący przez przypadek jest gorszy niż brak testu.
  const dawno = new Date();
  dawno.setDate(dawno.getDate() - 30);
  const niedawno = new Date();
  niedawno.setDate(niedawno.getDate() - 7);

  await db.insert(schema.companyMembers).values([
    // pracownikA należy do dwóch firm i przypadek jest ustawiony tak, żeby
    // o wyborze rozstrzygał WYŁĄCZNIE abonament:
    //
    //   firma-4  właściciel, członkostwo starsze, bez abonamentu
    //   firma-1  zwykły członek, członkostwo młodsze, abonament aktywny
    //
    // Każde inne kryterium (rola, wiek członkostwa) wskazuje tu firmę bez
    // abonamentu. Gdyby pierwszeństwo firmy z abonamentem zniknęło, ten człowiek
    // dostałby zajawkę mimo opłaconego dostępu w drugiej firmie, i właśnie to
    // ma wyłapać test.
    {
      companyId: firmaBezAbonamentu.id,
      userId: pracownikA.id,
      role: "owner" as const,
      createdAt: dawno,
    },
    {
      companyId: firmaAktywna.id,
      userId: pracownikA.id,
      role: "member" as const,
      createdAt: niedawno,
    },
    {
      companyId: firmaWygasla.id,
      userId: pracownikB.id,
      role: "owner" as const,
      createdAt: dawno,
    },
    {
      companyId: firmaOdwolana.id,
      userId: pracownikB.id,
      role: "member" as const,
      createdAt: niedawno,
    },
    // Dwie firmy pod limit ofert w planie Start (piętnaście w okresie).
    { companyId: firmaPrzyLimicie.id, userId: pracownikC.id, role: "owner" as const },
    { companyId: firmaNaLimicie.id, userId: pracownikD.id, role: "owner" as const },
    // Firma bez abonamentu z człowiekiem, który NIE należy do żadnej innej.
    // firma-4 ma właściciela z dwiema firmami, więc nie nadaje się do testu
    // „firma bez abonamentu dostaje 402”: kontekst rozwiązałby się na tę drugą,
    // z abonamentem. Ten wariant istnieje po to, żeby scenariusz był czysty.
    { companyId: firmaTylkoBez.id, userId: pracownikE.id, role: "owner" as const },
  ]);

  /** Plan Start z kategorii tej firmy. Cennik zależy od kategorii. */
  function planStartDlaFirmy(indeksFirmy: number): string {
    // Plan musi pochodzić z kategorii, którą firma naprawdę ma, bo cennik
    // zależy od kategorii. Wcześniej oba liczniki chodziły osobno i firma
    // dostawała plan z branży, w której jej nie było.
    const plan = planyWgKategorii.get(kategoriaFirmy(indeksFirmy).id);
    if (!plan) throw new Error("Zasiew: brak planu Start dla kategorii tej firmy.");
    return plan;
  }

  const zaRok = new Date();
  zaRok.setFullYear(zaRok.getFullYear() + 1);
  const wczoraj = new Date();
  wczoraj.setDate(wczoraj.getDate() - 1);

  await db.insert(schema.subscriptions).values([
    {
      companyId: firmaAktywna.id,
      planId: planStartDlaFirmy(0),
      status: "active" as const,
      expiresAt: zaRok,
    },
    // Wygasły: status nadal active, minęła data. Tak to wygląda naprawdę,
    // bo statusu nikt nie przestawia w momencie wygaśnięcia.
    {
      companyId: firmaWygasla.id,
      planId: planStartDlaFirmy(1),
      status: "active" as const,
      expiresAt: wczoraj,
    },
    // Odwołany: data jeszcze nie minęła, ale status mówi nie.
    {
      companyId: firmaOdwolana.id,
      planId: planStartDlaFirmy(2),
      status: "cancelled" as const,
      expiresAt: zaRok,
    },
    {
      companyId: firmaPrzyLimicie.id,
      planId: planStartDlaFirmy(4),
      status: "active" as const,
      expiresAt: zaRok,
    },
    {
      companyId: firmaNaLimicie.id,
      planId: planStartDlaFirmy(5),
      status: "active" as const,
      expiresAt: zaRok,
    },
  ]);

  /*
   * Wnioski o przejęcie profilu. Cztery warianty, bo na nich stoi cała reguła:
   *
   *   firma-8   wniosek oczekujący (profil importowany, do przejęcia)
   *   firma-11  wniosek zatwierdzony
   *   firma-12  wniosek odrzucony
   *   firma-13  DWA oczekujące wnioski od różnych osób
   *
   * Ostatni wariant jest tu najważniejszy: dwa zgłoszenia do jednej firmy mają
   * się zapisać, bo to sygnał do sprawdzenia, a nie błąd. Gdyby zapisywało się
   * tylko pierwsze, konkurencja zza rogu blokowałaby prawdziwego właściciela
   * samym kliknięciem.
   */
  const [wnioskodawcaA, wnioskodawcaB] = klienci;
  if (!wnioskodawcaA || !wnioskodawcaB) throw new Error("Zasiew: za mało klientów na wnioski.");

  const firmaDoPrzejecia = firmy[7];
  const firmaPrzejeta = firmy[10];
  const firmaOdrzucona = firmy[11];
  const firmaSporna = firmy[12];
  if (!firmaDoPrzejecia || !firmaPrzejeta || !firmaOdrzucona || !firmaSporna) {
    throw new Error("Zasiew: za mało firm na warianty wniosków.");
  }

  const rozpatrzonoWczoraj = new Date();
  rozpatrzonoWczoraj.setDate(rozpatrzonoWczoraj.getDate() - 1);

  await db.insert(schema.companyClaims).values([
    {
      companyId: firmaDoPrzejecia.id,
      userId: wnioskodawcaA.id,
      status: "pending" as const,
      uzasadnienie: "Prowadzę tę salę od 2011 roku, mam ją wpisaną w CEIDG.",
    },
    {
      companyId: firmaPrzejeta.id,
      userId: wnioskodawcaA.id,
      status: "approved" as const,
      uzasadnienie: "Właściciel, faktura za prąd na ten adres.",
      rozpatrzonoO: rozpatrzonoWczoraj,
    },
    {
      companyId: firmaOdrzucona.id,
      userId: wnioskodawcaB.id,
      status: "rejected" as const,
      uzasadnienie: "Bez uzasadnienia, zgłoszenie z przypadkowego konta.",
      rozpatrzonoO: rozpatrzonoWczoraj,
    },
    // Dwa wnioski do jednej firmy, od różnych osób. Oba oczekują.
    {
      companyId: firmaSporna.id,
      userId: wnioskodawcaA.id,
      status: "pending" as const,
      uzasadnienie: "To moja firma, prowadzę ją z bratem.",
    },
    {
      companyId: firmaSporna.id,
      userId: wnioskodawcaB.id,
      status: "pending" as const,
      uzasadnienie: "To moja firma, brat nie ma z nią nic wspólnego.",
    },
  ]);

  // Zatwierdzony wniosek ma odpowiadające mu członkostwo: tak wygląda profil
  // faktycznie przejęty, a nie tylko odhaczony w tabeli wniosków.
  await db.insert(schema.companyMembers).values({
    companyId: firmaPrzejeta.id,
    userId: wnioskodawcaA.id,
    role: "owner" as const,
  });

  /*
   * PRZECIĘCIA RÓL. Właściciel sali organizuje komunię córki, więc jest
   * jednocześnie firmą i klientem. Dopóki te zbiory się w zasiewie nie
   * przecinały, cała klasa błędów w rozpoznawaniu widza była niewidoczna:
   * autorstwo własnego zlecenia znikało w chwili dopisania kogoś do firmy
   * i nikt tego nie zauważył przez cztery plastry.
   *
   * Autorami zleceń są więc także ludzie z firm, nie tylko czyści klienci.
   */
  const autorzy = [...klienci, pracownikA, pracownikC];

  // 50 zleceń. Cztery pierwsze to przypadki wyróżnione, reszta to tło.
  //
  //   0 — otwarte, bez żadnej oferty
  //   1 — otwarte, z dziesięcioma ofertami
  //   2 — wygasłe, nie może pojawić się na liście publicznej
  //   3 — apostrof w opisie, wariant złośliwy dla cytowania
  //
  // Wariant graniczny w tle: zlecenie bez budżetu i z opisem krótszym niż
  // 120 znaków, żeby zajawka dla firmy bez abonamentu nie miała czego wyciąć.
  const zlecenia = await db
    .insert(schema.requests)
    .values(
      Array.from({ length: 50 }, (_, i) => {
        const miasto = miasta[i % miasta.length];
        // Co siódme zlecenie wystawia człowiek z firmy, reszta czyści klienci.
        const klient =
          i % 7 === 5 ? autorzy[autorzy.length - (i % 2) - 1] : klienci[i % klienci.length];
        const okazja = okazje[i % okazje.length];
        if (!miasto || !klient || !okazja) throw new Error("Zasiew: brak danych zlecenia.");
        const krotkiOpis = i % 6 === 0;
        const wygasle = i === 2;
        return {
          authorUserId: klient.id,
          eventTypeId: okazja.id,
          eventDate: `2027-0${(i % 9) + 1}-1${i % 9}`,
          guests: 10 + i * 3,
          cityId: miasto.id,
          point: { lon: miasto.lon, lat: miasto.lat },
          description:
            i === 3
              ? "Chcemy zrobić to u dziadków' w ogrodzie, bez sztywnej sali."
              : krotkiOpis
                ? "Kameralnie, w ogrodzie."
                : "Szukamy miejsca na przyjęcie. Zależy nam na ogrodzie, kuchni bez półproduktów " +
                  "i możliwości zostania do późna. Gości będzie sporo, w tym dzieci i osoby starsze.",
          budgetMin: i % 4 === 0 ? null : 500000,
          budgetMax: i % 4 === 0 ? null : 1500000 + i * 10000,
          status: wygasle ? ("expired" as const) : ("open" as const),
          // Wygasłe zlecenie ma termin w przeszłości, żeby odsiew po dacie
          // dało się sprawdzić niezależnie od kolumny status.
          expiresAt: wygasle ? new Date("2026-01-01T00:00:00Z") : new Date("2027-01-01T00:00:00Z"),
        };
      }),
    )
    .returning();

  /*
   * Oferty. Cztery scenariusze, każdy pod inną regułę:
   *
   *   zlecenie 0   bez żadnej oferty
   *   zlecenie 1   dziewięć ofert, czyli jedno miejsce wolne
   *   zlecenie 4   dziesięć ofert, czyli pełne
   *   firma-5      czternaście ofert w okresie, jedna poniżej limitu planu Start
   *   firma-6      piętnaście ofert w okresie, dokładnie na limicie
   *
   * Oferty wypełniające zlecenia składają firmy o wysokich numerach, żeby
   * nie zaburzyć licznika okresowego firm 5 i 6. Gdyby te same firmy trafiły
   * do obu grup, scenariusz limitu przestałby być rozstrzygający.
   */
  function zlecenieNr(nr: number) {
    const zlecenie = zlecenia[nr];
    if (!zlecenie) throw new Error(`Zasiew: brak zlecenia numer ${nr}.`);
    return zlecenie;
  }

  function firmaNr(nr: number) {
    const firma = firmy[nr];
    if (!firma) throw new Error(`Zasiew: brak firmy numer ${nr}.`);
    return firma;
  }

  const oferty: Array<{
    requestId: string;
    companyId: string;
    price: number;
    message: string;
  }> = [];

  // Zlecenie 1: dziewięć ofert. Zostaje jedno miejsce.
  for (let i = 0; i < 9; i += 1) {
    oferty.push({
      requestId: zlecenieNr(1).id,
      companyId: firmaNr(20 + i).id,
      price: 800000 + i * 50000,
      message: `Mamy wolny termin i obsługę na miejscu. Oferta numer ${i + 1}.`,
    });
  }

  // Zlecenie 4: dziesięć ofert, czyli komplet. Jedenasta ma dostać odmowę
  // nieodróżnialną od odmowy dla zlecenia zamkniętego.
  for (let i = 0; i < 10; i += 1) {
    oferty.push({
      requestId: zlecenieNr(4).id,
      companyId: firmaNr(30 + i).id,
      price: 900000 + i * 40000,
      message: `Zrobimy to u nas. Oferta numer ${i + 1}.`,
    });
  }

  // firma-5: czternaście ofert w okresie, każda na innym zleceniu, bo jedna
  // firma może mieć tylko jedną ofertę na zlecenie.
  for (let i = 0; i < 14; i += 1) {
    oferty.push({
      requestId: zlecenieNr(10 + i).id,
      companyId: firmaPrzyLimicie.id,
      price: 700000,
      message: "Oferta firmy tuż pod limitem planu Start.",
    });
  }

  /*
   * Firma składająca ofertę na zlecenie spoza swojej kategorii.
   *
   * W rzeczywistości zdarza się to stale: sala bierze zlecenie opisane jako
   * catering, bo ma własną kuchnię. Reguła uprawnień nie patrzy dziś na
   * kategorię i dobrze, ale zasiew ma ten przypadek zawierać, żeby przyszłe
   * dopasowanie po kategorii nie zostało napisane na danych, w których
   * kategoria zawsze się zgadza.
   */
  const firmaZInnejKategorii = firmy[20];
  if (firmaZInnejKategorii) {
    oferty.push({
      requestId: zlecenieNr(40).id,
      companyId: firmaZInnejKategorii.id,
      price: 640000,
      message: "Nie jesteśmy w tej kategorii, ale robimy to od lat. Zapraszamy.",
    });
  }

  // firma-6: piętnaście ofert, czyli dokładnie limit planu Start.
  for (let i = 0; i < 15; i += 1) {
    oferty.push({
      requestId: zlecenieNr(24 + i).id,
      companyId: firmaNaLimicie.id,
      price: 750000,
      message: "Oferta firmy na wyczerpanym limicie planu Start.",
    });
  }

  await db.insert(schema.bids).values(oferty);

  console.log(
    `Zasiane: ${wierszeMiast.length} miast, ${kategorie.length} kategorii, ${okazje.length} okazji, ` +
      `${uzytkownicy.length} użytkowników, ${firmy.length} firm, ${zlecenia.length} zleceń, ` +
      `${oferty.length} ofert.`,
  );
  console.log(
    "Abonamenty: firma-1 aktywny, firma-2 wygasły, firma-3 odwołany, firma-4 bez abonamentu, " +
      "firma-5 aktywny z 14 ofertami w okresie, firma-6 aktywny z 15 (na limicie), " +
      "firma-7 bez abonamentu i bez drugiej firmy.",
  );
  console.log(
    "Przecięcia ról: pracownikA i pracownikC są jednocześnie firmami i autorami zleceń, " +
      "pracownikA należy do dwóch firm, firma-21 złożyła ofertę spoza swojej kategorii.",
  );
  console.log(
    "Wnioski o przejęcie: firma-8 oczekujący, firma-11 zatwierdzony, " +
      "firma-12 odrzucony, firma-13 dwa oczekujące od różnych osób.",
  );
  console.log("Zlecenia: numer 0 bez ofert, numer 1 z dziewięcioma, numer 4 pełne (dziesięć).");
  console.log(
    "Profile publiczne: /f/firma-1 kompletny, /f/firma-8 importowany (pusty), " +
      "/f/firma-9 zawieszony (404), /f/firma-10 wizytówka.",
  );
  console.log(
    `Logowanie lokalne: dowolny adres uzytkownikN@przyklad.pl, hasło ${HASLO_ZASIEWOWE}. ` +
      "Autorem zlecenia numer 1 jest uzytkownik6@przyklad.pl.",
  );
}

await zasiej();
process.exit(0);

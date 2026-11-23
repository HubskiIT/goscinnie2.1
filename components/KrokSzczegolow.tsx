"use client";

import { useState } from "react";
import { BladPola, idBledu, maBlad } from "@/components/BladPola";
import type { StanFormularza } from "@/lib/formularze";
import { MAKS_POZYCJI_W_CENIE } from "@/lib/validators/szczegoly";

/**
 * Krok piąty kreatora: pytania zależne od rodzaju firmy.
 *
 * DLACZEGO OSOBNY PLIK. Ekran kreatora ma blisko dziewięćset linii i dwa
 * zestawy po kilkanaście pól dołożyłyby do niego połowę tego. Granica
 * jest naturalna: ten komponent nie zna kroków, przycisków „dalej” ani
 * paska postępu, tylko rysuje pola i oddaje je formularzowi, w którym stoi.
 *
 * WSZYSTKIE PYTANIA SĄ WIDOCZNE OD RAZU, także te nieobowiązkowe, i to
 * jest świadomy wybór przeciwny do chowania ich pod „pokaż więcej”.
 * Schowane pytanie zostaje bez odpowiedzi, a każda odpowiedź tutaj to
 * jeden telefon mniej do firmy. Obowiązkowe są oznaczone i tylko one
 * blokują publikację; resztę widać, że można zostawić na później.
 */

export type RodzajSzczegolow = "venue" | "service";

/** Wartości, które mają stać w polach przy wejściu. Puste znaczy „bez odpowiedzi”. */
export type WartosciSzczegolow = Readonly<Record<string, string>>;

interface Props {
  rodzaj: RodzajSzczegolow;
  stan: StanFormularza;
  wartosci: WartosciSzczegolow;
  /** Pozycje „co jest w cenie”, w kolejności. Tylko dla usługodawcy. */
  wCenie: readonly string[];
  /** Czego brakuje do publikacji, policzone na serwerze. */
  braki: readonly string[];
}

const KLASA_POLA =
  "w-full border border-[#D9CCC2] rounded-[12px] bg-white px-4 py-3 text-[15px] text-[#241C2B]";
const KLASA_ETYKIETY = "text-[14px] font-semibold text-[#3E3344]";

/** Znacznik przy pytaniach, bez których nie da się opublikować. */
function Wymagane() {
  return <span className="text-[13px] font-normal text-[#8A3B1E]"> · wymagane</span>;
}

function Pole({
  nazwa,
  etykieta,
  stan,
  wymagane,
  podpowiedz,
  children,
}: {
  nazwa: string;
  etykieta: string;
  stan: StanFormularza;
  wymagane?: boolean | undefined;
  podpowiedz?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`sz-${nazwa}`} className={KLASA_ETYKIETY}>
        {etykieta}
        {wymagane ? <Wymagane /> : null}
      </label>
      {children}
      {podpowiedz ? <p className="m-0 text-[13px] text-[#6A5C70]">{podpowiedz}</p> : null}
      <BladPola stan={stan} pole={nazwa} />
    </div>
  );
}

function Lista({
  nazwa,
  etykieta,
  stan,
  wartosc,
  opcje,
  wymagane,
  podpowiedz,
}: {
  nazwa: string;
  etykieta: string;
  stan: StanFormularza;
  wartosc: string;
  opcje: ReadonlyArray<readonly [string, string]>;
  wymagane?: boolean | undefined;
  podpowiedz?: string | undefined;
}) {
  return (
    <Pole nazwa={nazwa} etykieta={etykieta} stan={stan} wymagane={wymagane} podpowiedz={podpowiedz}>
      <select
        id={`sz-${nazwa}`}
        name={nazwa}
        defaultValue={wartosc}
        aria-invalid={maBlad(stan, nazwa)}
        aria-describedby={maBlad(stan, nazwa) ? idBledu(nazwa) : undefined}
        className={KLASA_POLA}
      >
        {/*
          Pusta pozycja na początku każdej listy. To ona znaczy „jeszcze nie
          odpowiedziałem” i bez niej pierwsza pozycja słownika byłaby
          domyślną odpowiedzią, której nikt nie udzielił.
        */}
        <option value="">Bez odpowiedzi</option>
        {opcje.map(([klucz, nazwaOpcji]) => (
          <option key={klucz} value={klucz}>
            {nazwaOpcji}
          </option>
        ))}
      </select>
    </Pole>
  );
}

/** Tak, nie, albo brak odpowiedzi. Nigdy pole wyboru, patrz lib/validators/szczegoly.ts. */
function TakNie(props: {
  nazwa: string;
  etykieta: string;
  stan: StanFormularza;
  wartosc: string;
  wymagane?: boolean | undefined;
  podpowiedz?: string | undefined;
}) {
  return (
    <Lista
      {...props}
      opcje={[
        ["tak", "Tak"],
        ["nie", "Nie"],
      ]}
    />
  );
}

function Liczba({
  nazwa,
  etykieta,
  stan,
  wartosc,
  wymagane,
  podpowiedz,
  jednostka,
}: {
  nazwa: string;
  etykieta: string;
  stan: StanFormularza;
  wartosc: string;
  wymagane?: boolean | undefined;
  podpowiedz?: string | undefined;
  jednostka?: string | undefined;
}) {
  return (
    <Pole nazwa={nazwa} etykieta={etykieta} stan={stan} wymagane={wymagane} podpowiedz={podpowiedz}>
      <div className="flex items-center gap-2">
        <input
          id={`sz-${nazwa}`}
          name={nazwa}
          type="number"
          inputMode="numeric"
          defaultValue={wartosc}
          aria-invalid={maBlad(stan, nazwa)}
          aria-describedby={maBlad(stan, nazwa) ? idBledu(nazwa) : undefined}
          className={KLASA_POLA}
        />
        {jednostka ? <span className="text-[14px] text-[#6A5C70]">{jednostka}</span> : null}
      </div>
    </Pole>
  );
}

function Naglowek({ tekst }: { tekst: string }) {
  return <h3 className="m-0 mt-2 font-fraunces font-medium text-[20px] text-[#241C2B]">{tekst}</h3>;
}

export function KrokSzczegolow({ rodzaj, stan, wartosci, wCenie, braki }: Props) {
  const w = (pole: string) => wartosci[pole] ?? "";

  return (
    <div className="flex flex-col gap-5">
      {braki.length > 0 ? (
        <p
          role="status"
          className="m-0 rounded-[12px] border border-[#E2D5CA] bg-[#F7F1EB] p-4 text-[15px] leading-[1.6] text-[#55485A]"
        >
          Do publikacji brakuje jeszcze: {braki.join(", ")}. Resztę pytań możesz zostawić na później
          i uzupełnić z panelu.
        </p>
      ) : null}

      {rodzaj === "venue" ? <PytaniaLokalu stan={stan} w={w} /> : null}
      {rodzaj === "service" ? <PytaniaUslugodawcy stan={stan} w={w} wCenie={wCenie} /> : null}
    </div>
  );
}

function PytaniaLokalu({ stan, w }: { stan: StanFormularza; w: (pole: string) => string }) {
  return (
    <>
      <Naglowek tekst="Ile osób i na jakich zasadach" />

      <div className="grid sm:grid-cols-2 gap-5">
        <Liczba
          nazwa="miejscPrzyStolach"
          etykieta="Miejsca przy stołach"
          stan={stan}
          wartosc={w("miejscPrzyStolach")}
          wymagane
          jednostka="osób"
          podpowiedz="Wystarczy jedna z dwóch liczb: przy stołach albo na stojąco."
        />
        <Liczba
          nazwa="miejscNaStojaco"
          etykieta="Miejsca na stojąco"
          stan={stan}
          wartosc={w("miejscNaStojaco")}
          jednostka="osób"
        />
        <Liczba
          nazwa="minimumGosci"
          etykieta="Minimalna liczba gości"
          stan={stan}
          wartosc={w("minimumGosci")}
          jednostka="osób"
          podpowiedz="Zostaw puste, jeśli nie masz progu wejścia."
        />
        <Liczba
          nazwa="minimumKwota"
          etykieta="Minimalne obciążenie"
          stan={stan}
          wartosc={w("minimumKwota")}
          jednostka="zł"
        />
      </div>

      <TakNie
        nazwa="wylacznosc"
        etykieta="Sala na wyłączność jednej imprezy w danym dniu"
        stan={stan}
        wartosc={w("wylacznosc")}
        wymagane
      />

      <Naglowek tekst="Jedzenie i alkohol" />

      <Lista
        nazwa="kuchnia"
        etykieta="Kuchnia"
        stan={stan}
        wartosc={w("kuchnia")}
        wymagane
        opcje={[
          ["wlasna", "Własna kuchnia"],
          ["obcy-catering", "Można wnieść obcy catering"],
          ["tylko-nasz", "Tylko nasz catering"],
        ]}
      />

      <div className="grid sm:grid-cols-2 gap-5">
        <Lista
          nazwa="alkohol"
          etykieta="Własny alkohol"
          stan={stan}
          wartosc={w("alkohol")}
          wymagane
          opcje={[
            ["nie", "Nie wolno"],
            ["tak-bez-oplaty", "Wolno, bez opłaty"],
            ["tak-z-korkowym", "Wolno, za korkowe"],
          ]}
        />
        <Liczba
          nazwa="korkowe"
          etykieta="Korkowe od butelki"
          stan={stan}
          wartosc={w("korkowe")}
          jednostka="zł"
          podpowiedz="Wypełnij tylko przy alkoholu za opłatą."
        />
      </div>

      <Naglowek tekst="Dojazd i nocleg" />

      <div className="grid sm:grid-cols-2 gap-5">
        <Lista
          nazwa="parking"
          etykieta="Parking"
          stan={stan}
          wartosc={w("parking")}
          wymagane
          opcje={[
            ["brak", "Brak"],
            ["bezplatny", "Bezpłatny przy obiekcie"],
            ["platny", "Płatny"],
            ["uliczny", "Tylko uliczny"],
          ]}
        />
        <Liczba
          nazwa="miejscParkingowych"
          etykieta="Miejsca parkingowe"
          stan={stan}
          wartosc={w("miejscParkingowych")}
        />
        <Lista
          nazwa="nocleg"
          etykieta="Nocleg"
          stan={stan}
          wartosc={w("nocleg")}
          wymagane
          opcje={[
            ["brak", "Brak"],
            ["na-miejscu", "Pokoje na miejscu"],
            ["w-poblizu", "W pobliżu"],
          ]}
        />
        <Liczba
          nazwa="pokoi"
          etykieta="Liczba pokoi"
          stan={stan}
          wartosc={w("pokoi")}
          podpowiedz="Wypełnij tylko przy noclegu na miejscu."
        />
      </div>

      <Naglowek tekst="Przebieg imprezy" />

      <Pole
        nazwa="muzykaDo"
        etykieta="Do której można grać"
        stan={stan}
        wymagane
        podpowiedz="Najczęstsze pytanie po cenie. Format 23:00."
      >
        <input
          id="sz-muzykaDo"
          name="muzykaDo"
          type="time"
          defaultValue={w("muzykaDo")}
          aria-invalid={maBlad(stan, "muzykaDo")}
          aria-describedby={maBlad(stan, "muzykaDo") ? idBledu("muzykaDo") : undefined}
          className={KLASA_POLA}
        />
      </Pole>

      <div className="grid sm:grid-cols-2 gap-5">
        <Lista
          nazwa="teren"
          etykieta="Teren zewnętrzny"
          stan={stan}
          wartosc={w("teren")}
          opcje={[
            ["brak", "Brak"],
            ["ogrod", "Ogród"],
            ["taras", "Taras"],
            ["plener", "Plener"],
          ]}
        />
        <Lista
          nazwa="dlaDzieci"
          etykieta="Dla dzieci"
          stan={stan}
          wartosc={w("dlaDzieci")}
          opcje={[
            ["brak", "Nic z tego"],
            ["kacik", "Kącik zabaw w środku"],
            ["plac-zabaw", "Plac zabaw na zewnątrz"],
          ]}
        />
      </div>

      <Naglowek tekst="Dostępność i wygoda" />

      <div className="grid sm:grid-cols-2 gap-5">
        <TakNie
          nazwa="wejscieBezSchodow"
          etykieta="Wejście bez schodów"
          stan={stan}
          wartosc={w("wejscieBezSchodow")}
        />
        <TakNie
          nazwa="toaletaPrzystosowana"
          etykieta="Toaleta przystosowana"
          stan={stan}
          wartosc={w("toaletaPrzystosowana")}
        />
        <TakNie nazwa="winda" etykieta="Winda" stan={stan} wartosc={w("winda")} />
        <TakNie
          nazwa="klimatyzacja"
          etykieta="Klimatyzacja"
          stan={stan}
          wartosc={w("klimatyzacja")}
        />
      </div>
    </>
  );
}

function PytaniaUslugodawcy({
  stan,
  w,
  wCenie,
}: {
  stan: StanFormularza;
  w: (pole: string) => string;
  wCenie: readonly string[];
}) {
  /*
   * Lista „co w cenie” żyje w stanie, bo da się do niej dokładać wiersze.
   * Jeden pusty wiersz na start, gdy firma nie wpisała jeszcze nic:
   * formularz bez ani jednego pola nie zaprasza do wpisania czegokolwiek.
   */
  const [pozycje, setPozycje] = useState<string[]>(wCenie.length > 0 ? [...wCenie] : [""]);

  return (
    <>
      <Naglowek tekst="Dojazd" />

      <div className="grid sm:grid-cols-2 gap-5">
        <Liczba
          nazwa="zasiegKm"
          etykieta="Zasięg dojazdu"
          stan={stan}
          wartosc={w("zasiegKm")}
          wymagane
          jednostka="km"
          podpowiedz="Od miejscowości, którą podałeś wcześniej."
        />
        <Lista
          nazwa="dojazd"
          etykieta="Rozliczenie dojazdu"
          stan={stan}
          wartosc={w("dojazd")}
          wymagane
          opcje={[
            ["w-cenie", "Zawsze w cenie"],
            ["w-cenie-do-limitu", "W cenie w granicach zasięgu"],
            ["platny", "Płatny za kilometr"],
          ]}
        />
        <Liczba
          nazwa="stawkaZaKm"
          etykieta="Stawka za kilometr"
          stan={stan}
          wartosc={w("stawkaZaKm")}
          jednostka="zł"
          podpowiedz="Wypełnij tylko przy dojeździe płatnym."
        />
      </div>

      <Naglowek tekst="Czas i cena" />

      <div className="grid sm:grid-cols-2 gap-5">
        <Liczba
          nazwa="godzinWPakiecie"
          etykieta="Godziny w cenie podstawowej"
          stan={stan}
          wartosc={w("godzinWPakiecie")}
          jednostka="godz."
          podpowiedz="Zostaw puste, jeśli nie rozliczasz się czasem."
        />
        <Liczba
          nazwa="cenaNadgodziny"
          etykieta="Godzina ponad pakiet"
          stan={stan}
          wartosc={w("cenaNadgodziny")}
          jednostka="zł"
        />
      </div>

      <Naglowek tekst="Co jest w cenie" />

      <div className="flex flex-col gap-2">
        <p className="m-0 text-[14px] font-semibold text-[#3E3344]">
          Pozycje wchodzące w cenę podstawową
          <Wymagane />
        </p>
        <p className="m-0 text-[13px] text-[#6A5C70]">
          Po jednej w wierszu: nagłośnienie, oświetlenie, obsługa, materiały. To jest druga rzecz, o
          którą pytają klienci po cenie.
        </p>

        {pozycje.map((pozycja, i) => (
          <input
            // biome-ignore lint/suspicious/noArrayIndexKey: pozycje nie mają własnego identyfikatora, dopóki nie trafią do bazy, a kolejność jest tu jedyną tożsamością wiersza
            key={i}
            name="wCenie"
            type="text"
            defaultValue={pozycja}
            maxLength={80}
            placeholder={i === 0 ? "np. nagłośnienie i oświetlenie" : ""}
            className={KLASA_POLA}
          />
        ))}

        <BladPola stan={stan} pole="wCenie" />

        {pozycje.length < MAKS_POZYCJI_W_CENIE ? (
          <div>
            <button
              type="button"
              onClick={() => setPozycje([...pozycje, ""])}
              className="text-[14px] font-semibold text-[#8A5405] underline bg-transparent border-0 p-0 cursor-pointer"
            >
              Dodaj kolejną pozycję
            </button>
          </div>
        ) : null}
      </div>

      <Naglowek tekst="Zaliczka i terminy" />

      <div className="grid sm:grid-cols-2 gap-5">
        <Lista
          nazwa="rodzajZaliczki"
          etykieta="Zaliczka"
          stan={stan}
          wartosc={w("rodzajZaliczki")}
          wymagane
          opcje={[
            ["procent", "Procent ceny"],
            ["kwota", "Stała kwota"],
          ]}
        />
        <Liczba
          nazwa="wartoscZaliczki"
          etykieta="Wysokość zaliczki"
          stan={stan}
          wartosc={w("wartoscZaliczki")}
          wymagane
          podpowiedz="Procent albo złotówki, zależnie od wyboru obok."
        />
        <Liczba
          nazwa="zaliczkaWDni"
          etykieta="Termin wpłaty"
          stan={stan}
          wartosc={w("zaliczkaWDni")}
          jednostka="dni od rezerwacji"
        />
      </div>

      <Pole
        nazwa="zwrotZaliczki"
        etykieta="Czy zaliczka jest zwrotna"
        stan={stan}
        podpowiedz="Jedno zdanie. Na przykład: zwracamy do 60 dni przed terminem."
      >
        <input
          id="sz-zwrotZaliczki"
          name="zwrotZaliczki"
          type="text"
          maxLength={300}
          defaultValue={w("zwrotZaliczki")}
          className={KLASA_POLA}
        />
      </Pole>

      <div className="grid sm:grid-cols-2 gap-5">
        <Liczba
          nazwa="rezerwacjeNaMiesiecy"
          etykieta="Przyjmuję rezerwacje na"
          stan={stan}
          wartosc={w("rezerwacjeNaMiesiecy")}
          jednostka="miesięcy w przód"
        />
        <Liczba
          nazwa="wydarzenDziennie"
          etykieta="Wydarzeń dziennie"
          stan={stan}
          wartosc={w("wydarzenDziennie")}
        />
        <Liczba
          nazwa="materialPoTygodniach"
          etykieta="Gotowy materiał po"
          stan={stan}
          wartosc={w("materialPoTygodniach")}
          jednostka="tygodniach"
          podpowiedz="Dla fotografów i filmowców. Zostaw puste, jeśli nic nie oddajesz."
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <TakNie
          nazwa="zastepstwo"
          etykieta="Zapewniam zastępstwo w razie choroby"
          stan={stan}
          wartosc={w("zastepstwo")}
        />
        <TakNie
          nazwa="fakturaVat"
          etykieta="Wystawiam fakturę VAT"
          stan={stan}
          wartosc={w("fakturaVat")}
          wymagane
        />
      </div>
    </>
  );
}

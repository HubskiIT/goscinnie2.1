"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { BladPola, idBledu, maBlad } from "@/components/BladPola";
import { KomunikatFormularza } from "@/components/KomunikatFormularza";
import { PoleMiejscowosci } from "@/components/PoleMiejscowosci";
import { dataDluga } from "@/content/format";
import { pobierzKategorie } from "@/content/kategorie";
import { OKAZJA_INNA, OKAZJE } from "@/content/okazje";
import { pobierzRodzajeLokali } from "@/content/rodzaje-lokali";
import {
  dodajImprezeModeratora,
  dodajOgloszenieModeratora,
  dodajZdjecieModeratoraAkcja,
  dodajZlecenieModeratora,
  edytujFirme,
  rozstrzygnijPrzejecieAkcja,
  rozstrzygnijZgloszenie,
  zmienStatusFirmy,
} from "@/lib/akcje/moderacja";
import { dodajWolnyTermin } from "@/lib/akcje/profil";
import type {
  FirmaDlaModeratora,
  PozycjaKolejki,
  RodzajPrzedmiotu,
  StatystykiModeracji,
  WniosekPrzejeciaDlaModeratora,
} from "@/lib/db/queries/moderacja";
import { STAN_POCZATKOWY, wartoscPola } from "@/lib/formularze";
import { MAKS_ZNAKOW_POWODU } from "@/lib/validators/moderacja";

interface ModeracjaScreenProps {
  pozycje: readonly PozycjaKolejki[];
  statystyki: StatystykiModeracji;
  firmy: readonly FirmaDlaModeratora[];
  przejecia: readonly WniosekPrzejeciaDlaModeratora[];
}

type Zakladka = "kolejka" | "firmy" | "przejecia" | "dodaj-ogloszenie" | "imprezy-zlecenia";

const NAZWA_RODZAJU: Record<RodzajPrzedmiotu, string> = {
  company: "Nowa firma",
  company_change: "Zmiana w firmie",
  event: "Impreza",
  request: "Zlecenie",
};

const ETYKIETA_STATUSU: Record<FirmaDlaModeratora["status"], string> = {
  active: "Aktywna",
  draft: "Szkic",
  visitcard: "Wizytówka",
  suspended: "Zawieszona",
};

const KLASA_POLA =
  "text-[15px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] px-3.5 py-2.5 w-full box-border";
const KLASA_ETYKIETY = "block text-[13px] font-semibold text-[#3E3344] mb-1";

export function ModeracjaScreen({ pozycje, statystyki, firmy, przejecia }: ModeracjaScreenProps) {
  const [zakladka, setZakladka] = useState<Zakladka>("kolejka");

  const [stanDecyzji, akcjaDecyzji, czekaDecyzja] = useActionState(
    rozstrzygnijZgloszenie,
    STAN_POCZATKOWY,
  );
  const [stanStatusu, akcjaStatusu, czekaStatus] = useActionState(
    zmienStatusFirmy,
    STAN_POCZATKOWY,
  );
  const [stanOgloszenia, akcjaOgloszenia, czekaOgloszenie] = useActionState(
    dodajOgloszenieModeratora,
    STAN_POCZATKOWY,
  );
  const [stanImprezy, akcjaImprezy, czekaImpreza] = useActionState(
    dodajImprezeModeratora,
    STAN_POCZATKOWY,
  );
  const [stanZlecenia, akcjaZlecenia, czekaZlecenie] = useActionState(
    dodajZlecenieModeratora,
    STAN_POCZATKOWY,
  );
  const [stanEdycji, akcjaEdycji, czekaEdycja] = useActionState(edytujFirme, STAN_POCZATKOWY);
  const [stanZdjecia, akcjaZdjecia, czekaZdjecie] = useActionState(
    dodajZdjecieModeratoraAkcja,
    STAN_POCZATKOWY,
  );
  const [stanPrzejecia, akcjaPrzejecia, czekaPrzejecie] = useActionState(
    rozstrzygnijPrzejecieAkcja,
    STAN_POCZATKOWY,
  );
  const [stanTerminu, akcjaTerminu, czekaTermin] = useActionState(
    dodajWolnyTermin,
    STAN_POCZATKOWY,
  );

  const [odsylany, setOdsylany] = useState<string | null>(null);
  const [edytowanaFirmaId, setEdytowanaFirmaId] = useState<string | null>(null);
  const [szukajFirmy, setSzukajFirmy] = useState("");
  const [filtrStatusu, setFiltrStatusu] = useState<string>("wszystkie");
  const [okazjaImprezy, setOkazjaImprezy] = useState<string>(OKAZJE[0]?.slug ?? "sylwester");
  const [okazjaZlecenia, setOkazjaZlecenia] = useState<string>(OKAZJE[0]?.slug ?? "wesele");

  const rodzajeLokali = useMemo(() => pobierzRodzajeLokali(), []);
  const kategorieUslug = useMemo(() => pobierzKategorie(), []);
  const lokaleDoImprez = useMemo(() => firmy.filter((f) => f.rodzaj === "venue"), [firmy]);

  const przefiltrowaneFirmy = useMemo(() => {
    const fraza = szukajFirmy.trim().toLowerCase();
    return firmy.filter((f) => {
      if (filtrStatusu !== "wszystkie" && f.status !== filtrStatusu) return false;
      if (
        fraza &&
        !f.nazwa.toLowerCase().includes(fraza) &&
        !f.miejscowosc.toLowerCase().includes(fraza) &&
        !f.wlascicielEmail.toLowerCase().includes(fraza)
      ) {
        return false;
      }
      return true;
    });
  }, [firmy, filtrStatusu, szukajFirmy]);

  return (
    <div className="w-full max-w-[1160px] mx-auto bg-[#FBF7F4] text-[#241C2B] flex flex-col min-h-screen">
      <section className="px-6 sm:px-12 pt-10 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="m-0 mb-2 font-fraunces font-normal text-[34px] sm:text-[42px] tracking-tight">
              Centrum moderacji
            </h1>
            <p className="m-0 text-[16px] leading-[1.6] text-[#3E3344] max-w-[68ch]">
              Pełne zarządzanie kolejką, katalogiem firm oraz bezpośrednie dodawanie ogłoszeń,
              imprez i zleceń.
            </p>
          </div>
          <Link
            href="/rejestracja-firmy?nowa=1"
            className="text-[14px] font-semibold text-[#241C2B] bg-white border border-[#D9CCC2] hover:bg-[#F2E9E2] rounded-[12px] px-4 py-2.5 transition-colors"
          >
            Otwórz pełny kreator firmy
          </Link>
        </div>

        {/* Pasek statystyk */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          <KartaStatystyki etykieta="Do decyzji" wartosc={statystyki.doDecyzji} wyrozniona />
          <KartaStatystyki etykieta="Aktywne firmy" wartosc={statystyki.aktywneFirmy} />
          <KartaStatystyki etykieta="Szkice" wartosc={statystyki.szkiceFirm} />
          <KartaStatystyki etykieta="Zawieszone" wartosc={statystyki.zawieszoneFirmy} />
          <KartaStatystyki etykieta="Zlecenia" wartosc={statystyki.zleceniaOtwarte} />
          <KartaStatystyki etykieta="Imprezy" wartosc={statystyki.imprezy} />
          <KartaStatystyki etykieta="Użytkownicy" wartosc={statystyki.uzytkownicy} />
        </div>

        {/* Zakładki */}
        <div className="flex flex-wrap gap-2 border-b border-[#E2D5CA] pb-3 mb-6">
          <PrzyciskZakladki
            aktywna={zakladka === "kolejka"}
            onClick={() => setZakladka("kolejka")}
            etykieta={`Kolejka do decyzji (${pozycje.length})`}
          />
          <PrzyciskZakladki
            aktywna={zakladka === "firmy"}
            onClick={() => setZakladka("firmy")}
            etykieta={`Katalog firm (${firmy.length})`}
          />
          <PrzyciskZakladki
            aktywna={zakladka === "przejecia"}
            onClick={() => setZakladka("przejecia")}
            etykieta={`Przejęcia (${przejecia.length})`}
          />
          <PrzyciskZakladki
            aktywna={zakladka === "dodaj-ogloszenie"}
            onClick={() => setZakladka("dodaj-ogloszenie")}
            etykieta="+ Dodaj ogłoszenie"
          />
          <PrzyciskZakladki
            aktywna={zakladka === "imprezy-zlecenia"}
            onClick={() => setZakladka("imprezy-zlecenia")}
            etykieta="+ Dodaj imprezę / zlecenie"
          />
        </div>

        {/* ZAKŁADKA 1: KOLEJKA */}
        {zakladka === "kolejka" && (
          <div>
            <KomunikatFormularza stan={stanDecyzji} />

            {pozycje.length === 0 ? (
              <p className="m-0 mt-6 rounded-[18px] border border-dashed border-[#D9CCC2] bg-white p-8 text-center text-[15px] leading-[1.7] text-[#6A5C70]">
                Kolejka jest pusta. Nic nie czeka na decyzję.
              </p>
            ) : (
              <ul className="m-0 mt-6 list-none p-0 flex flex-col gap-4">
                {pozycje.map((pozycja) => (
                  <li
                    key={pozycja.id}
                    className="border border-[#E2D5CA] rounded-[18px] bg-white p-6 shadow-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-[12px] uppercase tracking-wider font-bold text-[#6A5C70] mb-1">
                          {NAZWA_RODZAJU[pozycja.rodzaj]}
                        </div>
                        <div className="font-fraunces text-[22px] font-medium">
                          {pozycja.nazwa ?? pozycja.przedmiotId}
                        </div>
                        {pozycja.szczegoly && (
                          <p className="m-0 mt-1.5 text-[14px] text-[#3E3344] max-w-[70ch]">
                            {pozycja.szczegoly}
                          </p>
                        )}
                        <div className="text-[13px] text-[#6A5C70] mt-1">
                          czeka od {dataDluga(pozycja.zgloszoneO.toISOString().slice(0, 10))}
                        </div>
                      </div>

                      {pozycja.adresPodgladu !== null && (
                        <Link
                          href={pozycja.adresPodgladu}
                          className="shrink-0 text-[14px] font-semibold text-[#8A5405] underline"
                        >
                          Zobacz wpis
                        </Link>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <form action={akcjaDecyzji}>
                        <input type="hidden" name="zgloszenieId" value={pozycja.id} />
                        <input type="hidden" name="decyzja" value="zgoda" />
                        <button
                          type="submit"
                          disabled={czekaDecyzja}
                          className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] disabled:opacity-60 transition-colors border-0 rounded-[12px] px-6 py-3 cursor-pointer shadow-2xs"
                        >
                          Przyjmij do katalogu
                        </button>
                      </form>

                      <button
                        type="button"
                        onClick={() => setOdsylany(odsylany === pozycja.id ? null : pozycja.id)}
                        className="text-[15px] font-semibold text-[#241C2B] bg-white border border-[#241C2B] hover:bg-[#241C2B] hover:text-white transition-colors rounded-[12px] px-6 py-3 cursor-pointer"
                      >
                        {odsylany === pozycja.id ? "Nie odsyłaj" : "Odeślij do poprawki"}
                      </button>
                    </div>

                    {odsylany === pozycja.id && (
                      <form action={akcjaDecyzji} className="mt-5 flex flex-col gap-2">
                        <input type="hidden" name="zgloszenieId" value={pozycja.id} />
                        <input type="hidden" name="decyzja" value="odmowa" />

                        <label
                          htmlFor={`powod-${pozycja.id}`}
                          className="text-[14px] font-semibold text-[#3E3344]"
                        >
                          Co właściciel ma poprawić
                        </label>
                        <textarea
                          id={`powod-${pozycja.id}`}
                          name="powod"
                          required
                          rows={4}
                          maxLength={MAKS_ZNAKOW_POWODU}
                          placeholder="Napisz konkretnie, czego brakuje albo co łamie zasady."
                          aria-invalid={maBlad(stanDecyzji, "powod")}
                          aria-describedby={
                            maBlad(stanDecyzji, "powod") ? idBledu("powod") : undefined
                          }
                          className="w-full border border-[#D9CCC2] rounded-[12px] bg-white px-4 py-3 text-[15px] leading-[1.6] text-[#241C2B]"
                        />
                        <BladPola stan={stanDecyzji} pole="powod" />

                        <div>
                          <button
                            type="submit"
                            disabled={czekaDecyzja}
                            className="text-[15px] font-bold text-white bg-[#8A3B1E] hover:bg-[#75311a] disabled:opacity-60 transition-colors border-0 rounded-[12px] px-6 py-3 cursor-pointer"
                          >
                            Odeślij z tym komentarzem
                          </button>
                        </div>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ZAKŁADKA 2: KATALOG FIRM */}
        {zakladka === "firmy" && (
          <div>
            <KomunikatFormularza stan={stanStatusu} />
            <KomunikatFormularza stan={stanEdycji} />
            <KomunikatFormularza stan={stanZdjecia} />
            <KomunikatFormularza stan={stanTerminu} />

            <div className="mt-4 flex flex-wrap gap-3 items-center">
              <input
                type="search"
                value={szukajFirmy}
                onChange={(e) => setSzukajFirmy(e.target.value)}
                placeholder="Szukaj po nazwie, mieście lub e-mailu..."
                className="text-[15px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] px-3.5 py-2.5 min-w-[260px] grow max-w-[420px]"
              />
              <select
                value={filtrStatusu}
                onChange={(e) => setFiltrStatusu(e.target.value)}
                className="text-[15px] text-[#241C2B] bg-white border-[1.5px] border-[#D9CCC2] rounded-[10px] px-3.5 py-2.5"
              >
                <option value="wszystkie">Wszystkie statusy</option>
                <option value="active">Aktywne</option>
                <option value="draft">Szkice</option>
                <option value="visitcard">Wizytówki</option>
                <option value="suspended">Zawieszone</option>
              </select>
            </div>

            {przefiltrowaneFirmy.length === 0 ? (
              <p className="m-0 mt-6 rounded-[18px] border border-dashed border-[#D9CCC2] bg-white p-8 text-center text-[15px] text-[#6A5C70]">
                Brak firm spełniających kryteria.
              </p>
            ) : (
              <ul className="m-0 mt-6 list-none p-0 flex flex-col gap-3">
                {przefiltrowaneFirmy.map((firma) => (
                  <li
                    key={firma.id}
                    className="border border-[#E2D5CA] rounded-[16px] bg-white p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-fraunces text-[20px] font-medium">
                            {firma.nazwa || "(szkic bez nazwy)"}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-[#F2E9E2] text-[#3E3344]">
                            {ETYKIETA_STATUSU[firma.status]}
                          </span>
                          {firma.zaakceptowana ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-[#E7EDE7] text-[#3F5142]">
                              W katalogu
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-[#FEF4E4] text-[#8A5405]">
                              Niezaakceptowana
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#FBF7F4] border border-[#E2D5CA] text-[#6A5C70]">
                            Zdjęcia: {firma.liczbaZdjec}
                          </span>
                        </div>
                        <div className="text-[13px] text-[#6A5C70]">
                          {firma.kategoria ?? "Brak kategorii"} • {firma.miejscowosc} • właściciel:{" "}
                          {firma.wlascicielEmail}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/f/${firma.slug}`}
                          className="text-[13px] font-semibold text-[#8A5405] underline px-2 py-1"
                        >
                          Zobacz profil
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            setEdytowanaFirmaId(edytowanaFirmaId === firma.id ? null : firma.id)
                          }
                          className="text-[13px] font-semibold text-[#241C2B] bg-white border border-[#D9CCC2] hover:bg-[#F2E9E2] rounded-[10px] px-3 py-2 cursor-pointer transition-colors"
                        >
                          {edytowanaFirmaId === firma.id ? "Zamknij edycję" : "Edytuj / Zdjęcia"}
                        </button>

                        {(!firma.zaakceptowana || firma.status === "draft") && (
                          <form action={akcjaStatusu}>
                            <input type="hidden" name="companyId" value={firma.id} />
                            <input type="hidden" name="akcja" value="zatwierdz" />
                            <button
                              type="submit"
                              disabled={czekaStatus}
                              className="text-[13px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] disabled:opacity-60 border-0 rounded-[10px] px-3.5 py-2 cursor-pointer"
                            >
                              Zatwierdź i opublikuj
                            </button>
                          </form>
                        )}

                        {firma.status !== "suspended" ? (
                          <form action={akcjaStatusu}>
                            <input type="hidden" name="companyId" value={firma.id} />
                            <input type="hidden" name="akcja" value="zawies" />
                            <button
                              type="submit"
                              disabled={czekaStatus}
                              className="text-[13px] font-semibold text-[#8A3B1E] bg-white border border-[#8A3B1E] hover:bg-[#8A3B1E] hover:text-white disabled:opacity-60 rounded-[10px] px-3.5 py-2 cursor-pointer transition-colors"
                            >
                              Zawieś
                            </button>
                          </form>
                        ) : (
                          <form action={akcjaStatusu}>
                            <input type="hidden" name="companyId" value={firma.id} />
                            <input type="hidden" name="akcja" value="przywroc" />
                            <button
                              type="submit"
                              disabled={czekaStatus}
                              className="text-[13px] font-semibold text-[#3F5142] bg-[#E7EDE7] hover:bg-[#d5e2d7] disabled:opacity-60 border-0 rounded-[10px] px-3.5 py-2 cursor-pointer"
                            >
                              Przywróć
                            </button>
                          </form>
                        )}
                      </div>
                    </div>

                    {edytowanaFirmaId === firma.id && (
                      <div className="mt-5 pt-5 border-t border-[#EFE5DD] grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <form action={akcjaEdycji} className="flex flex-col gap-3">
                          <input type="hidden" name="companyId" value={firma.id} />
                          <div className="text-[14px] font-bold text-[#241C2B]">
                            Edycja danych wpisu
                          </div>
                          <div>
                            <label htmlFor={`ed-nazwa-${firma.id}`} className={KLASA_ETYKIETY}>
                              Nazwa
                            </label>
                            <input
                              id={`ed-nazwa-${firma.id}`}
                              name="nazwa"
                              required
                              defaultValue={firma.nazwa}
                              className={KLASA_POLA}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label htmlFor={`ed-cena-${firma.id}`} className={KLASA_ETYKIETY}>
                                Cena od (zł)
                              </label>
                              <input
                                id={`ed-cena-${firma.id}`}
                                name="cenaOd"
                                type="number"
                                min="0"
                                defaultValue={
                                  firma.cenaOd !== null ? Math.round(firma.cenaOd / 100) : ""
                                }
                                className={KLASA_POLA}
                              />
                            </div>
                            <div>
                              <label htmlFor={`ed-pmin-${firma.id}`} className={KLASA_ETYKIETY}>
                                Poj. min
                              </label>
                              <input
                                id={`ed-pmin-${firma.id}`}
                                name="pojemnoscMin"
                                type="number"
                                min="1"
                                defaultValue={firma.pojemnoscMin ?? ""}
                                className={KLASA_POLA}
                              />
                            </div>
                            <div>
                              <label htmlFor={`ed-pmax-${firma.id}`} className={KLASA_ETYKIETY}>
                                Poj. max
                              </label>
                              <input
                                id={`ed-pmax-${firma.id}`}
                                name="pojemnoscMax"
                                type="number"
                                min="1"
                                defaultValue={firma.pojemnoscMax ?? ""}
                                className={KLASA_POLA}
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor={`ed-opis-${firma.id}`} className={KLASA_ETYKIETY}>
                              Opis
                            </label>
                            <textarea
                              id={`ed-opis-${firma.id}`}
                              name="opis"
                              required
                              rows={3}
                              defaultValue={firma.opis}
                              className={KLASA_POLA}
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={czekaEdycja}
                            className="text-[14px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] disabled:opacity-60 border-0 rounded-[10px] px-4 py-2.5 cursor-pointer self-start"
                          >
                            {czekaEdycja ? "Zapisywanie..." : "Zapisz zmiany"}
                          </button>
                        </form>

                        <form action={akcjaZdjecia} className="flex flex-col gap-3">
                          <input type="hidden" name="companyId" value={firma.id} />
                          <div className="text-[14px] font-bold text-[#241C2B]">
                            Dodaj zdjęcie do galerii (aktualnie: {firma.liczbaZdjec}/10)
                          </div>
                          <input
                            name="zdjecie"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/heic"
                            required
                            className="text-[14px] text-[#3E3344] border border-dashed border-[#D9CCC2] rounded-[10px] p-4 bg-[#FBF7F4]"
                          />
                          <button
                            type="submit"
                            disabled={czekaZdjecie}
                            className="text-[14px] font-semibold text-white bg-[#241C2B] hover:bg-[#3E3344] disabled:opacity-60 border-0 rounded-[10px] px-4 py-2.5 cursor-pointer self-start"
                          >
                            {czekaZdjecie ? "Wysyłanie..." : "Wgraj zdjęcie"}
                          </button>
                        </form>

                        <form
                          action={akcjaTerminu}
                          className="flex flex-wrap items-end gap-3 lg:col-span-2 pt-3 border-t border-[#EFE5DD]"
                        >
                          <input type="hidden" name="companyId" value={firma.id} />
                          <div>
                            <label htmlFor={`term-${firma.id}`} className={KLASA_ETYKIETY}>
                              Dodaj wolny termin do kalendarza
                            </label>
                            <input
                              id={`term-${firma.id}`}
                              name="data"
                              type="date"
                              required
                              className={KLASA_POLA}
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={czekaTermin}
                            className="text-[14px] font-semibold text-[#3F5142] bg-[#E7EDE7] hover:bg-[#d5e2d7] disabled:opacity-60 border-0 rounded-[10px] px-4 py-2.5 cursor-pointer"
                          >
                            {czekaTermin ? "Dodawanie..." : "Dodaj wolny termin"}
                          </button>
                        </form>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ZAKŁADKA: PRZEJĘCIA */}
        {zakladka === "przejecia" && (
          <div>
            <KomunikatFormularza stan={stanPrzejecia} />
            {przejecia.length === 0 ? (
              <p className="m-0 mt-6 rounded-[18px] border border-dashed border-[#D9CCC2] bg-white p-8 text-center text-[15px] text-[#6A5C70]">
                Brak oczekujących wniosków o przejęcie profili.
              </p>
            ) : (
              <ul className="m-0 mt-6 list-none p-0 flex flex-col gap-4">
                {przejecia.map((p) => (
                  <li key={p.id} className="border border-[#E2D5CA] rounded-[18px] bg-white p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                      <Link
                        href={`/f/${p.slugFirmy}`}
                        className="font-fraunces text-[22px] text-[#241C2B]"
                      >
                        {p.nazwaFirmy}
                      </Link>
                      <span className="text-[13px] text-[#6A5C70]">
                        Wnioskuje: {p.wnioskujacyEmail}
                      </span>
                    </div>
                    <p className="m-0 mb-4 text-[14px] text-[#3E3344] bg-[#FBF7F4] rounded-[10px] p-3.5">
                      {p.uzasadnienie}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <form action={akcjaPrzejecia}>
                        <input type="hidden" name="wniosekId" value={p.id} />
                        <input type="hidden" name="decyzja" value="zatwierdz" />
                        <button
                          type="submit"
                          disabled={czekaPrzejecie}
                          className="text-[14px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] disabled:opacity-60 border-0 rounded-[10px] px-5 py-2.5 cursor-pointer"
                        >
                          Zatwierdź i przekaż profil
                        </button>
                      </form>
                      <form action={akcjaPrzejecia}>
                        <input type="hidden" name="wniosekId" value={p.id} />
                        <input type="hidden" name="decyzja" value="odrzuc" />
                        <button
                          type="submit"
                          disabled={czekaPrzejecie}
                          className="text-[14px] font-semibold text-[#8A3B1E] bg-white border border-[#8A3B1E] hover:bg-[#8A3B1E] hover:text-white disabled:opacity-60 rounded-[10px] px-5 py-2.5 cursor-pointer"
                        >
                          Odrzuć
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ZAKŁADKA 3: DODAJ OGŁOSZENIE */}
        {zakladka === "dodaj-ogloszenie" && (
          <div className="max-w-[760px] border border-[#E2D5CA] rounded-[18px] bg-white p-6 sm:p-8">
            <h2 className="m-0 mb-2 font-fraunces font-medium text-[26px]">
              Dodaj ogłoszenie bezpośrednio do katalogu
            </h2>
            <p className="m-0 mb-6 text-[15px] text-[#6A5C70]">
              Jako moderator możesz dodać lokal lub usługodawcę z pominięciem kolejki i wymogu NIP.
            </p>

            <KomunikatFormularza stan={stanOgloszenia} />

            <form action={akcjaOgloszenia} className="mt-4 flex flex-col gap-4">
              <div>
                <label htmlFor="mod-kategoria" className={KLASA_ETYKIETY}>
                  Kategoria
                </label>
                <select
                  id="mod-kategoria"
                  name="kategoria"
                  defaultValue={wartoscPola(stanOgloszenia, "kategoria") || "sala-weselna"}
                  className={KLASA_POLA}
                >
                  <optgroup label="Lokale">
                    {rodzajeLokali.map((r) => (
                      <option key={r.slug} value={r.slug}>
                        {r.nazwa}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Usługodawcy">
                    {kategorieUslug.map((k) => (
                      <option key={k.slug} value={k.slug}>
                        {k.nazwa}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <BladPola stan={stanOgloszenia} pole="kategoria" />
              </div>

              <div>
                <label htmlFor="mod-nazwa" className={KLASA_ETYKIETY}>
                  Nazwa firmy / lokalu
                </label>
                <input
                  id="mod-nazwa"
                  name="nazwa"
                  required
                  defaultValue={wartoscPola(stanOgloszenia, "nazwa")}
                  placeholder="np. Dwór Pod Lipami"
                  className={KLASA_POLA}
                />
                <BladPola stan={stanOgloszenia} pole="nazwa" />
              </div>

              <div>
                <PoleMiejscowosci
                  nazwaPola="miejscowosc"
                  nazwaPolaId="cityId"
                  wartoscPoczatkowa={wartoscPola(stanOgloszenia, "miejscowosc")}
                  idPoczatkowe={wartoscPola(stanOgloszenia, "cityId")}
                  klasaEtykiety={KLASA_ETYKIETY}
                  klasaPola={KLASA_POLA}
                />
                <BladPola stan={stanOgloszenia} pole="cityId" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="mod-cena" className={KLASA_ETYKIETY}>
                    Cena od (zł)
                  </label>
                  <input
                    id="mod-cena"
                    name="cenaOd"
                    type="number"
                    min="0"
                    defaultValue={wartoscPola(stanOgloszenia, "cenaOd")}
                    placeholder="np. 250"
                    className={KLASA_POLA}
                  />
                  <BladPola stan={stanOgloszenia} pole="cenaOd" />
                </div>
                <div>
                  <label htmlFor="mod-poj-min" className={KLASA_ETYKIETY}>
                    Pojemność min
                  </label>
                  <input
                    id="mod-poj-min"
                    name="pojemnoscMin"
                    type="number"
                    min="1"
                    defaultValue={wartoscPola(stanOgloszenia, "pojemnoscMin")}
                    placeholder="np. 20"
                    className={KLASA_POLA}
                  />
                  <BladPola stan={stanOgloszenia} pole="pojemnoscMin" />
                </div>
                <div>
                  <label htmlFor="mod-poj-max" className={KLASA_ETYKIETY}>
                    Pojemność max
                  </label>
                  <input
                    id="mod-poj-max"
                    name="pojemnoscMax"
                    type="number"
                    min="1"
                    defaultValue={wartoscPola(stanOgloszenia, "pojemnoscMax")}
                    placeholder="np. 150"
                    className={KLASA_POLA}
                  />
                  <BladPola stan={stanOgloszenia} pole="pojemnoscMax" />
                </div>
              </div>

              <div>
                <label htmlFor="mod-opis" className={KLASA_ETYKIETY}>
                  Opis ogłoszenia (min. 20 znaków)
                </label>
                <textarea
                  id="mod-opis"
                  name="opis"
                  required
                  rows={5}
                  defaultValue={wartoscPola(stanOgloszenia, "opis")}
                  placeholder="Opisz ofertę, atuty miejsca, dojazd, styl przyjęć..."
                  className={KLASA_POLA}
                />
                <BladPola stan={stanOgloszenia} pole="opis" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="mod-nip" className={KLASA_ETYKIETY}>
                    NIP (opcjonalnie)
                  </label>
                  <input
                    id="mod-nip"
                    name="nip"
                    defaultValue={wartoscPola(stanOgloszenia, "nip")}
                    placeholder="10 cyfr"
                    className={KLASA_POLA}
                  />
                  <BladPola stan={stanOgloszenia} pole="nip" />
                </div>
                <div>
                  <label htmlFor="mod-tel" className={KLASA_ETYKIETY}>
                    Telefon (opcjonalnie)
                  </label>
                  <input
                    id="mod-tel"
                    name="telefon"
                    defaultValue={wartoscPola(stanOgloszenia, "telefon")}
                    placeholder="9 cyfr"
                    className={KLASA_POLA}
                  />
                  <BladPola stan={stanOgloszenia} pole="telefon" />
                </div>
                <div>
                  <label htmlFor="mod-wlasciciel" className={KLASA_ETYKIETY}>
                    E-mail właściciela (opcjonalnie)
                  </label>
                  <input
                    id="mod-wlasciciel"
                    name="wlascicielEmail"
                    type="email"
                    defaultValue={wartoscPola(stanOgloszenia, "wlascicielEmail")}
                    placeholder="puste = Twoje konto"
                    className={KLASA_POLA}
                  />
                  <BladPola stan={stanOgloszenia} pole="wlascicielEmail" />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-[15px] text-[#241C2B] cursor-pointer">
                <input
                  type="checkbox"
                  name="opublikujOdRazu"
                  defaultChecked
                  className="w-4 h-4 accent-[#F0A62E]"
                />
                <span>Opublikuj i zatwierdź od razu w katalogu</span>
              </label>

              <div>
                <button
                  type="submit"
                  disabled={czekaOgloszenie}
                  className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] disabled:opacity-60 border-0 rounded-[12px] px-6 py-3 cursor-pointer"
                >
                  {czekaOgloszenie ? "Zapisywanie..." : "Dodaj ogłoszenie"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ZAKŁADKA 4: IMPREZY I ZLECENIA */}
        {zakladka === "imprezy-zlecenia" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formularz imprezy */}
            <div className="border border-[#E2D5CA] rounded-[18px] bg-white p-6">
              <h2 className="m-0 mb-2 font-fraunces font-medium text-[24px]">
                Dodaj imprezę w lokalu
              </h2>
              <p className="m-0 mb-4 text-[14px] text-[#6A5C70]">
                Impreza zostanie od razu zatwierdzona i pojawi się w zapowiedziach.
              </p>

              <KomunikatFormularza stan={stanImprezy} />

              {lokaleDoImprez.length === 0 ? (
                <p className="m-0 mt-4 text-[14px] text-[#6A5C70]">
                  Najpierw dodaj przynajmniej jeden lokal w zakładce „+ Dodaj ogłoszenie”.
                </p>
              ) : (
                <form action={akcjaImprezy} className="mt-4 flex flex-col gap-3.5">
                  <div>
                    <label htmlFor="imp-lokal" className={KLASA_ETYKIETY}>
                      Lokal
                    </label>
                    <select id="imp-lokal" name="companyId" className={KLASA_POLA}>
                      {lokaleDoImprez.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nazwa || l.slug} ({l.miejscowosc})
                        </option>
                      ))}
                    </select>
                    <BladPola stan={stanImprezy} pole="companyId" />
                  </div>

                  <div>
                    <label htmlFor="imp-nazwa" className={KLASA_ETYKIETY}>
                      Nazwa imprezy
                    </label>
                    <input
                      id="imp-nazwa"
                      name="nazwa"
                      required
                      placeholder="np. Bal Sylwestrowy 2026"
                      className={KLASA_POLA}
                    />
                    <BladPola stan={stanImprezy} pole="nazwa" />
                  </div>

                  <div>
                    <label htmlFor="imp-okazja" className={KLASA_ETYKIETY}>
                      Okazja
                    </label>
                    <select
                      id="imp-okazja"
                      name="okazja"
                      value={okazjaImprezy}
                      onChange={(e) => setOkazjaImprezy(e.target.value)}
                      className={KLASA_POLA}
                    >
                      {OKAZJE.map((o) => (
                        <option key={o.slug} value={o.slug}>
                          {o.nazwa}
                        </option>
                      ))}
                    </select>
                  </div>

                  {okazjaImprezy === OKAZJA_INNA.slug && (
                    <div>
                      <label htmlFor="imp-inna" className={KLASA_ETYKIETY}>
                        Własna nazwa okazji
                      </label>
                      <input id="imp-inna" name="innaOkazja" required className={KLASA_POLA} />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="imp-data" className={KLASA_ETYKIETY}>
                        Data
                      </label>
                      <input
                        id="imp-data"
                        name="data"
                        type="date"
                        required
                        className={KLASA_POLA}
                      />
                    </div>
                    <div>
                      <label htmlFor="imp-od" className={KLASA_ETYKIETY}>
                        Od
                      </label>
                      <input
                        id="imp-od"
                        name="godzinaOd"
                        defaultValue="20:00"
                        required
                        className={KLASA_POLA}
                      />
                    </div>
                    <div>
                      <label htmlFor="imp-do" className={KLASA_ETYKIETY}>
                        Do (opcj.)
                      </label>
                      <input
                        id="imp-do"
                        name="godzinaDo"
                        placeholder="04:00"
                        className={KLASA_POLA}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="imp-cena" className={KLASA_ETYKIETY}>
                      Cena biletu w zł (puste = wstęp wolny)
                    </label>
                    <input
                      id="imp-cena"
                      name="cenaBiletu"
                      type="number"
                      min="0"
                      className={KLASA_POLA}
                    />
                  </div>

                  <div>
                    <label htmlFor="imp-opis" className={KLASA_ETYKIETY}>
                      Opis (min. 20 znaków)
                    </label>
                    <textarea id="imp-opis" name="opis" required rows={3} className={KLASA_POLA} />
                    <BladPola stan={stanImprezy} pole="opis" />
                  </div>

                  <label className="flex items-center gap-2 text-[14px] cursor-pointer">
                    <input
                      type="checkbox"
                      name="dlaDoroslych"
                      className="w-4 h-4 accent-[#F0A62E]"
                    />
                    <span>Tylko dla dorosłych (18+)</span>
                  </label>

                  <button
                    type="submit"
                    disabled={czekaImpreza}
                    className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] disabled:opacity-60 border-0 rounded-[12px] px-5 py-3 cursor-pointer self-start"
                  >
                    {czekaImpreza ? "Dodawanie..." : "Dodaj imprezę"}
                  </button>
                </form>
              )}
            </div>

            {/* Formularz zlecenia */}
            <div className="border border-[#E2D5CA] rounded-[18px] bg-white p-6">
              <h2 className="m-0 mb-2 font-fraunces font-medium text-[24px]">
                Wystaw zlecenie na giełdę
              </h2>
              <p className="m-0 mb-4 text-[14px] text-[#6A5C70]">
                Zlecenie zostanie od razu zatwierdzone i widoczne dla firm.
              </p>

              <KomunikatFormularza stan={stanZlecenia} />

              <form action={akcjaZlecenia} className="mt-4 flex flex-col gap-3.5">
                <div>
                  <label htmlFor="zl-okazja" className={KLASA_ETYKIETY}>
                    Okazja
                  </label>
                  <select
                    id="zl-okazja"
                    name="okazja"
                    value={okazjaZlecenia}
                    onChange={(e) => setOkazjaZlecenia(e.target.value)}
                    className={KLASA_POLA}
                  >
                    {OKAZJE.map((o) => (
                      <option key={o.slug} value={o.slug}>
                        {o.nazwa}
                      </option>
                    ))}
                  </select>
                </div>

                {okazjaZlecenia === OKAZJA_INNA.slug && (
                  <div>
                    <label htmlFor="zl-inna" className={KLASA_ETYKIETY}>
                      Własna nazwa okazji
                    </label>
                    <input id="zl-inna" name="innaOkazja" required className={KLASA_POLA} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="zl-data" className={KLASA_ETYKIETY}>
                      Data wydarzenia
                    </label>
                    <input
                      id="zl-data"
                      name="dataWydarzenia"
                      type="date"
                      required
                      className={KLASA_POLA}
                    />
                  </div>
                  <div>
                    <label htmlFor="zl-goscie" className={KLASA_ETYKIETY}>
                      Liczba osób
                    </label>
                    <input
                      id="zl-goscie"
                      name="liczbaOsob"
                      type="number"
                      min="1"
                      required
                      defaultValue="80"
                      className={KLASA_POLA}
                    />
                  </div>
                </div>

                <div>
                  <PoleMiejscowosci
                    nazwaPola="miejscowosc"
                    nazwaPolaId="cityId"
                    wartoscPoczatkowa={wartoscPola(stanZlecenia, "miejscowosc")}
                    idPoczatkowe={wartoscPola(stanZlecenia, "cityId")}
                    klasaEtykiety={KLASA_ETYKIETY}
                    klasaPola={KLASA_POLA}
                  />
                  <BladPola stan={stanZlecenia} pole="cityId" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="zl-bmin" className={KLASA_ETYKIETY}>
                      Budżet od (zł, opcj.)
                    </label>
                    <input
                      id="zl-bmin"
                      name="budzetMin"
                      type="number"
                      min="0"
                      className={KLASA_POLA}
                    />
                  </div>
                  <div>
                    <label htmlFor="zl-bmax" className={KLASA_ETYKIETY}>
                      Budżet do (zł, opcj.)
                    </label>
                    <input
                      id="zl-bmax"
                      name="budzetMax"
                      type="number"
                      min="0"
                      className={KLASA_POLA}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="zl-opis" className={KLASA_ETYKIETY}>
                    Opis zlecenia (min. 20 znaków)
                  </label>
                  <textarea id="zl-opis" name="opis" required rows={3} className={KLASA_POLA} />
                  <BladPola stan={stanZlecenia} pole="opis" />
                </div>

                <button
                  type="submit"
                  disabled={czekaZlecenie}
                  className="text-[15px] font-bold text-[#241C2B] bg-[#F0A62E] hover:bg-[#e29922] disabled:opacity-60 border-0 rounded-[12px] px-5 py-3 cursor-pointer self-start"
                >
                  {czekaZlecenie ? "Dodawanie..." : "Wystaw zlecenie"}
                </button>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function KartaStatystyki({
  etykieta,
  wartosc,
  wyrozniona = false,
}: {
  etykieta: string;
  wartosc: number;
  wyrozniona?: boolean;
}) {
  return (
    <div
      className={`rounded-[14px] border p-3.5 ${
        wyrozniona ? "border-[#F0A62E] bg-[#FEF4E4]" : "border-[#E2D5CA] bg-white"
      }`}
    >
      <div className="text-[12px] font-semibold text-[#6A5C70]">{etykieta}</div>
      <div className="font-fraunces text-[26px] leading-tight text-[#241C2B] mt-0.5">{wartosc}</div>
    </div>
  );
}

function PrzyciskZakladki({
  aktywna,
  onClick,
  etykieta,
}: {
  aktywna: boolean;
  onClick: () => void;
  etykieta: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[14px] font-semibold rounded-[10px] px-4 py-2 border cursor-pointer transition-colors ${
        aktywna
          ? "bg-[#241C2B] text-white border-[#241C2B]"
          : "bg-white text-[#3E3344] border-[#D9CCC2] hover:bg-[#F2E9E2]"
      }`}
    >
      {etykieta}
    </button>
  );
}

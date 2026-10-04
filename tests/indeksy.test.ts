/**
 * Indeksy, na których opiera się logika biznesowa.
 *
 * Nie chodzi o wydajność. Te indeksy **są** regułą: bez nich kod wyżej robi
 * co innego, niż mówi jego komentarz, i nikt tego nie zauważy, dopóki nie
 * policzy wierszy ręcznie.
 *
 * Przykład, od którego ten plik powstał: licznik ofert w planie używa
 * `count(distinct request_id)`, a komentarz przy nim mówi, że to równoważne
 * liczeniu wierszy. Jest równoważne wyłącznie dopóki trzyma indeks unikalny
 * `bids(request_id, company_id)`. Ktoś go kiedyś zdejmie i obie liczby rozjadą
 * się po cichu. Sposobu liczenia nie da się dziś odizolować testem, indeksu
 * owszem, więc to on jest tu barierą.
 */
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";

type Indeks = { indexname: string; indexdef: string };

async function indeksy(tabela: string): Promise<Indeks[]> {
  return db.execute<Indeks>(
    sql`select indexname, indexdef from pg_indexes where schemaname = 'public' and tablename = ${tabela}`,
  );
}

async function czyUnikalnyPo(tabela: string, kolumny: string[]): Promise<boolean> {
  const wszystkie = await indeksy(tabela);
  return wszystkie.some((indeks) => {
    const def = indeks.indexdef.toLowerCase();
    return def.includes("unique") && kolumny.every((kolumna) => def.includes(kolumna));
  });
}

describe("indeksy, bez których reguły przestają działać", () => {
  it("bids ma indeks unikalny po (request_id, company_id)", async () => {
    // Ten indeks robi trzy rzeczy naraz:
    //   1. jedna firma, jedna oferta na zlecenie, czyli źródło kodu 409
    //   2. sprawdzenie w samym kodzie aplikacji przepuściłoby dwa równoległe
    //      żądania, ten indeks nie przepuszcza
    //   3. sprawia, że liczenie wierszy i liczenie zleceń dają to samo,
    //      na czym opiera się licznik limitu planu
    expect(await czyUnikalnyPo("bids", ["request_id", "company_id"])).toBe(true);
  });

  it("shortlist ma indeks unikalny po (request_id, bid_id)", async () => {
    // Bez niego jedna oferta mogłaby trafić na krótką listę dwa razy,
    // a odblokowanie kontaktu przestałoby być zdarzeniem jednorazowym.
    expect(await czyUnikalnyPo("shortlist", ["request_id", "bid_id"])).toBe(true);
  });

  it("company_members ma indeks unikalny po (company_id, user_id)", async () => {
    // Jeden człowiek, jedno członkostwo w danej firmie.
    expect(await czyUnikalnyPo("company_members", ["company_id", "user_id"])).toBe(true);
  });

  it("payment_events ma indeks unikalny po provider_event_id", async () => {
    // Idempotencja webhooków płatności. Trzy dostarczenia tego samego zdarzenia
    // nie mogą dać trzech lat abonamentu.
    expect(await czyUnikalnyPo("payment_events", ["provider_event_id"])).toBe(true);
  });

  it("bids ma indeks po (company_id, created_at) pod liczenie okresu", async () => {
    const wszystkie = await indeksy("bids");
    const def = wszystkie.map((i) => i.indexdef.toLowerCase());
    expect(def.some((d) => d.includes("company_id") && d.includes("created_at"))).toBe(true);
  });

  it("sprawdzenie samo w sobie działa: nieistniejący indeks nie jest znajdowany", async () => {
    // Instancja negatywna. Bez niej „indeks istnieje” byłoby prawdą także wtedy,
    // gdyby funkcja sprawdzająca zwracała zawsze true.
    expect(await czyUnikalnyPo("bids", ["kolumna_ktorej_nie_ma"])).toBe(false);
  });
});

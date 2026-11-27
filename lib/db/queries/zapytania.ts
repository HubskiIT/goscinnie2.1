import { desc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Wynik } from "@/lib/db/queries/wynik";
import { companies } from "@/lib/db/schema/katalog";
import { users } from "@/lib/db/schema/tozsamosc";
import { inquiries } from "@/lib/db/schema/zapytania";
import { mozeModerowac, upewnijSieZeGalazUprawnienIstnieje, type Widz } from "@/lib/permissions";
import type { DaneZapytaniaDoFirmy } from "@/lib/validators/zapytania";

export type WiadomoscWIdoku = {
  id: string;
  firmaNazwa: string;
  firmaSlug: string;
  nadawcaImie: string;
  nadawcaEmail: string;
  nadawcaTelefon: string | null;
  dataWydarzenia: string | null;
  liczbaOsob: number | null;
  wiadomosc: string;
  odpowiedz: string | null;
  odpowiedzianoO: Date | null;
  utworzono: Date;
};

export type SkrzynkaWiadomosci = {
  wyslane: WiadomoscWIdoku[];
  otrzymane: WiadomoscWIdoku[];
};

export async function utworzZapytanie(
  widz: Widz,
  dane: DaneZapytaniaDoFirmy,
): Promise<Wynik<{ id: string; firmaNazwa: string; firmaSlug: string; wlascicielEmail: string }>> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "utworzZapytanie");
  if (widz.rodzaj === "anonim") return { ok: false, powod: "brak-dostepu" };

  const [nadawca] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, widz.userId))
    .limit(1);
  if (!nadawca) return { ok: false, powod: "brak-dostepu" };

  const [firma] = await db
    .select({
      id: companies.id,
      nazwa: companies.name,
      slug: companies.slug,
      status: companies.status,
      wlascicielEmail: users.email,
    })
    .from(companies)
    .innerJoin(users, eq(users.id, companies.ownerUserId))
    .where(eq(companies.slug, dane.companySlug))
    .limit(1);

  if (!firma || firma.status === "suspended") {
    return { ok: false, powod: "brak-dostepu" };
  }

  const [wstawione] = await db
    .insert(inquiries)
    .values({
      companyId: firma.id,
      senderUserId: widz.userId,
      senderName: dane.imie,
      senderEmail: nadawca.email,
      senderPhone: dane.telefon,
      eventDate: dane.dataWydarzenia,
      guests: dane.liczbaOsob,
      message: dane.wiadomosc,
    })
    .returning({ id: inquiries.id });

  if (!wstawione) throw new Error("utworzZapytanie: zapis nie zwrócił wiersza.");

  return {
    ok: true,
    dane: {
      id: wstawione.id,
      firmaNazwa: firma.nazwa,
      firmaSlug: firma.slug,
      wlascicielEmail: firma.wlascicielEmail,
    },
  };
}

export async function pobierzMojeWiadomosci(widz: Widz): Promise<SkrzynkaWiadomosci> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "pobierzMojeWiadomosci");
  if (widz.rodzaj === "anonim") return { wyslane: [], otrzymane: [] };

  const wyslane = await db
    .select({
      id: inquiries.id,
      firmaNazwa: companies.name,
      firmaSlug: companies.slug,
      nadawcaImie: inquiries.senderName,
      nadawcaEmail: inquiries.senderEmail,
      nadawcaTelefon: inquiries.senderPhone,
      dataWydarzenia: inquiries.eventDate,
      liczbaOsob: inquiries.guests,
      wiadomosc: inquiries.message,
      odpowiedz: inquiries.replyText,
      odpowiedzianoO: inquiries.repliedAt,
      utworzono: inquiries.createdAt,
    })
    .from(inquiries)
    .innerJoin(companies, eq(companies.id, inquiries.companyId))
    .where(eq(inquiries.senderUserId, widz.userId))
    .orderBy(desc(inquiries.createdAt))
    .limit(50);

  let otrzymane: WiadomoscWIdoku[] = [];
  if (widz.rodzaj === "firma") {
    otrzymane = await db
      .select({
        id: inquiries.id,
        firmaNazwa: companies.name,
        firmaSlug: companies.slug,
        nadawcaImie: inquiries.senderName,
        nadawcaEmail: inquiries.senderEmail,
        nadawcaTelefon: inquiries.senderPhone,
        dataWydarzenia: inquiries.eventDate,
        liczbaOsob: inquiries.guests,
        wiadomosc: inquiries.message,
        odpowiedz: inquiries.replyText,
        odpowiedzianoO: inquiries.repliedAt,
        utworzono: inquiries.createdAt,
      })
      .from(inquiries)
      .innerJoin(companies, eq(companies.id, inquiries.companyId))
      .where(eq(inquiries.companyId, widz.companyId))
      .orderBy(desc(inquiries.createdAt))
      .limit(50);
  } else if (mozeModerowac(widz).wolno) {
    otrzymane = await db
      .select({
        id: inquiries.id,
        firmaNazwa: companies.name,
        firmaSlug: companies.slug,
        nadawcaImie: inquiries.senderName,
        nadawcaEmail: inquiries.senderEmail,
        nadawcaTelefon: inquiries.senderPhone,
        dataWydarzenia: inquiries.eventDate,
        liczbaOsob: inquiries.guests,
        wiadomosc: inquiries.message,
        odpowiedz: inquiries.replyText,
        odpowiedzianoO: inquiries.repliedAt,
        utworzono: inquiries.createdAt,
      })
      .from(inquiries)
      .innerJoin(companies, eq(companies.id, inquiries.companyId))
      .where(ne(companies.status, "suspended"))
      .orderBy(desc(inquiries.createdAt))
      .limit(50);
  }

  return { wyslane, otrzymane };
}

export async function odpowiedzNaZapytanie(
  widz: Widz,
  zapytanieId: string,
  odpowiedz: string,
): Promise<Wynik<{ nadawcaEmail: string; firmaNazwa: string }>> {
  upewnijSieZeGalazUprawnienIstnieje(widz, "odpowiedzNaZapytanie");
  if (widz.rodzaj === "anonim") return { ok: false, powod: "brak-dostepu" };

  const [wiersz] = await db
    .select({
      id: inquiries.id,
      companyId: inquiries.companyId,
      nadawcaEmail: inquiries.senderEmail,
      firmaNazwa: companies.name,
    })
    .from(inquiries)
    .innerJoin(companies, eq(companies.id, inquiries.companyId))
    .where(eq(inquiries.id, zapytanieId))
    .limit(1);

  if (!wiersz) return { ok: false, powod: "brak-dostepu" };

  const mozeFirma = widz.rodzaj === "firma" && widz.companyId === wiersz.companyId;
  const mozeMod = mozeModerowac(widz).wolno;
  if (!mozeFirma && !mozeMod) return { ok: false, powod: "brak-dostepu" };

  const teraz = new Date();
  await db
    .update(inquiries)
    .set({ replyText: odpowiedz, repliedAt: teraz, updatedAt: teraz })
    .where(eq(inquiries.id, zapytanieId));

  return {
    ok: true,
    dane: { nadawcaEmail: wiersz.nadawcaEmail, firmaNazwa: wiersz.firmaNazwa },
  };
}

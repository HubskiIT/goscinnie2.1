"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cena, type Okres, type Plan } from "@/content/cennik";
import type { KlasaCenowa } from "@/content/kategorie";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import type { StanFormularza } from "@/lib/formularze";

/**
 * Akcje płatności. Utworzenie zamówienia PayU i przekierowanie do checkout.
 */

async function pobierzSesje() {
  const sesja = await auth.api.getSession({
    headers: await import("next/headers").then((m) => m.headers()),
  });

  if (!sesja?.user) {
    redirect("/logowanie");
  }

  return sesja;
}

async function pobierzFirme(userId: string) {
  const [czlonek] = await db
    .select({ companyId: schema.companyMembers.companyId })
    .from(schema.companyMembers)
    .where(eq(schema.companyMembers.userId, userId))
    .limit(1);

  if (!czlonek) {
    throw new Error("Nie znaleziono firmy dla tego użytkownika.");
  }

  const [firma] = await db
    .select()
    .from(schema.companies)
    .where(eq(schema.companies.id, czlonek.companyId))
    .limit(1);

  if (!firma) {
    throw new Error("Nie znaleziono firmy.");
  }

  return firma;
}

interface TokenPayU {
  access_token: string;
  expires_in: number;
}

async function pobierzTokenPayU(): Promise<string> {
  const clientId = process.env.PAYU_CLIENT_ID;
  const clientSecret = process.env.PAYU_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Brak konfiguracji PayU (PAYU_CLIENT_ID, PAYU_CLIENT_SECRET).");
  }

  const odpowiedz = await fetch("https://secure.payu.com/pl/standard/user/oauth/authorize", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!odpowiedz.ok) {
    const tresc = await odpowiedz.text();
    throw new Error(`PayU OAuth zwrócił ${odpowiedz.status}: ${tresc}`);
  }

  const dane: TokenPayU = await odpowiedz.json();
  return dane.access_token;
}

interface ZamowieniePayU {
  customerIp: string;
  merchantPosId: string;
  description: string;
  currencyCode: string;
  totalAmount: string;
  extOrderId: string;
  buyer: {
    email: string;
    language: string;
  };
  products: Array<{
    name: string;
    unitPrice: string;
    quantity: string;
  }>;
  continueUrl: string;
  notifyUrl: string;
}

interface OdpowiedzPayU {
  status: { statusCode: string };
  redirectUri?: string;
  orderId?: string;
}

const schematPlatnosc = z.object({
  plan: z.enum(["start", "pelny", "wyrozniony"]),
  okres: z.enum(["miesiac", "pol_roku", "rok"]),
  klasa: z.enum(["A", "B", "C"]),
});

export async function utworzPlatnosc(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = schematPlatnosc.safeParse(wejscie);

  if (!wynik.success) {
    const bledy: Record<string, string[]> = {};
    for (const problem of wynik.error.issues) {
      const pole = String(problem.path[0] ?? "_");
      bledy[pole] = [problem.message];
    }
    return { status: "bledy", bledy, wartosci: {} };
  }

  try {
    const sesja = await pobierzSesje();
    const firma = await pobierzFirme(sesja.user.id);

    // Wyliczamy kwotę z cennika
    const kwotaZl = cena(
      wynik.data.klasa as KlasaCenowa,
      wynik.data.okres as Okres,
      wynik.data.plan as Plan,
    );
    const kwotaGr = kwotaZl * 100;

    // Tworzymy rekord subskrypcji w stanie pending (aktywujemy po płatności)
    const dataRozpoczecia = new Date();
    const dataWygasniecia = new Date(dataRozpoczecia);

    // Dodajemy odpowiedni okres
    if (wynik.data.okres === "miesiac") {
      dataWygasniecia.setMonth(dataWygasniecia.getMonth() + 1);
    } else if (wynik.data.okres === "pol_roku") {
      dataWygasniecia.setMonth(dataWygasniecia.getMonth() + 6);
    } else {
      dataWygasniecia.setFullYear(dataWygasniecia.getFullYear() + 1);
    }

    // Pobieramy plan z bazy (lub tworzymy placeholder - w prototypie pomijamy plany)
    // Na razie zapisujemy subskrypcję bez planId
    const [subskrypcja] = await db
      .insert(schema.subscriptions)
      .values({
        companyId: firma.id,
        planId: "00000000-0000-0000-0000-000000000000", // Placeholder
        status: "active", // W prototypie od razu active
        startsAt: dataRozpoczecia,
        expiresAt: dataWygasniecia,
      })
      .returning();

    if (!subskrypcja) {
      throw new Error("Nie udało się utworzyć subskrypcji.");
    }

    // Tworzymy payment intent
    const extOrderId = `goscinnie-${firma.id}-${Date.now()}`;

    const [intent] = await db
      .insert(schema.paymentIntents)
      .values({
        companyId: firma.id,
        subscriptionId: subskrypcja.id,
        amount: kwotaGr,
        currency: "PLN",
        status: "created",
      })
      .returning();

    // Pobieramy token OAuth
    const token = await pobierzTokenPayU();

    // Tworzymy zamówienie w PayU
    const posId = process.env.PAYU_POS_ID;
    const notifyUrl =
      process.env.PAYU_NOTIFY_URL ?? `${process.env.BETTER_AUTH_URL}/api/webhooks/payu`;
    const continueUrl =
      process.env.PAYU_CONTINUE_URL ?? `${process.env.BETTER_AUTH_URL}/panel/platnosc/sukces`;

    if (!posId) {
      throw new Error("Brak PAYU_POS_ID w zmiennych środowiskowych.");
    }

    const zamowienie: ZamowieniePayU = {
      customerIp: "127.0.0.1", // W produkcji z request headers
      merchantPosId: posId,
      description: `Abonament Gościnnie - ${wynik.data.plan} - ${wynik.data.okres}`,
      currencyCode: "PLN",
      totalAmount: String(kwotaGr),
      extOrderId,
      buyer: {
        email: sesja.user.email,
        language: "pl",
      },
      products: [
        {
          name: `Plan ${wynik.data.plan} na ${wynik.data.okres}`,
          unitPrice: String(kwotaGr),
          quantity: "1",
        },
      ],
      continueUrl,
      notifyUrl,
    };

    const odpowiedzPayU = await fetch("https://secure.payu.com/api/v2_1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(zamowienie),
    });

    if (!odpowiedzPayU.ok) {
      const tresc = await odpowiedzPayU.text();
      throw new Error(`PayU API zwróciło ${odpowiedzPayU.status}: ${tresc}`);
    }

    const wynikPayU: OdpowiedzPayU = await odpowiedzPayU.json();

    if (wynikPayU.status.statusCode !== "SUCCESS") {
      throw new Error(`PayU zwróciło status: ${wynikPayU.status.statusCode}`);
    }

    if (!wynikPayU.redirectUri) {
      throw new Error("PayU nie zwróciło redirectUri.");
    }

    if (!intent) {
      throw new Error("Payment intent nie został utworzony.");
    }

    // Zapisujemy orderId z PayU
    if (wynikPayU.orderId) {
      await db
        .update(schema.paymentIntents)
        .set({
          payuOrderId: wynikPayU.orderId,
          status: "pending",
        })
        .where(eq(schema.paymentIntents.id, intent.id));
    }

    // Przekierowanie na PayU
    redirect(wynikPayU.redirectUri);
  } catch (error) {
    console.error("Błąd tworzenia płatności:", error);
    const komunikat = error instanceof Error ? error.message : "Nieznany błąd";
    return {
      status: "bledy",
      bledy: { _: [`Nie udało się utworzyć płatności: ${komunikat}`] },
      wartosci: {},
    };
  }
}

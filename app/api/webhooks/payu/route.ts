import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";

/**
 * Webhook PayU. Otrzymuje notyfikacje o zmianie statusu płatności.
 *
 * Idempotencja: każde zdarzenie zapisujemy do payment_events z unikalnym
 * provider_event_id. Duplikaty kończą się bez efektu i zwracają 200.
 *
 * Weryfikacja: PayU wysyła nagłówek OpenPayu-Signature z podpisem HMAC.
 */

interface NotyfikacjaPayU {
  order: {
    orderId: string;
    extOrderId: string;
    orderCreateDate: string;
    notifyUrl: string;
    customerIp: string;
    merchantPosId: string;
    description: string;
    currencyCode: string;
    totalAmount: string;
    status: string;
    products: Array<{
      name: string;
      unitPrice: string;
      quantity: string;
    }>;
  };
  localReceiptDateTime?: string;
  properties?: Array<{ name: string; value: string }>;
}

function weryfikujPodpis(cialo: string, podpis: string | null): boolean {
  if (!podpis) {
    return false;
  }

  const secondKey = process.env.PAYU_SECOND_KEY;
  if (!secondKey) {
    console.error("Brak PAYU_SECOND_KEY - nie można zweryfikować webhooka.");
    return false;
  }

  // PayU wysyła: signature=algorithm;hash
  const czesci = podpis.split(";");
  if (czesci.length !== 2) {
    return false;
  }

  const [_algorytm, otrzymanyHash] = czesci;

  // Obliczamy hash: cialo + secondKey
  const crypto = require("node:crypto");
  const wyliczonyHash = crypto
    .createHash("sha256")
    .update(cialo + secondKey)
    .digest("hex");

  return wyliczonyHash === otrzymanyHash;
}

export async function POST(request: NextRequest) {
  try {
    const cialo = await request.text();
    const podpis = request.headers.get("OpenPayu-Signature");

    // Weryfikacja podpisu
    if (!weryfikujPodpis(cialo, podpis)) {
      console.error("Nieprawidłowy podpis webhooka PayU.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const notyfikacja: NotyfikacjaPayU = JSON.parse(cialo);
    const orderId = notyfikacja.order.orderId;

    // Idempotencja: sprawdzamy, czy to zdarzenie już obsłużyliśmy
    const [istniejaceZdarzenie] = await db
      .select()
      .from(schema.paymentEvents)
      .where(eq(schema.paymentEvents.providerEventId, orderId))
      .limit(1);

    if (istniejaceZdarzenie) {
      // Duplikat - zwracamy 200 bez akcji
      return NextResponse.json({ status: "OK" });
    }

    // Znajdujemy payment intent
    const [intent] = await db
      .select()
      .from(schema.paymentIntents)
      .where(eq(schema.paymentIntents.payuOrderId, orderId))
      .limit(1);

    if (!intent) {
      console.error(`Nie znaleziono payment_intent dla orderId: ${orderId}`);
      return NextResponse.json({ status: "OK" }); // Zwracamy 200, żeby PayU nie retryował
    }

    // Transakcja: zapisujemy event i aktualizujemy stan
    await db.transaction(async (tx) => {
      // Zapisujemy event
      await tx.insert(schema.paymentEvents).values({
        providerEventId: orderId,
        // biome-ignore lint/suspicious/noExplicitAny: jsonb przyjmuje dowolny JSON
        payload: notyfikacja as any,
        processedAt: new Date(),
      });

      const status = notyfikacja.order.status;

      if (status === "COMPLETED") {
        // Płatność zakończona sukcesem
        await tx
          .update(schema.paymentIntents)
          .set({ status: "completed" })
          .where(eq(schema.paymentIntents.id, intent.id));

        // Aktywujemy subskrypcję (w prototypie już jest active, ale dla pewności)
        if (intent.subscriptionId) {
          await tx
            .update(schema.subscriptions)
            .set({ status: "active" })
            .where(eq(schema.subscriptions.id, intent.subscriptionId));
        }
      } else if (status === "CANCELED" || status === "REJECTED") {
        // Płatność anulowana lub odrzucona
        await tx
          .update(schema.paymentIntents)
          .set({ status: "cancelled" })
          .where(eq(schema.paymentIntents.id, intent.id));

        if (intent.subscriptionId) {
          await tx
            .update(schema.subscriptions)
            .set({ status: "cancelled" })
            .where(eq(schema.subscriptions.id, intent.subscriptionId));
        }
      } else if (status === "PENDING" || status === "WAITING_FOR_CONFIRMATION") {
        // Płatność w toku
        await tx
          .update(schema.paymentIntents)
          .set({ status: "pending" })
          .where(eq(schema.paymentIntents.id, intent.id));
      }
    });

    return NextResponse.json({ status: "OK" });
  } catch (error) {
    console.error("Błąd obsługi webhooka PayU:", error);
    // Zwracamy 500 - PayU będzie retryował
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Interfejs nadawcy poczty. W lokalnym dev wysyła do konsoli,
 * w produkcji przez Resend.
 */

export interface Email {
  do: string;
  temat: string;
  html: string;
}

export interface Nadawca {
  wyslij(email: Email): Promise<void>;
}

export async function pobierzNadawce(): Promise<Nadawca> {
  if (process.env.NODE_ENV === "production" && process.env.RESEND_API_KEY) {
    const { ResendNadawca } = await import("./resend");
    return new ResendNadawca(process.env.RESEND_API_KEY);
  }

  const { KonsolaNadawca } = await import("./konsola");
  return new KonsolaNadawca();
}

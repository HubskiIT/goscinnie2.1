/**
 * Konfiguracja sesji i logowania.
 *
 * Obsługę sesji i haseł robi biblioteka, nie my. CLAUDE.md zabrania pisania
 * własnej, i słusznie: to jest dokładnie ta warstwa, w której własna
 * pomysłowość kończy się wyciekiem kont.
 *
 * Nasz udział ogranicza się do trzech decyzji:
 *
 * 1. argon2id zamiast domyślnego scrypt. Parametry niżej.
 * 2. Ciasteczko HttpOnly, Secure na produkcji, SameSite Lax.
 * 3. Tożsamość żyje w istniejącej tabeli `users`, nie w osobnej.
 */
import { hash, verify } from "@node-rs/argon2";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { db } from "@/lib/db";
import { accounts, sessions, verifications } from "@/lib/db/schema/sesje";
import { users } from "@/lib/db/schema/tozsamosc";
import { leniwy } from "@/lib/leniwy";
import { adresIp, kluczIp, kluczKonta, LIMIT_PO_IP, LIMIT_PO_KONCIE, zuzyjProbe } from "./limity";

/**
 * Parametry argon2id. Wartości z zaleceń OWASP dla wariantu id:
 * 19 MiB pamięci, dwa przebiegi, równoległość 1.
 *
 * Pamięć jest tu ważniejsza od liczby przebiegów: to ona sprawia, że łamanie
 * na kartach graficznych przestaje się opłacać. Nie obniżaj jej, żeby
 * przyspieszyć logowanie.
 */
const ARGON2 = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

function utworzAuth() {
  const sekret = process.env.BETTER_AUTH_SECRET;
  if (!sekret) {
    throw new Error("Brak BETTER_AUTH_SECRET. Skopiuj .env.example do .env i uzupełnij.");
  }

  return betterAuth({
    secret: sekret,
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verifications,
      },
    }),

    advanced: {
      database: {
        // Identyfikatory generuje Postgres przez gen_random_uuid(), tak jak
        // w całej reszcie schematu. Bez tego better-auth wstawiałby własne
        // ciągi znaków do kolumn typu uuid.
        generateId: false,
      },
      cookies: {
        session_token: {
          attributes: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
          },
        },
      },
      useSecureCookies: process.env.NODE_ENV === "production",
    },

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      requireEmailVerification: true,
      password: {
        hash: (haslo) => hash(haslo, ARGON2),
        verify: ({ hash: skrot, password }) => verify(skrot, password, ARGON2),
      },

      sendResetPassword: async ({ user, url }) => {
        const { pobierzNadawce } = await import("@/lib/poczta");
        const { resetHasla } = await import("@/lib/poczta/szablony");
        const nadawca = await pobierzNadawce();
        await nadawca.wyslij(resetHasla(user.email, url));
      },

      sendVerificationEmail: async ({
        user,
        token,
      }: {
        user: { email: string };
        url: string;
        token: string;
      }) => {
        const { pobierzNadawce } = await import("@/lib/poczta");
        const { weryfikacjaEmail } = await import("@/lib/poczta/szablony");
        const nadawca = await pobierzNadawce();
        await nadawca.wyslij(weryfikacjaEmail(user.email, token));
      },
    },

    session: {
      // Siedem dni, odświeżane co dobę przy aktywności.
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },

    // Nazwy tabel w bazie biorą się z obiektów Drizzle podanych wyżej w `schema`,
    // więc `modelName` byłoby drugim, rozjeżdżającym się źródłem tej samej nazwy.

    hooks: {
      /**
       * Limity prób logowania. Liczymy każdą próbę, nie tylko nieudaną, bo do
       * policzenia nieudanych trzeba by najpierw sprawdzić hasło, a to znaczy
       * wykonać argon2id. Wtedy sam limit stawałby się kosztowny dokładnie
       * wtedy, kiedy najbardziej go potrzeba.
       */
      before: createAuthMiddleware(async (kontekst) => {
        if (kontekst.path !== "/sign-in/email") return;

        const cialo = kontekst.body as { email?: unknown } | undefined;
        const email = typeof cialo?.email === "string" ? cialo.email : null;
        const ip = adresIp(kontekst.headers ?? new Headers());

        const poIp = await zuzyjProbe(kluczIp(ip), LIMIT_PO_IP);
        const poKoncie = email
          ? await zuzyjProbe(kluczKonta(email), LIMIT_PO_KONCIE)
          : { wolno: true, zuzyte: 0 };

        if (!poIp.wolno || !poKoncie.wolno) {
          // Komunikat jest celowo taki sam w obu przypadkach. Rozróżnienie
          // „za dużo prób z tego adresu” od „za dużo prób do tego konta”
          // mówiłoby atakującemu, czy trafił w istniejące konto.
          throw new APIError("TOO_MANY_REQUESTS", {
            message: "Za dużo prób logowania. Spróbuj ponownie za kilkanaście minut.",
          });
        }
      }),
    },
  });
}

/** Konfiguracja powstaje przy pierwszym użyciu, nie przy wczytaniu modułu. */
export const auth = leniwy(utworzAuth);

export type Sesja = typeof auth.$Infer.Session;

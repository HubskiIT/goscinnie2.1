/**
 * Klient better-auth dla komponentów przeglądarkowych.
 * Formularze rozmawiają z /api/auth przez tę warstwę, nie własnym fetchem.
 */
import { createAuthClient } from "better-auth/react";

export const klientAuth = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
});

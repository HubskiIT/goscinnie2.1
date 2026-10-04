/**
 * Wszystkie trasy logowania obsługuje better-auth pod /api/auth/*.
 * Nie dopisujemy tu własnych kroków: każdy dodatkowy krok w tym miejscu
 * to okazja do pomyłki w warstwie, w której pomyłka kosztuje konta.
 */
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);

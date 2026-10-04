import { defineConfig } from "drizzle-kit";

// Uwaga: generujemy tu tylko SQL "w przód". Cofnięcia pisze się ręcznie
// w drizzle/down/, bo drizzle-kit ich nie tworzy, a CI ich wymaga.
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema/*.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://goscinnie:goscinnie@localhost:5432/goscinnie",
  },
  casing: "snake_case",
  verbose: true,
  strict: true,
});

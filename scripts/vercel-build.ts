/**
 * Skrypt budowania na Vercel.
 *
 * Na produkcji uruchamia migracje i słowniki przed budowaniem Next.js.
 * W każdym innym środowisku (preview, brak zmiennej) buduje tylko frontend.
 */
import { execSync } from "node:child_process";

export type Krok = "migracja" | "slowniki" | "budowanie";

export function krokowo(env: Record<string, string | undefined>): Krok[] {
  const kroki: Krok[] = [];

  if (env.VERCEL_ENV === "production") {
    kroki.push("migracja", "slowniki");
  }

  kroki.push("budowanie");
  return kroki;
}

async function main(): Promise<void> {
  const kroki = krokowo(process.env);

  for (const krok of kroki) {
    if (krok === "migracja") {
      const { wPrzod, zamknij } = await import("./migrate.js");
      try {
        await wPrzod();
      } finally {
        await zamknij();
      }
    } else if (krok === "slowniki") {
      const { polacz } = await import("./slowniki.js");
      const { db, zamknij } = polacz();
      try {
        const { wypelnijSlowniki } = await import("./slowniki.js");
        await wypelnijSlowniki(db);
      } finally {
        await zamknij();
      }
    } else if (krok === "budowanie") {
      execSync("next build", { stdio: "inherit" });
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}

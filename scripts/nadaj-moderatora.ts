/**
 * Nadanie i odebranie roli moderatora.
 *
 * Rola moderatora nie wchodzi przez żaden ekran i nie powinna: konto
 * administracyjne nadaje się z konsoli, przy bazie, a nie klika w serwisie.
 * Przycisk „zrób mnie administratorem” to pierwsza rzecz, której szuka się
 * po włamaniu na cudze konto.
 *
 * DLACZEGO SKRYPT ODMAWIA KONTU NALEŻĄCEMU DO FIRMY. `widzZZadania` stawia
 * rolę moderatora ponad członkostwem w firmie, więc konto z tą rolą
 * przestaje obsługiwać panel firmy. Gdyby skrypt nadał rolę po cichu,
 * właściciel sali straciłby dostęp do własnego profilu i nie dowiedziałby
 * się dlaczego. Lepiej odmówić tutaj i powiedzieć wprost, że potrzebne jest
 * drugie konto.
 *
 * Użycie:
 *   tsx scripts/nadaj-moderatora.ts adres@example.com              na sucho
 *   tsx scripts/nadaj-moderatora.ts adres@example.com --na-serio
 *   tsx scripts/nadaj-moderatora.ts adres@example.com --odbierz --na-serio
 *   tsx scripts/nadaj-moderatora.ts --lista
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companyMembers } from "@/lib/db/schema/katalog";
import { users } from "@/lib/db/schema/tozsamosc";

type Argumenty = {
  adres: string | null;
  naSerio: boolean;
  odbierz: boolean;
  lista: boolean;
};

function odczytajArgumenty(wejscie: readonly string[]): Argumenty {
  let adres: string | null = null;
  let naSerio = false;
  let odbierz = false;
  let lista = false;

  for (const argument of wejscie) {
    if (argument === "--na-serio") naSerio = true;
    else if (argument === "--odbierz") odbierz = true;
    else if (argument === "--lista") lista = true;
    else if (argument.startsWith("--")) throw new Error(`Nieznany argument: ${argument}`);
    else if (adres !== null) throw new Error("Podaj dokładnie jeden adres e-mail.");
    else adres = argument.trim().toLowerCase();
  }

  if (!lista && adres === null) {
    throw new Error("Podaj adres e-mail konta albo --lista.");
  }

  return { adres, naSerio, odbierz, lista };
}

async function wypiszModeratorow(): Promise<void> {
  const moderatorzy = await db
    .select({ email: users.email, nazwa: users.name })
    .from(users)
    .where(eq(users.role, "moderator"));

  if (moderatorzy.length === 0) {
    console.log("Nie ma ani jednego konta z rolą moderatora.");
    return;
  }

  console.log(`Konta z rolą moderatora: ${moderatorzy.length}`);
  for (const m of moderatorzy) console.log(`  ${m.email}  (${m.nazwa})`);
}

async function main(): Promise<void> {
  const { adres, naSerio, odbierz, lista } = odczytajArgumenty(process.argv.slice(2));

  if (lista) {
    await wypiszModeratorow();
    return;
  }
  if (adres === null) return;

  const [konto] = await db
    .select({ id: users.id, email: users.email, nazwa: users.name, rola: users.role })
    .from(users)
    .where(eq(users.email, adres))
    .limit(1);

  /*
   * Brak konta to błąd, nie brak zmian. Cicho pominięty adres z literówką
   * dałby komunikat „gotowe” przy nietkniętym koncie, a człowiek dowiedziałby
   * się o tym dopiero wtedy, gdy panel moderacji odmówi mu wejścia.
   */
  if (!konto) {
    throw new Error(
      `Nie ma konta o adresie ${adres}. Załóż je najpierw w serwisie i potwierdź adres.`,
    );
  }

  const docelowa = odbierz ? "client" : "moderator";

  if (konto.rola === docelowa) {
    console.log(`Konto ${konto.email} już ma rolę ${docelowa}. Nic do zrobienia.`);
    return;
  }

  if (!odbierz) {
    const czlonkostwa = await db
      .select({ companyId: companyMembers.companyId })
      .from(companyMembers)
      .where(eq(companyMembers.userId, konto.id));

    if (czlonkostwa.length > 0) {
      throw new Error(
        `Konto ${konto.email} należy do firmy (${czlonkostwa.length} członkostw).\n` +
          "Rola moderatora wygrywa z członkostwem, więc po jej nadaniu to konto " +
          "straciłoby panel firmy.\n" +
          "Załóż osobne konto administracyjne i nadaj rolę jemu.",
      );
    }
  }

  console.log(`${konto.email} (${konto.nazwa}): ${konto.rola} -> ${docelowa}`);

  if (!naSerio) {
    console.log("");
    console.log("Przebieg na sucho. Nic nie zapisano. Dopisz --na-serio, żeby wykonać.");
    return;
  }

  await db
    .update(users)
    .set({ role: docelowa, updatedAt: new Date() })
    .where(eq(users.id, konto.id));

  console.log("");
  console.log(
    odbierz
      ? "Rola odebrana. Konto wraca do zwykłego klienta."
      : "Rola nadana. Panel moderacji jest dostępny po ponownym zalogowaniu.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((blad: unknown) => {
    console.error(blad instanceof Error ? blad.message : String(blad));
    process.exit(1);
  });

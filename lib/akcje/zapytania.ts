"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adresAplikacji } from "@/lib/adres";
import { widzZZadania } from "@/lib/auth/widz";
import { odpowiedzNaZapytanie, utworzZapytanie } from "@/lib/db/queries/zapytania";
import { bledyZod, type StanFormularza } from "@/lib/formularze";
import { pobierzNadawce } from "@/lib/poczta";
import { daneOdpowiedziNaZapytanie, daneZapytaniaDoFirmy } from "@/lib/validators/zapytania";

export async function wyslijZapytanieDoFirmy(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = daneZapytaniaDoFirmy.safeParse(wejscie);
  if (!wynik.success) return bledyZod(wynik.error, wejscie);

  const widz = await widzZZadania(await headers());
  if (widz.rodzaj === "anonim") {
    redirect(`/logowanie?powrot=${encodeURIComponent(`/f/${wynik.data.companySlug}/zapytanie`)}`);
  }

  const zapis = await utworzZapytanie(widz, wynik.data);
  if (!zapis.ok) {
    return {
      status: "bledy",
      bledy: { _: ["Nie udało się wysłać zapytania. Sprawdź, czy firma jest aktywna."] },
      wartosci: {},
    };
  }

  try {
    const nadawca = await pobierzNadawce();
    await nadawca.wyslij({
      do: zapis.dane.wlascicielEmail,
      temat: `Nowe zapytanie o ${zapis.dane.firmaNazwa} w Gościnnie`,
      html: `<p>Otrzymałeś nowe zapytanie od <strong>${wynik.data.imie}</strong> w sprawie <strong>${zapis.dane.firmaNazwa}</strong>.</p><p>${wynik.data.wiadomosc}</p><p><a href="${adresAplikacji()}/wiadomosci">Odpowiedz w panelu wiadomości</a></p>`,
    });
  } catch {
    // Awaria poczty nie cofa zapisu wiadomości w bazie.
  }

  revalidatePath("/wiadomosci");
  return {
    status: "informacja",
    tresc: `Zapytanie do „${zapis.dane.firmaNazwa}” zostało wysłane. Odpowiedź znajdziesz w Wiadomościach.`,
    odnosnik: { tekst: "Przejdź do wiadomości", adres: "/wiadomosci" },
  };
}

export async function odpowiedzNaWiadomosc(
  _poprzedni: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const wejscie = Object.fromEntries(dane.entries());
  const wynik = daneOdpowiedziNaZapytanie.safeParse(wejscie);
  if (!wynik.success) return bledyZod(wynik.error, wejscie);

  const widz = await widzZZadania(await headers());
  const zapis = await odpowiedzNaZapytanie(widz, wynik.data.zapytanieId, wynik.data.odpowiedz);
  if (!zapis.ok) {
    return {
      status: "informacja",
      waga: "ostrzezenie",
      tresc: "Nie masz uprawnień do odpowiedzi na tę wiadomość.",
    };
  }

  try {
    const nadawca = await pobierzNadawce();
    await nadawca.wyslij({
      do: zapis.dane.nadawcaEmail,
      temat: `Odpowiedź od ${zapis.dane.firmaNazwa} — Gościnnie`,
      html: `<p>Firma <strong>${zapis.dane.firmaNazwa}</strong> odpowiedziała na Twoje zapytanie:</p><p>${wynik.data.odpowiedz}</p><p><a href="${adresAplikacji()}/wiadomosci">Zobacz rozmowę w Gościnnie</a></p>`,
    });
  } catch {
    // Awaria poczty nie cofa zapisu odpowiedzi w bazie.
  }

  revalidatePath("/wiadomosci");
  return { status: "informacja", tresc: "Odpowiedź została zapisana i wysłana." };
}

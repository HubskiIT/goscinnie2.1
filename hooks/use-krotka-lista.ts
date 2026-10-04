"use client";

import { useCallback, useEffect, useState } from "react";

const KLUCZ = "goscinnie:krotka-lista";

/**
 * Krótka lista (ulubione) bez konta: trzymana w przeglądarce.
 * Po wejściu logowania przenosimy ją na konto, punkt 9.4 planu.
 */
export function useKrotkaLista() {
  const [lista, setLista] = useState<string[]>([]);

  useEffect(() => {
    try {
      const zapisane = window.localStorage.getItem(KLUCZ);
      if (zapisane) setLista(JSON.parse(zapisane) as string[]);
    } catch {
      // Prywatne okno albo zablokowane dane strony. Lista zostaje pusta.
    }
  }, []);

  const przelacz = useCallback((nazwa: string) => {
    setLista((poprzednia) => {
      const nowa = poprzednia.includes(nazwa)
        ? poprzednia.filter((n) => n !== nazwa)
        : [...poprzednia, nazwa];
      try {
        window.localStorage.setItem(KLUCZ, JSON.stringify(nowa));
      } catch {
        // Zapis nieobowiązkowy, lista działa do końca sesji.
      }
      return nowa;
    });
  }, []);

  return { lista, przelacz };
}

/**
 * Leniwy uchwyt do zasobu, który potrzebuje zmiennych środowiskowych.
 *
 * Powód: Next zbiera dane tras w czasie budowania i wczytuje wtedy moduły tras
 * API. Gdyby połączenie z bazą albo konfiguracja logowania powstawały przy
 * wczytaniu modułu, build wymagałby produkcyjnych sekretów, a to zły pomysł:
 * build nie powinien mieć dostępu do bazy.
 *
 * Zasób powstaje przy pierwszym użyciu. Brak zmiennej dalej jest błędem,
 * tylko zgłaszanym przy pierwszym żądaniu, a nie przy budowaniu.
 */
export function leniwy<T extends object>(utworz: () => T): T {
  let zasob: T | null = null;

  const pobierz = (): T => {
    zasob ??= utworz();
    return zasob;
  };

  return new Proxy({} as T, {
    get(_cel, wlasciwosc) {
      const wartosc = Reflect.get(pobierz(), wlasciwosc) as unknown;
      // Metody wiążemy z prawdziwym obiektem, bo inaczej straciłyby swoje `this`.
      return typeof wartosc === "function" ? wartosc.bind(pobierz()) : wartosc;
    },
    has(_cel, wlasciwosc) {
      return Reflect.has(pobierz(), wlasciwosc);
    },
    ownKeys() {
      return Reflect.ownKeys(pobierz());
    },
    getOwnPropertyDescriptor(_cel, wlasciwosc) {
      const opis = Reflect.getOwnPropertyDescriptor(pobierz(), wlasciwosc);
      return opis === undefined ? undefined : { ...opis, configurable: true };
    },
  });
}

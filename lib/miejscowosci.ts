/**
 * Stałe pola miejscowości, wspólne dla endpointu i komponentu.
 *
 * Leżą osobno, bo komponent jest kliencki, a endpoint serwerowy: import
 * w którąkolwiek stronę wciągnąłby do przeglądarki sterownik bazy albo
 * do serwera kod Reacta.
 */

/**
 * Od ilu znaków pytamy o podpowiedzi.
 *
 * Jedna litera pasuje do kilkudziesięciu tysięcy miejscowości i nie zawęża
 * niczego. Ta sama wartość musi obowiązywać po obu stronach: komponent, który
 * pyta od jednego znaku, dostawałby w odpowiedzi pustą listę i wyglądałby
 * na zepsuty.
 */
export const MIN_ZNAKOW_PODPOWIEDZI = 2;

/** Ile podpowiedzi pokazujemy. Tyle mieści się pod polem bez przewijania. */
export const PODPOWIEDZI = 8;

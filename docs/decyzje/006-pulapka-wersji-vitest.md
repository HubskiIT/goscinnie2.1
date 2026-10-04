# 006. Pułapka wersji: fileParallelism w Vitest 5

**Data:** 2026-09-24
**Status:** obejście, do usunięcia po potwierdzeniu, że naprawiono

**Dotyczy:** Vitest 5.0.1

## Rzecz

W `vitest.config.ts` stoją obok siebie trzy ustawienia i wyglądają na
nadmiarowe:

```ts
fileParallelism: false,
maxWorkers: 1,
globalSetup: ["tests/zasiew-przed-testami.ts"],
```

Nie są. Każde robi co innego i każde jest potrzebne z innego powodu.

## Co się stało

Testy integracyjne dzielą jedną bazę, więc pliki testowe nie mogą biec
równolegle. Ustawienie `fileParallelism: false` mówi dokładnie to i wygląda
na wystarczające.

**W Vitest 5.0.1 nie jest respektowane z pliku konfiguracyjnego.** Flaga
`--no-file-parallelism` z wiersza poleceń działa, ta sama opcja w `test: {}`
nie. Objawiało się to dwoma testami padającymi wyłącznie w pełnym przebiegu
i nigdy w pojedynczym: plik z ofertami przegrywał wyścig z plikiem sesji, który
przepisuje autora zlecenia.

`maxWorkers: 1` wymusza to samo na poziomie puli procesów i działa.

Osobno: `minWorkers` w tej wersji nie istnieje w typach i psuje `tsc`.

## Co sprawdzić po aktualizacji Vitest

1. Usuń `maxWorkers: 1`, zostaw samo `fileParallelism: false`.
2. Uruchom pełny zestaw trzy razy pod rząd.
3. Jeśli przechodzi za każdym razem, obejście można usunąć razem z tym plikiem.
4. Jeśli pada w losowych miejscach, obejście zostaje, a tu dopisz numer wersji,
   w której sprawdzano.

## Czego to NIE naprawiło

Sekwencyjność plików była warunkiem koniecznym i nie była wystarczającym.
Zestaw dziedziczył stan po sobie: testy zamykają zlecenia, wycofują oferty
i przepisują autorów, więc drugie uruchomienie zaczynało od innego stanu.

Rozwiązaniem jest `globalSetup`, który przed każdym przebiegiem odtwarza schemat
i zasiew, dokładnie tak jak CI. **To ustawienie zostaje niezależnie od tego, co
zrobi kolejna wersja Vitest.**

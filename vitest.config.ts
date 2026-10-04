import { defineConfig } from "vitest/config";
import { BaseSequencer } from "vitest/node";

/**
 * Kolejność plików testowych ustalona alfabetycznie.
 *
 * Vitest domyślnie sortuje pliki po rozmiarze, żeby lepiej rozłożyć pracę
 * między procesy. Przy jednej wspólnej bazie ta kolejność zaczyna mieć
 * znaczenie: pliki zostawiają po sobie dane, więc kto pierwszy, ten zastaje
 * inny stan. Sortowanie po rozmiarze sprawia, że **dopisanie kilku linii
 * w teście zmienia kolejność całego zestawu**, a wraz z nią wynik.
 *
 * Objawia się to najgorzej, jak można: trzy testy padają raz na kilka
 * przebiegów, w miejscu niezwiązanym ze zmianą, która to wywołała.
 *
 * Kolejność alfabetyczna nic nie przyspiesza i o to chodzi: ma być zawsze taka
 * sama, żeby wynik zestawu zależał od kodu, a nie od długości plików.
 */
class KolejnoscAlfabetyczna extends BaseSequencer {
  override async sort(pliki: Parameters<BaseSequencer["sort"]>[0]) {
    return [...pliki].sort((a, b) => a.moduleId.localeCompare(b.moduleId));
  }
}

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "lib/**/*.test.ts"],
    environment: "node",
    /*
     * Testy integracyjne dzielą jedną bazę, więc pliki nie mogą biec równolegle.
     *
     * `fileParallelism: false` samo w sobie okazało się niewystarczające:
     * przy Vitest 5 pliki nadal startowały równolegle, a testy ofert przegrywały
     * wyścig z plikiem sesji, który przepisuje autora zlecenia. Objawiało się to
     * dwoma testami padającymi wyłącznie w pełnym przebiegu, nigdy w pojedynczym.
     *
     * `maxWorkers: 1` wymusza to samo na poziomie puli procesów i działa.
     * Zostawiamy oba: pierwsze wyraża zamiar, drugie go egzekwuje.
     *
     * Osobno, i to jest właściwe rozwiązanie problemu: `globalSetup` niżej
     * odtwarza bazę przed każdym przebiegiem. Sama sekwencyjność nie wystarcza,
     * bo testy zostawiają po sobie zmienione dane.
     */
    fileParallelism: false,
    maxWorkers: 1,

    // Każdy przebieg zaczyna od świeżego schematu i zasiewu. Bez tego zestaw
    // dziedziczy stan po poprzednim uruchomieniu i pada w losowych miejscach.
    globalSetup: ["tests/zasiew-przed-testami.ts"],

    sequence: { sequencer: KolejnoscAlfabetyczna },
  },
  resolve: {
    alias: { "@": new URL(".", import.meta.url).pathname },
  },
});

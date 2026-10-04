# 009. Jedna kategoria „Dekoracje", a klasa cenowa zależy też od wielkości firmy

Data: 4 października 2026.

## Rozstrzygnięte: „Dekorator" i „dekoracje" to jedna kategoria

W specyfikacji te same firmy pojawiały się w dwóch miejscach: jako „Dekorator"
w tabeli ról i jako „dekoracje" w tabeli klas cenowych. To nie są dwie
kategorie, tylko jedna opisana dwoma słowami.

Obowiązuje nazwa **Dekoracje**, slug `dekoracje`, klasa B. Nazwa jest
pojemniejsza niż „Dekorator", bo obejmuje też wypożyczalnie i florystykę
dekoracyjną. Osobno stoi kategoria `florysta` dla firm, które robią wyłącznie
kwiaty.

Jedyne źródło listy kategorii to `content/kategorie.ts`. Jeśli jakiś dokument
nadal mówi „Dekorator", to ten dokument jest nieaktualny, a nie kod.

## Kierunek: klasa cenowa zależy od kategorii i od wielkości firmy

Problem, który to wywołał: catering stoi w klasie A, bo mieści się tam catering
pełny, obsługujący wesela. Przy jednej klasie na kategorię mały catering
okolicznościowy, który robi chrzciny za dwa tysiące złotych, płaciłby za plan
Start tyle samo co firma obsługująca wesela na dwieście osób. To wypycha
z serwisu dokładnie te firmy, których ma być dużo.

Decyzja kierunkowa: **klasa cenowa przestaje wynikać z samej kategorii**.
Wyznacza ją para: kategoria główna plus wielkość firmy, mała albo duża.
Dzięki temu mali płacą mniej w każdej kategorii, a nie tylko w cateringu.

### Co trzeba rozstrzygnąć, zanim to wejdzie do kodu

Nie dopisuję tego do modelu danych, dopóki nie ma odpowiedzi, bo inaczej
powstałoby pole, którego nic nie wypełnia, i kwoty wzięte z sufitu.

1. **Po czym poznajemy małą firmę.** Deklaracja przy rejestracji, próg
   pojemności obsługiwanej imprezy, przychód, liczba pracowników? Deklaracja
   jest najprostsza, ale wymaga decyzji, co się dzieje, gdy firma zadeklaruje
   źle.
2. **Ile kosztuje każdy z planów dla małej firmy w klasach A, B i C.**
   Dzisiejszy cennik zna wyłącznie kwoty dla jednej skali.
3. **Czy wielkość jest zmienna w czasie.** Firma rośnie. Czy zmiana wielkości
   przelicza abonament od razu, czy dopiero przy odnowieniu.
4. **Czy to zastępuje rozbicie cateringu na dwie kategorie.** Jeśli wielkość
   załatwia sprawę, osobna kategoria „Catering okolicznościowy" nie jest
   potrzebna i lista zostaje czternastoelementowa.

Do czasu odpowiedzi w `content/kategorie.ts` zostaje jedna klasa na kategorię,
a catering stoi w klasie A.

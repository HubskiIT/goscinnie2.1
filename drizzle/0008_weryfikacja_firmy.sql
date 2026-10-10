-- Migracja 0008: tabela company_verification, czyli NIP i telefon firmy.
--
-- Dlaczego osobna tabela, a nie kolumny w `companies`: NIP i telefon to dane
-- rozliczeniowe i kontaktowe, nie treść profilu. Profil jest publiczny i cały
-- czytany przy każdym wejściu na /f/<slug>, a te dwa pola nie mają prawa tam
-- trafić. Osobna tabela sprawia, że zapytanie o profil fizycznie ich nie widzi,
-- zamiast polegać na tym, że ktoś pamiętał wyciąć je z selecta.

create table company_verification (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references companies(id),
  nip text not null,
  telefon text not null,
  -- Wypełniane ręcznie przez moderację po sprawdzeniu w rejestrze.
  -- null znaczy „zgłoszone, jeszcze niesprawdzone”, nie „odrzucone”.
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pod pytanie „czy ten NIP zgłosił już ktoś inny”, zadawane przy moderacji.
--
-- Celowo NIE jest unikalny: ten sam przedsiębiorca prowadzi salę i catering
-- na jednym NIP-ie i oba wpisy mają prawo istnieć. Powtórzony NIP to sygnał
-- do sprawdzenia przez człowieka, nie błąd zapisu.
create index company_verification_nip_idx on company_verification(nip);

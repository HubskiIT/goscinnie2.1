-- Migracja 0007: tabela payment_intents dla integracji z PayU
-- Każda płatność ma rekord łączący zamówienie PayU z subskrypcją

create table payment_intents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  subscription_id uuid references subscriptions(id),
  payu_order_id text unique,
  amount integer not null,
  currency text not null default 'PLN',
  status text not null check (status in ('created', 'pending', 'completed', 'cancelled', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payment_intents_company_id_idx on payment_intents(company_id);
create index payment_intents_status_idx on payment_intents(status);

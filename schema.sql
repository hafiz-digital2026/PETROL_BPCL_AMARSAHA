-- Amar Saha BPCL Pump - Phase 1 schema. Run in Supabase > SQL Editor.
create table if not exists pump_settings (id int primary key default 1, data jsonb not null default '{}');
create table if not exists readings (
  id bigserial primary key, date date not null, shift text, nozzle text not null, product text,
  opening numeric(12,2), closing numeric(12,2), ltr numeric(10,2), rate numeric(8,2), amount numeric(12,2),
  created_at timestamptz default now());
create table if not exists shift_close (
  id bigserial primary key, date date not null, shift text, total_sale numeric(12,2), credit numeric(12,2),
  upi numeric(12,2), expected_cash numeric(12,2), cash_counted numeric(12,2), shortage numeric(12,2),
  created_at timestamptz default now());
create table if not exists parties (
  id bigserial primary key, name text not null, phone text, vehicle text, credit_limit numeric(12,2) default 0,
  created_at timestamptz default now());
create table if not exists party_txn (
  id bigserial primary key, party_id bigint references parties(id) on delete cascade, date date not null,
  type text check (type in ('credit','payment')), amount numeric(12,2) not null, note text,
  created_at timestamptz default now());
create index if not exists i_readings_date on readings(date);
create index if not exists i_txn_party on party_txn(party_id);

-- Only logged-in users can read/write
do $$ declare t text; begin
  foreach t in array array['pump_settings','readings','shift_close','parties','party_txn'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists auth_all on %I', t);
    execute format('create policy auth_all on %I for all to authenticated using (true) with check (true)', t);
  end loop; end $$;

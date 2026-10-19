-- Phase 2: run AFTER schema.sql in Supabase > SQL Editor
create table if not exists dips (id bigserial primary key, date date not null, tank text, product text, litres numeric(10,2), density numeric(6,4), created_at timestamptz default now());
create table if not exists purchases (id bigserial primary key, date date not null, product text, ltr numeric(10,2), rate numeric(8,2), amount numeric(12,2), invoice text, created_at timestamptz default now());
create table if not exists ledger_entries (id bigserial primary key, date date not null, book text check (book in ('cash','bank')), type text check (type in ('in','out')), category text, amount numeric(12,2) not null, note text, recon boolean default false, created_at timestamptz default now());
create index if not exists i_le_date on ledger_entries(date);
do $$ declare t text; begin
  foreach t in array array['dips','purchases','ledger_entries'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists auth_all on %I', t);
    execute format('create policy auth_all on %I for all to authenticated using (true) with check (true)', t);
  end loop; end $$;

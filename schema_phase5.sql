-- Phase 5: pakka lock (rate, opening, test), closed-by apne aap, lubricant, staff haazri/salary.
-- Run AFTER schema_phase4.sql. Dobara chalane me koi nuksaan nahi.

-- ===== Naye column =====
alter table shift_close add column if not exists lube numeric(12,2) default 0;
alter table shift_close add column if not exists closed_by_id uuid default auth.uid();

-- ===== Naye table =====
create table if not exists lube_items (id bigserial primary key, name text not null, unit text default 'pc', price numeric(10,2) not null default 0,
  gst numeric(5,2) default 18, low_qty numeric(10,2) default 5, active boolean default true, created_at timestamptz default now());
create table if not exists lube_txn (id bigserial primary key, item_id bigint references lube_items(id) on delete cascade, date date not null,
  type text check (type in ('purchase','sale','adjust')), qty numeric(10,2) not null, rate numeric(10,2) default 0, amount numeric(12,2) default 0,
  shift text, by_name text, created_at timestamptz default now());
create table if not exists staff (id bigserial primary key, name text not null, phone text, job text, salary numeric(12,2) default 0,
  active boolean default true, created_at timestamptz default now());
create table if not exists attendance (id bigserial primary key, staff_id bigint references staff(id) on delete cascade, date date not null,
  status text check (status in ('P','H','A','L')), marked_by text, created_at timestamptz default now(), unique(staff_id,date));
create table if not exists staff_pay (id bigserial primary key, staff_id bigint references staff(id) on delete cascade, date date not null,
  type text check (type in ('advance','salary','bonus')), amount numeric(12,2) not null, note text, by_name text, created_at timestamptz default now());
create index if not exists i_lt_item on lube_txn(item_id);
create index if not exists i_att_date on attendance(date);
create index if not exists i_rd_nozzle on readings(nozzle, date desc, id desc);

-- ===== RLS =====
do $$ declare t text; begin
  foreach t in array array['lube_items','lube_txn','staff','attendance','staff_pay'] loop
    execute format('alter table %I enable row level security',t);
  end loop; end $$;
-- lube: sab item dekh sakte (shift me bikri ke liye), badle owner/manager. Employee sirf 'sale' daal sakta.
select pol('lube_items','select',$$my_role() is not null$$), pol('lube_items','insert',$$my_role() in ('owner','manager')$$), pol('lube_items','update',$$my_role() in ('owner','manager')$$), pol('lube_items','delete',$$my_role()='owner'$$);
select pol('lube_txn','select',$$my_role() in ('owner','manager')$$), pol('lube_txn','insert',$$my_role() in ('owner','manager') or (my_role()='employee' and type='sale')$$), pol('lube_txn','update',$$my_role() in ('owner','manager')$$), pol('lube_txn','delete',$$my_role()='owner'$$);
-- staff: owner + manager
select pol(t,'select',$$my_role() in ('owner','manager')$$), pol(t,'insert',$$my_role() in ('owner','manager')$$), pol(t,'update',$$my_role() in ('owner','manager')$$), pol(t,'delete',$$my_role()='owner'$$)
  from unnest(array['staff','attendance','staff_pay']) as t;
-- Kharcha: employee shift ke kharche (cash out, "Shift ..." note) daal sake
select pol('ledger_entries','insert',$$my_role() in ('owner','manager') or (my_role()='employee' and book='cash' and type='out' and note like 'Shift %')$$);

-- ===== Pakka lock: nozzle reading =====
create or replace function readings_guard() returns trigger language plpgsql security definer set search_path=public as $$
declare r text := my_role(); cfg jsonb; lastc numeric; mx numeric; setr numeric;
begin
  if r is null then raise exception 'Aapka role set nahi hai'; end if;
  new.test_ltr := coalesce(new.test_ltr,0);
  if new.test_ltr < 0 then raise exception 'Test litre minus nahi ho sakta (%)', new.nozzle; end if;
  if new.closing < new.opening + new.test_ltr then raise exception 'Closing, opening+test se kam hai (%)', new.nozzle; end if;
  new.ltr := round(new.closing - new.opening - new.test_ltr, 2);
  new.amount := round(new.ltr * coalesce(new.rate,0), 2);
  if r <> 'owner' then
    select data into cfg from pump_settings where id = 1;
    mx := coalesce(nullif(cfg->>'test_max','')::numeric, 10);
    if new.test_ltr > mx then raise exception 'Test % L se zyada nahi ho sakta (%). Owner se baat karo.', mx, new.nozzle; end if;
    setr := coalesce(nullif(cfg->'rates'->>new.product,'')::numeric, 0);
    if coalesce(new.rate,0) <> setr then raise exception 'Rate sirf Owner badal sakta hai (% ka rate % hai). App reload karo.', new.product, setr; end if;
    if tg_op = 'INSERT' then
      select closing into lastc from readings where nozzle = new.nozzle order by date desc, id desc limit 1;
      if lastc is not null and lastc <> new.opening then
        raise exception 'Opening pichli closing (%) jaisi honi chahiye: %. App reload karo.', lastc, new.nozzle; end if;
    elsif new.opening <> old.opening or new.closing <> old.closing or coalesce(new.rate,0) <> coalesce(old.rate,0) or new.test_ltr <> coalesce(old.test_ltr,0) then
      raise exception 'Reading sirf Owner badal sakta hai';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists t_readings_guard on readings;
create trigger t_readings_guard before insert or update on readings for each row execute function readings_guard();

-- ===== Closed by: login wale ka naam apne aap =====
create or replace function shift_by() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is not null then
    new.closed_by_id := auth.uid();
    select coalesce(nullif(name,''), email) into new.closed_by from profiles where id = auth.uid();
  end if;
  return new;
end $$;
drop trigger if exists t_shift_by on shift_close;
create trigger t_shift_by before insert on shift_close for each row execute function shift_by();

-- ===== Supabase grants (30 Oct 2026 ke baad naye project ke liye zaroori) =====
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function my_role() to authenticated;
revoke all on all tables in schema public from anon;

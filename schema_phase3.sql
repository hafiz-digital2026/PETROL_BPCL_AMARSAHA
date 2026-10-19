-- Phase 3: Owner / Manager / Employee roles. Run AFTER schema.sql and schema_phase2.sql.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade, email text, name text,
  role text not null default 'employee' check (role in ('owner','manager','employee')),
  active boolean default true, created_at timestamptz default now());

create or replace function my_role() returns text language sql security definer stable set search_path=public as
$$ select case when active then role else null end from profiles where id = auth.uid() $$;

-- naya user apne aap 'employee' banta hai (sabse pehla user 'owner')
create or replace function new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into profiles(id,email,role) values (new.id,new.email, case when exists(select 1 from profiles) then 'employee' else 'owner' end) on conflict do nothing; return new; end $$;
drop trigger if exists on_new_user on auth.users;
create trigger on_new_user after insert on auth.users for each row execute function new_user();

-- purane users: sabse pehla (jisne account banaya) owner, baaki employee
insert into profiles(id,email,role)
  select id,email, case when row_number() over (order by created_at)=1 then 'owner' else 'employee' end from auth.users
  on conflict do nothing;

alter table profiles enable row level security;
drop policy if exists p_select on profiles; drop policy if exists p_update on profiles;
create policy p_select on profiles for select to authenticated using (id=auth.uid() or my_role()='owner');
create policy p_update on profiles for update to authenticated using (my_role()='owner') with check (my_role()='owner');

create or replace function pol(t text, cmd text, expr text) returns void language plpgsql as $$
begin
  execute format('drop policy if exists %I on %I','p_'||cmd,t);
  if cmd='insert' then execute format('create policy %I on %I for insert to authenticated with check (%s)','p_'||cmd,t,expr);
  else execute format('create policy %I on %I for %s to authenticated using (%s)','p_'||cmd,t,cmd,expr); end if;
end $$;

do $$ declare t text; begin
  foreach t in array array['pump_settings','readings','shift_close','parties','party_txn','dips','purchases','ledger_entries'] loop
    execute format('alter table %I enable row level security',t);
    execute format('drop policy if exists auth_all on %I',t);
  end loop; end $$;

-- pump_settings: sab padh sakte, sirf owner badle
select pol('pump_settings','select',$$my_role() is not null$$), pol('pump_settings','insert',$$my_role()='owner'$$), pol('pump_settings','update',$$my_role()='owner'$$);
-- readings: employee bhi entry kar sakta (opening ke liye padh bhi sakta)
select pol('readings','select',$$my_role() is not null$$), pol('readings','insert',$$my_role() is not null$$), pol('readings','update',$$my_role() in ('owner','manager')$$), pol('readings','delete',$$my_role()='owner'$$);
select pol('shift_close','select',$$my_role() in ('owner','manager')$$), pol('shift_close','insert',$$my_role() is not null$$), pol('shift_close','update',$$my_role() in ('owner','manager')$$), pol('shift_close','delete',$$my_role()='owner'$$);
select pol('parties','select',$$my_role() is not null$$), pol('parties','insert',$$my_role() in ('owner','manager')$$), pol('parties','update',$$my_role() in ('owner','manager')$$), pol('parties','delete',$$my_role()='owner'$$);
-- party_txn: employee sirf 'credit' (shift ki udhaar entry) daal sakta, balance nahi dekh sakta
select pol('party_txn','select',$$my_role() in ('owner','manager')$$), pol('party_txn','insert',$$my_role() in ('owner','manager') or (my_role()='employee' and type='credit')$$), pol('party_txn','update',$$my_role() in ('owner','manager')$$), pol('party_txn','delete',$$my_role()='owner'$$);
-- stock, purchase, cash/bank book: owner + manager
select pol(t,'select',$$my_role() in ('owner','manager')$$), pol(t,'insert',$$my_role() in ('owner','manager')$$), pol(t,'update',$$my_role() in ('owner','manager')$$), pol(t,'delete',$$my_role()='owner'$$)
  from unnest(array['dips','purchases','ledger_entries']) as t;

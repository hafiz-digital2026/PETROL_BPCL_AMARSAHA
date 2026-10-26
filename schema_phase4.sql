-- Phase 4 (HP pump): Test litre, PhonePe, HP card, kharcha, closed by. Run AFTER schema_phase3.sql.
-- Pehle chala chuke ho to dobara chalane me koi nuksaan nahi.
alter table readings add column if not exists test_ltr numeric(10,2) default 0;
alter table shift_close add column if not exists phonepe numeric(12,2) default 0;
alter table shift_close add column if not exists hpcard numeric(12,2) default 0;
alter table shift_close add column if not exists expense numeric(12,2) default 0;
alter table shift_close add column if not exists closed_by text;
alter table ledger_entries add column if not exists by_name text;

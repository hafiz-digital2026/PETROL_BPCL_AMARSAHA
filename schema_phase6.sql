-- v6.4: first opening of a nozzle (after reset/new nozzle) only by Owner. Run once in Supabase SQL Editor.
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
      if lastc is null then raise exception 'Pehli opening sirf Owner daal sakta hai (%). First opening must be entered by the Owner.', new.nozzle; end if;
      if lastc <> new.opening then
        raise exception 'Opening pichli closing (%) jaisi honi chahiye: %. App reload karo.', lastc, new.nozzle; end if;
    elsif new.opening <> old.opening or new.closing <> old.closing or coalesce(new.rate,0) <> coalesce(old.rate,0) or new.test_ltr <> coalesce(old.test_ltr,0) then
      raise exception 'Reading sirf Owner badal sakta hai';
    end if;
  end if;
  return new;
end $$;


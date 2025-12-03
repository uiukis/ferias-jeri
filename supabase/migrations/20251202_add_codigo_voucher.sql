alter table public.vouchers add column if not exists voucher_code varchar(20);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'voucher_code_format_chk'
      and conrelid = 'public.vouchers'::regclass
  ) then
    alter table public.vouchers
      add constraint voucher_code_format_chk
      check (voucher_code is null or voucher_code ~ '^#VC-[0-9]{6}-[0-9]{3}$');
  end if;
end $$;

create unique index if not exists vouchers_voucher_code_key on public.vouchers (voucher_code);

create or replace function public.gen_voucher_code(from_date timestamp with time zone)
returns text
language plpgsql
as $$
declare
  yyyymm text := to_char(from_date, 'YYYYMM');
  rand3 text := lpad(((random()*1000)::int)::text, 3, '0');
begin
  return '#VC-' || yyyymm || '-' || rand3;
end;
$$;

do $$
declare rec record; new_code text; tries int;
begin
  for rec in select id, created_at from public.vouchers where voucher_code is null loop
    tries := 0;
    loop
      new_code := public.gen_voucher_code(rec.created_at);
      begin
        update public.vouchers set voucher_code = new_code where id = rec.id;
        exit;
      exception when unique_violation then
        tries := tries + 1;
        if tries > 20 then
          raise exception 'Falha ao gerar código único para voucher %', rec.id;
        end if;
      end;
    end loop;
  end loop;
end $$;

-- Atualiza o formato de voucher_code para 'VC-YYYYMM-NNN' (sem '#')

-- Remover constraints antigas se existirem
alter table public.vouchers drop constraint if exists voucher_code_format_chk;
alter table public.vouchers drop constraint if exists codigo_voucher_format_chk;

-- Padronizar dados existentes para novo formato
update public.vouchers
set voucher_code = regexp_replace(voucher_code, '^#VC-', 'VC-')
where voucher_code like '#VC-%';

-- Se a coluna antiga existir, migrar dados e remover
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='vouchers' and column_name='codigo_voucher'
  ) then
    update public.vouchers
      set voucher_code = coalesce(voucher_code, regexp_replace(codigo_voucher, '^#VC-', 'VC-'))
      where voucher_code is null;
    alter table public.vouchers drop column codigo_voucher;
  end if;
end $$;

-- Constraint atualizada para novo formato
alter table public.vouchers
  add constraint voucher_code_format_chk
  check (voucher_code is null or voucher_code ~ '^VC-[0-9]{6}-[0-9]{3}$');

-- Índice único permanece
create unique index if not exists vouchers_voucher_code_key on public.vouchers (voucher_code);

-- Função geradora garantindo novo formato
create or replace function public.gen_voucher_code(from_date timestamp with time zone)
returns text
language plpgsql
as $$
declare
  yyyymm text := to_char(from_date, 'YYYYMM');
  rand3 text := lpad(((random()*1000)::int)::text, 3, '0');
begin
  return 'VC-' || yyyymm || '-' || rand3;
end;
$$;

-- Remove o prefixo '#' do código e atualiza a validação de formato

-- Garante que a coluna exista
alter table public.vouchers add column if not exists codigo_voucher varchar(20);

-- Remover constraint antiga, se existir
alter table public.vouchers drop constraint if exists codigo_voucher_format_chk;

-- Atualizar códigos existentes: #VC-YYYYMM-NNN -> VC-YYYYMM-NNN
update public.vouchers
set codigo_voucher = regexp_replace(codigo_voucher, '^#VC-', 'VC-')
where codigo_voucher like '#VC-%';

-- Constraint de formato atualizado (sem '#')
alter table public.vouchers
  add constraint codigo_voucher_format_chk
  check (codigo_voucher is null or codigo_voucher ~ '^VC-[0-9]{6}-[0-9]{3}$');

-- Função geradora atualizada para novo formato
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

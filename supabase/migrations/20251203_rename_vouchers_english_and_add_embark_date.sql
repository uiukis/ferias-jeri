-- Remove data_inicio/data_fim, add embark_date, and rename columns to English

-- 1) Add embark_date column and backfill from data_inicio if present
alter table if exists public.vouchers
  add column if not exists embark_date timestamptz;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'vouchers' and column_name = 'data_inicio'
  ) then
    update public.vouchers
      set embark_date = coalesce(data_inicio, created_at)
      where embark_date is null;
  else
    update public.vouchers
      set embark_date = coalesce(embark_date, created_at)
      where embark_date is null;
  end if;
end $$;

-- Ensure not null after backfill
alter table if exists public.vouchers
  alter column embark_date set not null;
alter table if exists public.vouchers
  alter column embark_date set default now();

-- 2) Drop obsolete columns if they exist
alter table if exists public.vouchers
  drop column if exists data_inicio;
alter table if exists public.vouchers
  drop column if exists data_fim;

-- 3) Rename columns to English (conditional)
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='vouchers' and column_name='passeio_nome') then
    alter table public.vouchers rename column passeio_nome to tour_name;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='vouchers' and column_name='cliente_nome') then
    alter table public.vouchers rename column cliente_nome to client_name;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='vouchers' and column_name='cliente_telefone') then
    alter table public.vouchers rename column cliente_telefone to client_phone;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='vouchers' and column_name='adultos') then
    alter table public.vouchers rename column adultos to adults;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='vouchers' and column_name='criancas') then
    alter table public.vouchers rename column criancas to children;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='vouchers' and column_name='local_embarque') then
    alter table public.vouchers rename column local_embarque to embark_location;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='vouchers' and column_name='horario_embarque') then
    alter table public.vouchers rename column horario_embarque to embark_time;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='vouchers' and column_name='valor_parcial') then
    alter table public.vouchers rename column valor_parcial to partial_amount;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='vouchers' and column_name='valor_no_embarque') then
    alter table public.vouchers rename column valor_no_embarque to embark_amount;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='vouchers' and column_name='observacao') then
    alter table public.vouchers rename column observacao to notes;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='vouchers' and column_name='codigo_voucher'
  ) then
    if not exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='vouchers' and column_name='voucher_code'
    ) then
      alter table public.vouchers rename column codigo_voucher to voucher_code;
    else
      update public.vouchers
        set voucher_code = coalesce(voucher_code, codigo_voucher);
      alter table public.vouchers drop column codigo_voucher;
    end if;
  end if;
end $$;

-- 4) Rename unique index and constraint for voucher code if they exist
alter index if exists public.vouchers_codigo_voucher_key rename to vouchers_voucher_code_key;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'codigo_voucher_format_chk'
      and conrelid = 'public.vouchers'::regclass
  ) then
    alter table public.vouchers rename constraint codigo_voucher_format_chk to voucher_code_format_chk;
  end if;
end $$;

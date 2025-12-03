-- ===========================================
-- BASE TABLES
-- ===========================================

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  role text not null default 'seller',
  created_at timestamptz default now()
);

create table if not exists vouchers (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  tour_name text not null,
  client_name text,
  client_phone text,
  adults integer default 1,
  children integer default 0,
  embark_location text,
  embark_time text,
  embark_date timestamptz not null default now(),
  partial_amount numeric(12,2) default 0,
  embark_amount numeric(12,2) default 0,
  notes text,
  status text default 'active',
  deleted boolean default false,
  deleted_at timestamptz,
  voucher_code varchar(20)
);

create table if not exists logs (
  id uuid primary key default gen_random_uuid(),
  ref_table text not null,
  ref_id uuid,
  action text not null,
  payload jsonb,
  user_id uuid,
  created_at timestamptz default now()
);

-- ===========================================
-- TRIGGER: CREATE PROFILE AFTER USER SIGNUP
-- ===========================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'seller')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Backfill profiles for existing auth.users
insert into public.profiles (id, email, role)
select u.id, u.email, 'seller'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- ===========================================
-- RLS ACTIVATION
-- ===========================================

alter table public.profiles enable row level security;
alter table public.vouchers enable row level security;
alter table public.logs enable row level security;
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references profiles(id),
  created_at timestamptz default now(),
  type text not null,
  title text not null,
  subtitle text,
  amount numeric(12,2),
  voucher_id uuid references vouchers(id),
  note text
);
alter table public.activities enable row level security;

-- ===========================================
-- FIXED: SAFE is_admin() FUNCTION (NO RECURSION)
-- ===========================================

drop function if exists public.is_admin cascade;

create or replace function public.is_admin()
returns boolean
language plpgsql
stable
as $$
begin
  return (auth.jwt() ->> 'role') = 'admin';
end;
$$;

-- ===========================================
-- POLICIES: PROFILES
-- ===========================================

-- Admin: full access
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- User: can read only himself
drop policy if exists "profiles_self_access" on public.profiles;
create policy "profiles_self_access"
on public.profiles
for select
to authenticated
using (id = auth.uid());

-- ===========================================
-- POLICIES: VOUCHERS
-- ===========================================

-- Admin: full access
drop policy if exists "vouchers_admin_all" on public.vouchers;
create policy "vouchers_admin_all"
on public.vouchers
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Seller: read own vouchers
drop policy if exists "vouchers_seller_select" on public.vouchers;
create policy "vouchers_seller_select"
on public.vouchers
for select
to authenticated
using (seller_id = auth.uid());

-- Seller: create own vouchers
drop policy if exists "vouchers_seller_insert" on public.vouchers;
create policy "vouchers_seller_insert"
on public.vouchers
for insert
to authenticated
with check (seller_id = auth.uid());

-- Seller: update own vouchers
drop policy if exists "vouchers_seller_update" on public.vouchers;
create policy "vouchers_seller_update"
on public.vouchers
for update
to authenticated
using (seller_id = auth.uid())
with check (seller_id = auth.uid());

-- ===========================================
-- POLICIES: LOGS
-- ===========================================

-- Only admins can view logs
create policy "logs_admin_select"
on public.logs
for select
to authenticated
using (public.is_admin());
-- ===========================================
-- POLICIES: ACTIVITIES
-- ===========================================

-- Admin: full access
drop policy if exists "activities_admin_all" on public.activities;
create policy "activities_admin_all"
on public.activities
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Seller: can read own activities
drop policy if exists "activities_seller_select" on public.activities;
create policy "activities_seller_select"
on public.activities
for select
to authenticated
using (seller_id = auth.uid());

-- Seller: can insert own activities
drop policy if exists "activities_seller_insert" on public.activities;
create policy "activities_seller_insert"
on public.activities
for insert
to authenticated
with check (seller_id = auth.uid());
-- End of schema

-- ===========================================
-- VOUCHERS: ADD codigo_voucher COLUMN AND BACKFILL
-- ===========================================

alter table if exists public.vouchers
  add column if not exists voucher_code varchar(20);

-- Unique index to guarantee code uniqueness
create unique index if not exists vouchers_voucher_code_key
  on public.vouchers (voucher_code);

-- Helper function: generate code based on a date and random 3-digit number
create or replace function public.gen_voucher_code(from_date timestamp with time zone)
returns text
language plpgsql
as $$
declare
  yyyymm text := to_char(from_date, 'YYYYMM');
  rand3 text := lpad(((random()*1000)::int)::text, 3, '0');
begin
  return 'VC-' || yyyymm || '-' || rand3;
end $$;

-- Backfill existing vouchers without code, ensuring uniqueness
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

-- ==========================================
-- VOUCHERS: ADD embark_date AND RENAME COLUMNS TO ENGLISH
-- ==========================================

alter table if exists public.vouchers
  add column if not exists embark_date timestamptz not null default now();

do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'vouchers' and column_name = 'passeio_nome') then
    alter table public.vouchers rename column passeio_nome to tour_name;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'vouchers' and column_name = 'cliente_nome') then
    alter table public.vouchers rename column cliente_nome to client_name;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'vouchers' and column_name = 'cliente_telefone') then
    alter table public.vouchers rename column cliente_telefone to client_phone;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'vouchers' and column_name = 'adultos') then
    alter table public.vouchers rename column adultos to adults;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'vouchers' and column_name = 'criancas') then
    alter table public.vouchers rename column criancas to children;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'vouchers' and column_name = 'local_embarque') then
    alter table public.vouchers rename column local_embarque to embark_location;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'vouchers' and column_name = 'horario_embarque') then
    alter table public.vouchers rename column horario_embarque to embark_time;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'vouchers' and column_name = 'valor_parcial') then
    alter table public.vouchers rename column valor_parcial to partial_amount;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'vouchers' and column_name = 'valor_no_embarque') then
    alter table public.vouchers rename column valor_no_embarque to embark_amount;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'vouchers' and column_name = 'observacao') then
    alter table public.vouchers rename column observacao to notes;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'vouchers' and column_name = 'codigo_voucher') then
    alter table public.vouchers rename column codigo_voucher to voucher_code;
  end if;
end $$;

-- ==========================================
-- VOUCHERS: REMOVER colunas data_inicio e data_fim
-- ==========================================

alter table if exists public.vouchers
  drop column if exists data_inicio;

alter table if exists public.vouchers
  drop column if exists data_fim;

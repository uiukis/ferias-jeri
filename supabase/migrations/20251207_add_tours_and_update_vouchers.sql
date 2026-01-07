-- Criação da tabela de passeios e atualização do schema de vouchers

-- 1) Criar tabela tours
create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz default now()
);

create unique index if not exists tours_name_key on public.tours (name);

-- RLS para tours
alter table public.tours enable row level security;
drop policy if exists "tours_admin_all" on public.tours;
create policy "tours_admin_all"
on public.tours
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "tours_seller_select" on public.tours;
create policy "tours_seller_select"
on public.tours
for select
to authenticated
using (active);

-- 2) Popular tours a partir dos vouchers existentes (nome antigo)
insert into public.tours (name)
select distinct trim(v.tour_name)
from public.vouchers v
where v.tour_name is not null and trim(v.tour_name) <> ''
on conflict (name) do nothing;

-- 3) Adicionar novas colunas em vouchers
alter table if exists public.vouchers
  add column if not exists tour_id uuid references public.tours(id);
alter table if exists public.vouchers
  add column if not exists passageiros text[];
alter table if exists public.vouchers
  add column if not exists apto text;

-- 4) Backfill tour_id com base em tour_name
update public.vouchers v
set tour_id = t.id
from public.tours t
where v.tour_id is null and t.name = v.tour_name;

-- 5) Backfill passageiros com client_name quando possível
update public.vouchers
set passageiros = array[client_name]
where (passageiros is null or array_length(passageiros, 1) is null or array_length(passageiros, 1) = 0)
  and client_name is not null and trim(client_name) <> '';

-- Definir placeholder quando não houver client_name
update public.vouchers
set passageiros = array['Pendente']
where passageiros is null or array_length(passageiros, 1) is null or array_length(passageiros, 1) = 0;

-- 6) Normalizar status para novo padrão
update public.vouchers set status = 'emitido' where status is null or status = 'active';
update public.vouchers set status = 'pago' where status = 'completed';
update public.vouchers set status = 'cancelado' where status = 'cancelled';
update public.vouchers set status = 'expirado' where status = 'expired';
alter table public.vouchers alter column status set default 'emitido';

-- 7) Restrições e remoção de coluna antiga
alter table public.vouchers alter column tour_id set not null;
alter table public.vouchers alter column passageiros set not null;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vouchers_passageiros_not_empty'
      and conrelid = 'public.vouchers'::regclass
  ) then
    alter table public.vouchers add constraint vouchers_passageiros_not_empty
      check (array_length(passageiros, 1) >= 1);
  end if;
end $$;

alter table if exists public.vouchers
  drop column if exists tour_name;


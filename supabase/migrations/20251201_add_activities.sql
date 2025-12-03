create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  type text not null,
  title text not null,
  subtitle text,
  amount numeric(12,2),
  voucher_id uuid references public.vouchers(id),
  note text
);

alter table public.activities enable row level security;

drop policy if exists "activities_admin_all" on public.activities;
create policy "activities_admin_all"
on public.activities
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "activities_seller_select" on public.activities;
create policy "activities_seller_select"
on public.activities
for select
to authenticated
using (seller_id = auth.uid());

drop policy if exists "activities_seller_insert" on public.activities;
create policy "activities_seller_insert"
on public.activities
for insert
to authenticated
with check (seller_id = auth.uid());


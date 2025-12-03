create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  template text not null,
  tag text unique not null,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.templates enable row level security;

-- Permite leitura de templates ativos sem autenticação
drop policy if exists "templates_public_select" on public.templates;
create policy "templates_public_select"
on public.templates
for select
to public
using (active = true);

-- Atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists templates_set_updated_at on public.templates;
create trigger templates_set_updated_at
before update on public.templates
for each row execute function public.set_updated_at();


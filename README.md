## Setup

1. Variáveis de ambiente (`.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<ANON_KEY>"
SUPABASE_SERVICE_ROLE_KEY=""
```

2. Instalar dependências:

```
npm install
npm run dev
```

3. Supabase: crie um projeto no painel e aplique o SQL em `supabase/schema.sql` pelo SQL Editor.

4. Usuários:

- Crie usuários no painel Auth.
- O gatilho cria `profiles` automaticamente com `role = 'seller'` por padrão.
- Altere `role` para `admin` diretamente na tabela `profiles` quando necessário.

## Testes

- Login: `app/(auth)/login`
- Listagem de vouchers (RLS): `app/test-supabase`
- Teste de políticas RLS: `app/test-rls`

## Proteção de Rotas

- `proxy.ts` protege `/admin`, `/seller`, `/dashboard` usando cookies `auth_uid` e `auth_role`.

## RLS e Roles

- A função `public.is_admin()` (em `supabase/schema.sql`) lê apenas o JWT: `(auth.jwt() ->> 'role') = 'admin'`.
- Após login, o app lê o JWT via `supabase.auth.getSession()` e grava `auth_role` nos cookies.
- Para promover um usuário a admin, rode `scripts/promote-admin.ts` (requer sessão do usuário) ou atualize o `role` no JWT via painel/admin.
- Logs: leitura liberada apenas para admin; insert permitido apenas via service role.

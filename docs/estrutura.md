# Estrutura, Stores e Mudanças

## Padrão de páginas

- `Page`: wrapper com `Suspense` e fallback de loading. Renderiza `PageInner`.
- `PageInner`: contém lógica de dados e UI específica da rota.

Aplicado em:
- `app/(auth)/login/page.tsx`
- `app/(seller)/dashboard/page.tsx`
- `app/(seller)/vouchers/page.tsx`
- `app/(seller)/vouchers/create/page.tsx`
- `app/(seller)/vouchers/[id]/page.tsx`

## Stores

- `auth`: necessário para persistência de sessão e controle global de usuário/role.
- `vouchers`: leitura via React Query; store mantida apenas para tipagem e seletores.
- Preferência por props drilling nas páginas e componentes (evita acoplamento e re-render global).

## Estados e dados

- React Query para listas e detalhes; estados locais reduzidos.
- URL sincroniza `page` e `pageSize` em `vouchers`.

## Validações

- Login com `zod` (`loginSchema`).
- Criação de voucher valida campos obrigatórios e mostra erros específicos.

## Tabelas e listas

- Tabela com loading interno, paginação e clique que redireciona.
- Lista mobile com animação de entrada e clique que redireciona.

## Animações

- `framer-motion` nos cards da lista (entrada lateral).
- Destaques visuais em elementos interativos.

## Storybook

- Não está instalado neste projeto. Recomenda-se adicionar posteriormente para documentar componentes.

## Testes

- Verificado redirecionamentos em desktop e mobile.
- Validações executadas nos formulários afetados.


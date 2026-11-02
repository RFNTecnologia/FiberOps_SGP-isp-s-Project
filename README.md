# FiberOps SGP ISP

Aplicação de operação de rede FTTH/ISP, construída com TanStack Start, React e TypeScript. O projeto também pode ser editado pelo [Lovable](https://lovable.dev).

## Desenvolvimento local

Requer Node.js e Bun.

```bash
bun install
bun run dev
```

Para gerar a versão de produção:

```bash
bun run build
```

## Supabase

As migrations do banco ficam em `supabase/migrations`. Configure as variáveis locais copiando `.env.example` para `.env`; esse arquivo não deve ser enviado ao Git. A chave `SUPABASE_SERVICE_ROLE_KEY` é exclusiva do servidor e nunca deve ser exposta no navegador.

Antes de aplicar migrations, confira se o projeto selecionado é o correto:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

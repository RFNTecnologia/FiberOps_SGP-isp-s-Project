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

## Executar com Docker

Crie o arquivo local de variáveis e inicie a aplicação:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
```

Acesse `http://localhost:3000`. Para parar os containers, execute `docker compose down`.

As variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_GOOGLE_MAPS_API_KEY` são usadas durante o build; refaça o build com `docker compose up --build` ao alterá-las. As demais variáveis do `.env` são fornecidas ao servidor em tempo de execução. Não inclua chaves secretas em variáveis `VITE_*`.

## Supabase

As migrations do banco ficam em `supabase/migrations`. Configure as variáveis locais copiando `.env.example` para `.env`; esse arquivo não deve ser enviado ao Git. A chave `SUPABASE_SERVICE_ROLE_KEY` é exclusiva do servidor e nunca deve ser exposta no navegador.

Antes de aplicar migrations, confira se o projeto selecionado é o correto:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

## Deploy no Vercel pelo GitHub

O workflow `.github/workflows/deploy.yml` publica a branch `main` no Vercel e também pode ser iniciado manualmente. Configure estes GitHub Actions Secrets no repositório:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Configure no projeto Vercel as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` para os ambientes Production e Preview que utilizar. Se alguma operação do servidor usar o cliente administrativo, configure também `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no Vercel; nunca coloque a service role key em variáveis `VITE_*` ou no GitHub.

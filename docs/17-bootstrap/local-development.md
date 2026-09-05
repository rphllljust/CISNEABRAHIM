# BOOT-DEV-001

| Campo       | Valor                 |
| ----------- | --------------------- |
| Document ID | Desenvolvimento local |
| Prompt      | 16                    |

## Setup inicial

```powershell
cd C:\CISNEABRAHIM
copy .env.example .env
npx pnpm@9.15.9 install
```

## Comandos (raiz)

| Comando                        | Ação                          |
| ------------------------------ | ----------------------------- |
| `npx pnpm@9.15.9 install`      | Instalar dependências         |
| `npx pnpm@9.15.9 lint`         | ESLint em api + web           |
| `npx pnpm@9.15.9 format:check` | Prettier check                |
| `npx pnpm@9.15.9 typecheck`    | `tsc` em todos os packages    |
| `npx pnpm@9.15.9 test`         | Vitest api + web              |
| `npx pnpm@9.15.9 build`        | Build api + web               |
| `npx pnpm@9.15.9 dev`          | API + Web em paralelo (turbo) |

## Apps individuais

```powershell
npx pnpm@9.15.9 --filter @cisne/api dev
npx pnpm@9.15.9 --filter @cisne/web dev
```

## Health check

```powershell
curl http://localhost:3000/health
```

Resposta esperada: `{ "status": "ok", "service": "api", "timestamp": "..." }`

## Variáveis

Ver `.env.example`. Sem `DATABASE_URL` ativo no bootstrap.

## IDE

TypeScript project references; ESLint flat config por app.

## Rascunho local

Arquivos temporários do projeto (dumps, auditoria SQL, worktree isolada, logs de agente) ficam em `C:\CISNEABRAHIM\tmp\` (ignorado pelo Git). Não usar `%TEMP%` nem `C:\Users\<usuario>\AppData\...`.

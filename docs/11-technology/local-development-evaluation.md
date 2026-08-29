# TECH-DEV-001

| Campo | Valor |
| --- | --- |
| Document ID | Avaliação desenvolvimento local |
| Prompt | 10 |

## Ambiente candidato

| Componente | Ferramenta | Notas |
| --- | --- | --- |
| Runtime | Node 24 LTS via nvm/fnm/volta | Pin `.node-version` futuro |
| Package manager | pnpm 9+ | Corepack enable |
| Banco local | PostgreSQL 18 Docker | `docker compose` futuro — não criar agora |
| API | NestJS dev watch | Porta TBD |
| Web | Vite dev server | Proxy API candidato |
| Env | `.env.example` | Sem secrets no repo |

## Docker Compose (futuro — não criar neste prompt)

```text
services:
  postgres:18-alpine
  # minio ou equivalente object storage — TECH-DDP-004
```

## Variáveis candidatas

| Var | Uso |
| --- | --- |
| DATABASE_URL | PostgreSQL |
| NODE_ENV | development |
| API_PORT | 3000 candidato |
| WEB_PORT | 5173 candidato Vite default |

## Seeds

Dados empresariais **não inventados** — seeds só após BR confirmadas.

## Windows

Workspace em `C:\CISNEABRAHIM` — paths; pnpm funciona; Docker Desktop candidato.

## Off-line

Sem requisito confirmado — PWA pendente.

## Documentação dev

README raiz atualizado na implementação (Prompt 11+), não neste prompt.

# BOOT-STRUCT-001

| Campo       | Valor                    |
| ----------- | ------------------------ |
| Document ID | Estrutura do repositório |
| Prompt      | 16                       |

```text
CISNEABRAHIM/
├── apps/
│   ├── api/          @cisne/api — NestJS 11 + Fastify (health only)
│   └── web/          @cisne/web — React 19 + Vite 7 (shell)
├── packages/
│   ├── eslint-config/ @cisne/eslint-config
│   └── tsconfig/      @cisne/tsconfig
├── docs/              documentação FOUNDATION (preservada)
├── package.json       scripts raiz + turbo
├── pnpm-workspace.yaml
├── turbo.json
├── pnpm-lock.yaml
├── .env.example
├── .node-version      24
└── AGENTS.md
```

## O que **não** existe

| Item                          | Prompt |
| ----------------------------- | ------ |
| `packages/db` / Drizzle       | 17     |
| Módulos BC (cliente, OS, PO…) | 24+    |
| Autenticação                  | 20     |
| Docker compose PG             | 17     |

## Apps

| App | Porta default | Endpoint      |
| --- | ------------- | ------------- |
| api | 3000          | `GET /health` |
| web | 5173          | SPA bootstrap |

## Pacotes compartilhados (justificados)

| Package       | Motivo                        |
| ------------- | ----------------------------- |
| tsconfig      | strict + references monorepo  |
| eslint-config | flat config única ADR quality |

Nenhum `shared-kernel` de domínio — sem regras empresariais.

# BOOT-P16-REP-001

| Campo       | Valor               |
| ----------- | ------------------- |
| Document ID | Relatório Prompt 16 |
| Prompt      | 16                  |
| Data        | 2026-08-29          |

## Escopo

Bootstrap técnico — primeira etapa com código e dependências. Sem módulos empresariais.

## Entregáveis

| Item                             | Status     |
| -------------------------------- | ---------- |
| Monorepo pnpm + Turbo            | Criado     |
| apps/api NestJS+Fastify          | Criado     |
| apps/web React+Vite              | Criado     |
| packages/tsconfig, eslint-config | Criado     |
| Health GET /health               | Criado     |
| Testes fundação (2)              | Criado     |
| .env.example                     | Criado     |
| docs/17-bootstrap/               | 6 arquivos |

## Quality gate

| Critério                  | Evidência                        | Resultado |
| ------------------------- | -------------------------------- | --------- |
| Stack ADR-TECH            | environment-prerequisites.md     | PASS      |
| Sem módulos empresariais  | 0 BC modules                     | PASS      |
| Sem banco empresarial     | 0 migrations                     | PASS      |
| Sem segredos              | .env.example only                | PASS      |
| `pnpm lint`               | turbo run lint                   | PASS      |
| `pnpm format:check`       | escopo código + bootstrap docs   | PASS      |
| `pnpm typecheck`          | turbo run typecheck              | PASS      |
| `pnpm test`               | 2 testes (api + web)             | PASS      |
| `pnpm build`              | nest build + vite build          | PASS      |
| `pnpm audit --audit-level critical` | 0 críticas             | PASS      |
| Prompt 17 não executado   | Sim                              | PASS      |

## Contagens

| Métrica                    | Valor |
| -------------------------- | ----- |
| Business modules           | 0     |
| Business tables            | 0     |
| Secrets committed          | 0     |
| Apps                       | 2     |
| Shared packages            | 2     |
| Pacotes resolvidos (lock)  | 1199  |
| Testes fundação            | 2     |

## Execução validação (2026-08-29)

| Comando        | Resultado |
| -------------- | --------- |
| `pnpm install` | OK        |
| `lint`         | PASS      |
| `format:check` | PASS      |
| `typecheck`    | PASS      |
| `test`         | PASS (2)  |
| `build`        | PASS      |

Runtime: Node **v24.14.0**. pnpm **9.15.9** via `npx` (global `corepack enable` EPERM nesta máquina).

## Restrições

- pnpm global bloqueado EPERM — usar `npx pnpm@9.15.9` ou instalação manual (BOOT-DEC-008)
- Drizzle/PostgreSQL não provisionados — adiado ao Prompt 17 (BOOT-DEC-007)
- `format:check` limitado a código e `docs/17-bootstrap/` — docs históricos fora do gate (BOOT-DEC-011)
- Formatação incidental em docs históricos ocorreu em tentativa inicial de `prettier --write .` — conteúdo preservado, apenas estilo

## Resultado

```text
PROMPT 16 RESULT: PASS_WITH_RESTRICTIONS
```

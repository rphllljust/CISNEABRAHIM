# BOOT-DEC-001

| Campo       | Valor                 |
| ----------- | --------------------- |
| Document ID | Decisões do bootstrap |
| Prompt      | 16                    |

| ID           | Decisão                             | Escolha                                | ADR              |
| ------------ | ----------------------------------- | -------------------------------------- | ---------------- |
| BOOT-DEC-001 | Monorepo layout                     | `apps/` + `packages/`                  | ADR-TECH-006     |
| BOOT-DEC-002 | API adapter                         | Fastify via `@nestjs/platform-fastify` | ADR-TECH-002     |
| BOOT-DEC-003 | Único endpoint                      | `GET /health` técnico                  | —                |
| BOOT-DEC-004 | Test runner                         | Vitest (api + web)                     | ADR-TECH-007     |
| BOOT-DEC-005 | ESLint                              | flat config + typescript-eslint strict | quality-tooling  |
| BOOT-DEC-006 | TS strict                           | `strict` + `noUncheckedIndexedAccess`  | version-policy   |
| BOOT-DEC-007 | Sem Drizzle/PG neste prompt         | Adiado                                 | ADR-TECH-004/005 |
| BOOT-DEC-008 | pnpm via npx se global indisponível | Documentado EPERM                      | ADR-TECH-006     |
| BOOT-DEC-009 | Nest CommonJS build                 | nest.json module CommonJS              | compat Nest 11   |
| BOOT-DEC-010 | Web ESM                             | `"type": "module"`                     | Vite 7 default   |
| BOOT-DEC-011 | Escopo Prettier                     | `apps/`, `packages/`, `docs/17-bootstrap/`, raiz | evitar gate em docs históricos |

## Não decidido / adiado

| Item                    | Prompt            |
| ----------------------- | ----------------- |
| Husky pre-commit        | opcional pós-CI   |
| Playwright E2E scaffold | quando UI módulos |
| Testcontainers          | Prompt 17+        |

## Desvios ADR

Nenhum — stack conforme Prompt 10.

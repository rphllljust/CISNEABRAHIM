# SEC-DEP-001

| Campo | Valor |
| --- | --- |
| Document ID | Segurança de dependências |
| Stack | pnpm + Turborepo (ADR-TECH) |
| Prompt | 14 |

## Política candidata

| # | Regra |
| --- | --- |
| 1 | Lockfile `pnpm-lock.yaml` commitado |
| 2 | `pnpm audit` no CI — fail on critical |
| 3 | Dependabot/Renovate candidato — weekly |
| 4 | Pin major versions; review minors |
| 5 | Proibir dependência abandonada (>2y) sem fork plan |

## Escopo scan

| Pacote | Prioridade |
| --- | --- |
| nestjs, fastify, drizzle | HIGH |
| react, vite | HIGH |
| transitive | audit tree |

## CVE response

| Severidade | SLA candidato |
| --- | --- |
| Critical | 72h patch ou mitigação |
| High | 2 semanas |
| Medium | próximo sprint |

## Licenças

Allowlist: MIT, Apache-2.0, BSD — review GPL contagion.

## Runtime

Node 24 LTS — seguir security releases.

## DevDependencies

eslint, vitest — scan igual; não deploy prod bundle devDeps.

## Ameaça indireta

Supply chain — ver supply-chain-security.md.

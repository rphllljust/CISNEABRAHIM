# TECH-RISK-REG-001

| Campo | Valor |
| --- | --- |
| Document ID | Registro de riscos tecnológicos |
| Total | 12 (TECH-RISK-001..012) |
| Prompt | 10 |

| ID | Risco | Prob. | Impacto | Mitigação | Revisão |
| --- | --- | --- | --- | --- | --- |
| TECH-RISK-001 | Node EOL sem upgrade | Média | Alta | version-policy LTS | Semestral |
| TECH-RISK-002 | TypeScript strict desligado | Média | Média | CI typecheck obrigatório | Implementação |
| TECH-RISK-003 | Migrations Drizzle quebram prod | Média | Crítica | Revisão manual; EP-019 | Por migration |
| TECH-RISK-004 | Queries N+1 | Alta | Média | Code review; logging | Sprint |
| TECH-RISK-005 | Nest over-engineering | Média | Média | Módulos só com BC real | ADR-002 |
| TECH-RISK-006 | Prisma creep se adotado ad-hoc | Baixa | Alta | ADR-TECH-005 proíbe | — |
| TECH-RISK-007 | Turborepo cache stale | Baixa | Média | `turbo run --force` em release | CI |
| TECH-RISK-008 | Vite bundle size | Média | Baixa | Code split; analyze | Pré-prod |
| TECH-RISK-009 | Playwright flaky E2E | Média | Média | Poucos testes; retries | CI |
| TECH-RISK-010 | Dependência vulnerável | Média | Alta | npm audit / Dependabot futuro | Semanal |
| TECH-RISK-011 | Equipe sem experiência Nest | ? | Média | Docs; pair; treino | TECH-DDP-008 |
| TECH-RISK-012 | PostgreSQL 18 infra indisponível | Baixa | Média | Fallback PG 17 documentado | Deploy |

## Herdados

ARCH-RISK-008 (stack antes domínio) — mitigado por Prompts 00–09 antes de código.

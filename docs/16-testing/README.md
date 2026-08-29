# QA-INDEX-001

| Campo | Valor |
| --- | --- |
| Document ID | Arquitetura de testes — índice |
| Fase | FOUNDATION — **sem código de teste** |
| Prompt | 15 |
| Stack candidata | Vitest + Playwright + Testcontainers PG (ADR-TECH-007) |

> Testes como **proteção de regras**, não meta de cobertura de linhas.

## Arquivos (25)

| Arquivo | Conteúdo |
| --- | --- |
| [test-strategy.md](./test-strategy.md) | Estratégia geral |
| [test-levels.md](./test-levels.md) | Pirâmide e níveis |
| [risk-based-testing.md](./risk-based-testing.md) | Priorização por risco |
| [requirement-test-traceability.md](./requirement-test-traceability.md) | **TEST-CAND-* matriz** |
| [domain-rule-test-catalog.md](./domain-rule-test-catalog.md) | INV / regras domínio |
| [state-machine-test-catalog.md](./state-machine-test-catalog.md) | SM / TR |
| [authorization-test-catalog.md](./authorization-test-catalog.md) | AUTHZ negativa |
| [database-constraint-tests.md](./database-constraint-tests.md) | UNQ/CHK + PG real |
| [transaction-tests.md](./transaction-tests.md) | TXN-TEST → TEST-CAND |
| [concurrency-tests.md](./concurrency-tests.md) | Corridas |
| [idempotency-tests.md](./idempotency-tests.md) | Dedup |
| [integration-contract-tests.md](./integration-contract-tests.md) | Contratos API/inbox |
| [security-tests.md](./security-tests.md) | SEC-TEST → TEST-CAND |
| [file-upload-tests.md](./file-upload-tests.md) | Upload |
| [recovery-tests.md](./recovery-tests.md) | Falha / rollback |
| [observability-tests.md](./observability-tests.md) | Logs / métricas |
| [performance-test-plan.md](./performance-test-plan.md) | Plano futuro |
| [frontend-test-strategy.md](./frontend-test-strategy.md) | UI / E2E |
| [test-data-strategy.md](./test-data-strategy.md) | Fixtures sintéticas |
| [test-environment-strategy.md](./test-environment-strategy.md) | Env / PG |
| [flaky-test-policy.md](./flaky-test-policy.md) | Flaky |
| [quality-gates-pipeline.md](./quality-gates-pipeline.md) | CI gates |
| [acceptance-test-catalog.md](./acceptance-test-catalog.md) | UC / aceite |
| [prompt-15-completeness-report.md](./prompt-15-completeness-report.md) | Relatório |

## Totais

| Artefato | Quantidade |
| --- | --- |
| TEST-CAND | 58 |
| INV com TEST-CAND | 22/22 |
| CMD críticos com TEST-CAND | 14/14 analisados TXN |
| SEC-TEST mapeados | 22/22 |
| TXN-TEST mapeados | 18/18 |
| TSC-AUTH mapeados | 18/18 |
| Requisitos sem cobertura explícita | 6 (ver relatório) |
| QA-RISK | 10 |

## Princípios

1. **PostgreSQL real** em integração — mocks não validam UNQ/CHK/FOR UPDATE.
2. **Negativo + corrida** em operações críticas financeiras e SoD.
3. **Dados sintéticos** — sem CPF/NF/cliente reais.
4. **Rastreabilidade** EV/BR/FR/UC/NFR/INV/CMD/TR/AUTHZ/RISK → TEST-CAND.

## Cadeia

```text
RISK/INV → TEST-CAND → nível (unit|int|e2e) → gate CI
```

# QA-UAT-002 — Registro de defeitos UAT

| Campo       | Valor              |
| ----------- | ------------------ |
| Document ID | QA-UAT-002         |
| Prompt      | 89                 |

## Defeitos abertos

_Nenhum defeito BLOCKER/CRITICAL aberto na execução Prompt 89._

| ID | Severidade | Status | Cenário | Resumo | Teste regressão |
| -- | ---------- | ------ | ------- | ------ | --------------- |
| — | — | — | — | — | — |

## Defeitos corrigidos neste ciclo

| ID | Severidade | Resumo | Regressão |
| -- | ---------- | ------ | --------- |
| UAT-FIX-001 | MAJOR | `beforeEach` integração UAT excedia hookTimeout 10s | `vitest.integration.config.ts` hookTimeout 120s |

## Política

- BLOCKER/CRITICAL **impedem** veredito APPROVED
- MAJOR/MINOR registrados com owner e prazo
- UX que enfraqueça regra crítica → **rejeitar** sem redesign de domínio

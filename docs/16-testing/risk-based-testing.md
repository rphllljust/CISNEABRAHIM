# QA-RBT-001

| Campo | Valor |
| --- | --- |
| Document ID | Testes baseados em risco |
| Prompt | 15 |

## Matriz risco × profundidade

| Risco / classe | Profundidade mínima | TEST-CAND exemplo |
| --- | --- | --- |
| DATA-RISK-011 dup NF/pagamento | L3 + L4 negativo + idempotency | 011, 012, 049 |
| TXN-FAIL lost update | L3 concorrência | 006, 033 |
| SEC-THR-015 custo API | L4 + SEC | 041, SEC-TEST-015 |
| INV CRITICAL | L1 + L3 ou L4 | 001–011 |
| SoD | L4 negativo | 021–028 |
| SM illegal | L1 | 030–032 |
| Integração falsa sucesso INV-016 | L4 inbox | 050 |
| Performance | L8 futuro | PERF-001 |

## Score candidato (Impacto × Probabilidade)

| Score | Ação |
| --- | --- |
| 9–12 | TEST-CAND obrigatório L3+L4+negativo |
| 6–8 | L4 mínimo |
| 3–5 | L1 ou monitoramento |
| 1–2 | Backlog |

## Operações críticas — obrigatório

| Operação | Negativo | Corrida | Idempotência |
| --- | --- | --- | --- |
| CMD-003 conversão | ✓ | ✓ | ✓ |
| CMD-005 liberar | ✓ | ✓ PO | ✓ |
| CMD-015 alocar | ✓ | ✓ | ✓ |
| CMD-017 medição | ✓ | — | ✓ |
| CMD-019 faturar | ✓ | ✓ | ✓ |
| CMD-020 nota | ✓ | — | ✓ |
| CMD-021 pagamento | ✓ | — | ✓ |

## Regressão

Qualquer mudança em INV, UNQ-CAND, AUTHZ, SM → rerodar TEST-CAND mapeados (requirement-test-traceability.md).

## Cobertura insuficiente aceita

Features GENERIC (notificação best-effort) — até ter SLAs NFR medidos.

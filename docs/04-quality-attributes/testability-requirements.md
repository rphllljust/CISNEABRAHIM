# QATTR-TEST-001

| Campo | Valor |
| --- | --- |
| Document ID | Testabilidade |
| Fonte | SRC-001 |
| Prompt | 03 |

> Estratégia de testes automatizados: Prompt 15 — **não** criar testes nesta etapa.

## Requisitos de testabilidade

| ID | Declaração | Artefato verificável | Status |
| --- | --- | --- | --- |
| TEST-REQ-001 | Cada NFR possui critério de validação ou cenário QA-SC | NFR-*; QA-SC-* | PENDING_SOURCE_VALIDATION |
| TEST-REQ-002 | Cenários de concorrência e idempotência testáveis sem números fixos | QA-SC-001..003 | PENDING_MEASUREMENT |
| TEST-REQ-003 | Cenários de autorização testáveis por matriz empresarial futura | QA-SC-007, QA-SC-017 | PENDING_BUSINESS_DECISION |
| TEST-REQ-004 | Restore testável em ambiente isolado | QA-SC-022 | PENDING_MEASUREMENT |
| TEST-REQ-005 | Separação AUDIT_TRAIL vs TECHNICAL_LOG verificável em revisão | QA-SC-023, QA-SC-027 | PENDING_SOURCE_VALIDATION |
| TEST-REQ-006 | Integração testável com mocks de falha externa | QA-SC-012 | PENDING_SOURCE_VALIDATION |

**Total TEST-REQ:** 6

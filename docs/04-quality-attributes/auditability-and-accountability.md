# QATTR-AUDIT-001

| Campo | Valor |
| --- | --- |
| Document ID | Auditabilidade e accountability |
| Fonte | SRC-001 |
| Prompt | 03 |

> **AUDIT_TRAIL** (negócio) ≠ **TECHNICAL_LOG** (engenharia).

## Separação de registros

| Tipo | Propósito | Exemplos candidatos | NFR |
| --- | --- | --- | --- |
| DOMAIN_HISTORY | Evolução de estado empresarial | Status de solicitação, OS, medição | NFR-006 |
| AUDIT_TRAIL | Quem fez o quê, quando, em ação empresarial | Liberação, decisão, substituição documental | NFR-006, NFR-029 |
| SECURITY_AUDIT | Tentativas de acesso negado, exportação, admin | Login falho, exportação de margem | SEC-REQ-024 |
| TECHNICAL_LOG | Diagnóstico de engenharia | Stack trace, request id | NFR-039 |
| METRIC | Agregação numérica | Contadores, latência | NFR-032 |
| TRACE | Correlação distribuída | ID transversal solicitação→faturamento | NFR-030 |
| ALERT | Condição que exige atenção | Conflito alocação, divergência | NFR-031 |

## Requisitos

| ID | Declaração | FR | Status |
| --- | --- | --- | --- |
| AUD-REQ-001 | Histórico de alterações da OS consultável | FR-022 | PENDING_SOURCE_VALIDATION |
| AUD-REQ-002 | Responsável atribuído rastreável | FR-015 | PENDING_SOURCE_VALIDATION |
| AUD-REQ-003 | Confirmação de recebimento registrada quando aplicável | FR-016 | PENDING_BUSINESS_DECISION |
| AUD-REQ-004 | Decisões sobre solicitação e medição registradas | FR-006, FR-037 | PENDING_BUSINESS_DECISION |
| AUD-REQ-005 | Substituição documental com versão anterior preservada | FR-042 | PENDING_SOURCE_VALIDATION |
| AUD-REQ-006 | Accountability não confundida com log técnico de debug | NFR-029 | PENDING_SOURCE_VALIDATION |

**Total AUD-REQ:** 6

# QATTR-CONC-001

| Campo       | Valor                       |
| ----------- | --------------------------- |
| Document ID | Concorrência e idempotência |
| Fonte       | SRC-001                     |
| Prompt      | 03                          |

> Sem escolha de optimistic/pessimistic locking ou nível de isolamento.

## Matriz por operação

| Operação              | FR     | CONCURRENCY_CLASS      | RETRY_SENSITIVITY         | Risco    | NFR     |
| --------------------- | ------ | ---------------------- | ------------------------- | -------- | ------- |
| Criar solicitação     | FR-001 | DEDUPLICATION_REQUIRED | IDEMPOTENCY_REQUIRED      | RISK-004 | NFR-002 |
| Converter solicitação | FR-009 | DEDUPLICATION_REQUIRED | UNIQUE_BUSINESS_OPERATION | RISK-004 | NFR-003 |
| Liberar OS            | FR-014 | EXCLUSIVE_RESOURCE     | UNIQUE_BUSINESS_OPERATION | RISK-022 | NFR-004 |
| Alocar recurso        | FR-025 | EXCLUSIVE_RESOURCE     | UNIQUE_BUSINESS_OPERATION | RISK-006 | NFR-005 |
| Registrar adicional   | FR-018 | OPTIMISTIC_CANDIDATE   | UNKNOWN                   | RISK-019 | NFR-015 |
| Concluir OS           | FR-019 | EXCLUSIVE_RESOURCE     | UNIQUE_BUSINESS_OPERATION | RISK-003 | NFR-001 |
| Submeter medição      | FR-036 | OPTIMISTIC_CANDIDATE   | IDEMPOTENCY_REQUIRED      | RISK-005 | NFR-013 |
| Aprovar medição       | FR-037 | OPTIMISTIC_CANDIDATE   | UNIQUE_BUSINESS_OPERATION | RISK-013 | NFR-013 |
| Preparar faturamento  | FR-038 | FINANCIAL_RACE         | UNIQUE_BUSINESS_OPERATION | RISK-005 | NFR-011 |
| Registrar nota        | FR-039 | FINANCIAL_RACE         | IDEMPOTENCY_REQUIRED      | RISK-004 | NFR-011 |
| Registrar pagamento   | —      | FINANCIAL_RACE         | IDEMPOTENCY_REQUIRED      | RISK-004 | —       |
| Substituir documento  | FR-042 | OPTIMISTIC_CANDIDATE   | UNIQUE_BUSINESS_OPERATION | RISK-008 | NFR-009 |
| Alterar OS (geral)    | FR-022 | OPTIMISTIC_CANDIDATE   | SAFE_REPEAT               | RISK-003 | NFR-001 |
| Consultar relatório   | UC-026 | NONE                   | SAFE_REPEAT               | —        | NFR-032 |

## Requisitos de idempotência

| ID           | Operação              | Sensibilidade             | Declaração                                                   | Status                    |
| ------------ | --------------------- | ------------------------- | ------------------------------------------------------------ | ------------------------- |
| IDEM-REQ-001 | Criar solicitação     | IDEMPOTENCY_REQUIRED      | Reenvio não deve criar solicitação duplicada não intencional | PENDING_SOURCE_VALIDATION |
| IDEM-REQ-002 | Converter solicitação | UNIQUE_BUSINESS_OPERATION | Uma conversão efetiva por solicitação                        | PENDING_SOURCE_VALIDATION |
| IDEM-REQ-003 | Comandos financeiros  | IDEMPOTENCY_REQUIRED      | Reenvio não deve duplicar cobrança ou pagamento candidato    | PENDING_BUSINESS_DECISION |
| IDEM-REQ-004 | Integração externa    | IDEMPOTENCY_REQUIRED      | Retentativas não devem duplicar efeito externo               | PENDING_SOURCE_VALIDATION |
| IDEM-REQ-005 | Upload de evidência   | SAFE_REPEAT               | Reenvio pode exigir deduplicação por hash — a definir        | PENDING_MEASUREMENT       |

**Total IDEM-REQ:** 5

## Decisão pendente

DDP-037 — Política de concorrência e idempotência por operação (mecanismo e limites).

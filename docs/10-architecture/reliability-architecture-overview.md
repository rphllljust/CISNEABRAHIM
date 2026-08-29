# ARCH-REL-001

| Campo       | Valor                                        |
| ----------- | -------------------------------------------- |
| Document ID | Visão geral de arquitetura de confiabilidade |
| NFR base    | NFR-025..028, NFR-001..005                   |
| Prompt      | 09                                           |

## Objetivos (TARGET_NOT_DEFINED)

| Métrica               | Status             |
| --------------------- | ------------------ |
| Disponibilidade (SLA) | TARGET_NOT_DEFINED |
| RPO                   | TARGET_NOT_DEFINED |
| RTO                   | TARGET_NOT_DEFINED |
| Latência p99          | TARGET_NOT_DEFINED |

## Estratégias candidatas

| Estratégia             | Aplicação                          |
| ---------------------- | ---------------------------------- |
| Transações ACID locais | WF-001, WF-004                     |
| Idempotência           | CMD-003, 020, 021 (NFR-011)        |
| Retry com backoff      | Integração BC-018                  |
| Dead letter queue      | Falhas notificação/sync            |
| Health checks          | API futura                         |
| Graceful degradation   | Reporting indisponível ≠ OS parada |

## Concorrência

| Área             | Estratégia candidata              |
| ---------------- | --------------------------------- |
| Liberação OS     | UNIQUE_BUSINESS_OPERATION         |
| Alocação recurso | EXCLUSIVE_RESOURCE                |
| Pagamento        | IDEMPOTENCY_REQUIRED              |
| Versão agregado  | Optimistic locking — ARCH-DDP-005 |

## Backup e recuperação

EP-020: backups testados — política não definida (ARCH-DDP-006).

## Observabilidade

| Sinal             | Uso                   |
| ----------------- | --------------------- |
| Métricas          | Latência CMD críticos |
| Traces            | Cross-module (futuro) |
| Logs técnicos     | Sem dados sensíveis   |
| Audit empresarial | NFR-029               |

## Falhas parciais

| Cenário           | Comportamento candidato                           |
| ----------------- | ------------------------------------------------- |
| Notificação falha | OS liberada permanece; retry SM-CAND-010          |
| Sync ERP falha    | Estado reconciliação BC-018                       |
| DB indisponível   | Falha total TOPO-002 — sem multi-master prematuro |

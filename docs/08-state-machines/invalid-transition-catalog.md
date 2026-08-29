# SM-INV-TR-001

| Campo       | Valor                            |
| ----------- | -------------------------------- |
| Document ID | Catálogo de transições inválidas |
| Total       | 22 (INV-TR-001..022)             |
| Prompt      | 07                               |

## SERVICE_REQUEST

| ID         | Origem     | Destino  | Motivo                  | Rejeição |
| ---------- | ---------- | -------- | ----------------------- | -------- |
| INV-TR-001 | REJEITADA  | APROVADA | Terminal sem reabertura | REJ-001  |
| INV-TR-002 | REGISTRADA | (OS)     | Sem CMD-003             | REJ-014  |
| INV-TR-003 | CANCELADA  | qualquer | Terminal                | REJ-007  |

## SERVICE_ORDER

| ID         | Origem    | Destino     | Motivo               | Rejeição           |
| ---------- | --------- | ----------- | -------------------- | ------------------ |
| INV-TR-004 | RASCUNHO  | LIBERADA    | Pula preparação      | REJ-002            |
| INV-TR-005 | RASCUNHO  | EM_EXECUCAO | Pula liberação       | REJ-004            |
| INV-TR-006 | LIBERADA  | CONCLUIDA   | Pula execução        | REJ-006            |
| INV-TR-007 | CONCLUIDA | CANCELADA   | Terminal conflitante | REJ-007            |
| INV-TR-008 | CANCELADA | LIBERADA    | Terminal             | REJ-007            |
| INV-TR-009 | CONCLUIDA | RASCUNHO    | Sem DDP-005          | GUARD-011          |
| INV-TR-010 | LIBERADA  | LIBERADA    | Dupla liberação      | REJ-002, GUARD-021 |

## ALLOCATION / EXECUTION

| ID         | Origem           | Destino      | Motivo                  |
| ---------- | ---------------- | ------------ | ----------------------- |
| INV-TR-011 | ALOCADA          | PLANEJADA    | Regressão não permitida |
| INV-TR-012 | SUBSTITUIDA      | ALOCADA      | Terminal                |
| INV-TR-013 | CONCLUIDA (exec) | NAO_INICIADA | Regressão               |
| INV-TR-014 | NAO_INICIADA     | CONCLUIDA    | Pula andamento          |

## MEASUREMENT / BILLING / INVOICE / PAYMENT

| ID         | Origem           | Destino           | Motivo                  |
| ---------- | ---------------- | ----------------- | ----------------------- |
| INV-TR-015 | APROVADA         | RASCUNHO          | Sem política correção   |
| INV-TR-016 | NAO_PREPARADO    | LIBERADO          | Pula preparação         |
| INV-TR-017 | BLOQUEADO        | REGISTRADA (nota) | GUARD-024               |
| INV-TR-018 | REGISTRADA       | RECEBIDO (pag)    | Pula registro pagamento |
| INV-TR-019 | RECEBIDO         | PENDENTE          | Sem estorno confirmado  |
| INV-TR-020 | CANCELADA (nota) | REGISTRADA        | Terminal                |

## NOTIFICATION / CROSS

| ID         | Origem                  | Destino     | Motivo             |
| ---------- | ----------------------- | ----------- | ------------------ |
| INV-TR-021 | ENTREGUE                | PENDENTE    | Terminal provedor  |
| INV-TR-022 | VIEWED (como estado OS) | EM_EXECUCAO | VIEWED não é STATE |

## Uso

Cenários de teste futuros em [state-machine-test-scenarios.md](./state-machine-test-scenarios.md).

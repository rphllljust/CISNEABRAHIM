# TXN-DEC-REG-001

| Campo       | Valor                             |
| ----------- | --------------------------------- |
| Document ID | Decisões transacionais candidatas |
| Total       | 14 (TXN-DEC-001..014)             |
| Prompt      | 13                                |

| ID          | Decisão                   | Alternativas                | Escolha candidata                         | Status   |
| ----------- | ------------------------- | --------------------------- | ----------------------------------------- | -------- |
| TXN-DEC-001 | Default isolation         | RC / RR / SER global        | **Read Committed**                        | PROPOSED |
| TXN-DEC-002 | Lost update OS            | OPT / PESS / ignorar        | **OPT row_version**                       | PROPOSED |
| TXN-DEC-003 | Alocação recurso          | OPT / PESS / SER            | **PESS** (FOR UPDATE ou advisory)         | PROPOSED |
| TXN-DEC-004 | Saldo PO                  | OPT / PESS                  | **PESS FOR UPDATE**                       | PROPOSED |
| TXN-DEC-005 | Conversão SR→OS           | Saga / TX local             | **TX local única**                        | PROPOSED |
| TXN-DEC-006 | Ordem locks               | Ad-hoc / documentada        | **PO→OS→resource→doc**                    | PROPOSED |
| TXN-DEC-007 | Idempotency store         | Só UNQ / tabela app         | **Ambos** — UNQ + record API              | PROPOSED |
| TXN-DEC-008 | Notificação pós liberação | Sync / AfterCommit / Outbox | **AfterCommit** fase 1; **Outbox** fase 2 | PROPOSED |
| TXN-DEC-009 | Outbox pattern            | Accept / Reject / Proposed  | **PROPOSED** BC-015/018 only              | PROPOSED |
| TXN-DEC-010 | Inbox dedup               | Accept / Reject             | **PROPOSED** BC-018 inbound               | PROPOSED |
| TXN-DEC-011 | CMD-019 isolation         | RC / RR                     | **RR** leitura medição                    | PROPOSED |
| TXN-DEC-012 | Retry serialization       | Nenhum / 3x backoff         | **3x exponencial** deadlock/SER           | PROPOSED |
| TXN-DEC-013 | Pagamento SoT             | Local / ERP                 | **PENDING** DDP-012                       | PENDING  |
| TXN-DEC-014 | Compensação financeira    | Auto / manual               | **Manual** até regra fonte                | PENDING  |

## Comparação locking por cenário (obrigatória)

| Cenário             | Optimistic  | Pessimistic | Decisão      |
| ------------------- | ----------- | ----------- | ------------ |
| Alterar OS          | ✓ preferido | ✗           | OPT          |
| Liberar OS (estado) | ✓           | opcional    | OPT          |
| PO saldo            | ✗           | ✓           | PESS         |
| Alocar recurso      | ✗           | ✓           | PESS         |
| Medição submit      | ✓           | —           | OPT + UNQ    |
| Faturamento         | parcial     | share lock  | RR/PESS leve |
| Nota/pagamento      | ✓           | —           | OPT + UNQ    |
| Nova versão doc     | —           | ✓ head      | PESS         |

## Relação ADR

| ADR                  | TXN-DEC            |
| -------------------- | ------------------ |
| ADR-004 consistência | 005, 008, 009, 010 |
| ADR-005 integração   | 009, 010, 013      |
| ARCH-DDP-004         | 009                |

## Revisão

Reavaliar TXN-DEC-008..010 após Prompt 16 bootstrap e primeiro spike integração.

## Não decidido aqui

- Broker mensageria
- RLS multi-tenant
- ULID vs UUID idempotency

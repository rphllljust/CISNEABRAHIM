# DM-RISK-001

| Campo       | Valor                     |
| ----------- | ------------------------- |
| Document ID | Riscos do modelo de dados |
| Total       | 12 (DATA-RISK-001..012)   |
| Prompt      | 12                        |

| ID            | Risco                                   | Prob. | Impacto | Mitigação candidata                     | Status |
| ------------- | --------------------------------------- | ----- | ------- | --------------------------------------- | ------ |
| DATA-RISK-001 | CARD-DDP abertas geram migration churn  | Alta  | Alto    | Fechar 001,002,004,007 antes DDL        | OPEN   |
| DATA-RISK-002 | UNQ prematura fixa cardinalidade errada | Média | Alto    | Marcar UNQ PENDING; migrations faseadas | OPEN   |
| DATA-RISK-003 | JSON em staging sem schema              | Média | Médio   | Colunas tipadas; staging efêmero        | OPEN   |
| DATA-RISK-004 | Saldo PO sem modelo consumo fechado     | Alta  | Alto    | CARD-DDP-002 + INV-012 CHK              | OPEN   |
| DATA-RISK-005 | Polimorfismo billable_item origin_ref   | Média | Médio   | CHECK type enum; validação app INV-007  | OPEN   |
| DATA-RISK-006 | Custo/margem em commercial_reference    | Média | Alto    | Authz BC-003; mascaramento API          | OPEN   |
| DATA-RISK-007 | Concorrência saldo PO                   | Média | Alto    | row_version + transação serializável?   | OPEN   |
| DATA-RISK-008 | FK cross-schema performance             | Baixa | Médio   | INDEX_HYPOTHESIS; evitar N+1            | OPEN   |
| DATA-RISK-009 | human_number colisão                    | Baixa | Médio   | UNQ escopo CARD-DDP-011                 | OPEN   |
| DATA-RISK-010 | Audit sem FK — órfãos referenciais      | Baixa | Baixo   | Validação app; tipo+id tipado           | OPEN   |
| DATA-RISK-011 | Duplicata NF/pagamento integração       | Média | Crítico | UNQ-CAND-007/008 + idempotency          | OPEN   |
| DATA-RISK-012 | Retenção indefinida — crescimento       | Média | Médio   | data-retention-pending.md               | OPEN   |

## Riscos herdados de fonte

| Fonte                         | Risco                                   |
| ----------------------------- | --------------------------------------- |
| SRC-001 não validado          | Regras PO/medição podem alterar tabelas |
| INV PENDING_BUSINESS_DECISION | 006, 010, 012, 017 sem constraint final |

## Bloqueios para implementação

| Condição                     | Efeito                  |
| ---------------------------- | ----------------------- |
| NOT_READY_FOR_IMPLEMENTATION | Permanece — FOUNDATION  |
| 4+ CARD-DDP críticas abertas | DDL físico adiado       |
| Sem volume TARGET            | Índices hipótese apenas |

## Não é risco aceito

Criar migrations neste prompt — **proibido** por escopo.

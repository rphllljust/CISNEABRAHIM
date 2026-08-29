# DM-INV-MAT-001

| Campo | Valor |
| --- | --- |
| Document ID | Matriz invariante × aggregate |
| Cobertura | 22/22 INV |
| Prompt | 11 |

| INV | Declaração | AGG primário | AGG secundário | Enforcement candidato |
| --- | --- | --- | --- | --- |
| INV-001 | 1 OS por solicitação | 001, 002 | — | Transação CMD-003 |
| INV-002 | Liberação elegível | 002 | — | Root OS |
| INV-003 | Sem duplicata solicitação | 001 | — | Idempotência |
| INV-004 | Alocação exclusiva | 003 | — | Lock recurso |
| INV-005 | Custo ≠ preço conceito | 011 | 002 (ref) | VO separados |
| INV-006 | Custo/margem authZ | 011 | — | Projeção API |
| INV-007 | Item faturável com origem | 007 | 006 | REF TERM-041 |
| INV-008 | Medição elegível | 006 | 004 | Guard |
| INV-009 | Medição não duplicada | 006 | — | Unique candidato |
| INV-010 | Pagamento não duplicado | 009 | — | Idempotency |
| INV-011 | Nota não duplicada | 008 | — | Unique key |
| INV-012 | PO saldo | 010 | 002 | ConsumoPO? |
| INV-013 | Versão preservada | 013 | — | Append version |
| INV-014 | Histórico append | 002 / 017 | — | MDDP-001 |
| INV-015 | Cancel ⊥ concluído | 002, 004 | — | SM guard |
| INV-016 | Integração honesta | 018 | todos | ACL |
| INV-017 | SoD medição | 006 | — | AuthZ |
| INV-018 | Não emitir NF-e | 008 | — | Policy |
| INV-019 | Sem lost update OS | 002 | — | Version |
| INV-020 | Execução exige liberada | 004 | 002 | REF+estado |
| INV-021 | Qty rastreável | 004 | 006 | REF |
| INV-022 | Ext id imutável | 011, 018 | — | ACL |

## Invariantes cross-aggregate

INV-001, INV-012, INV-020 exigem orquestração application layer ou transação local monolith — ADR-004.

## Sem aggregate atribuído

Nenhuma — todas mapeadas.

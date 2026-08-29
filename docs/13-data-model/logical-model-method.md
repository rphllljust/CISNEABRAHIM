# DM-LM-METHOD-001

| Campo | Valor |
| --- | --- |
| Document ID | Método de modelagem lógica relacional |
| Prompt | 12 |

## Objetivos

1. Traduzir AGG-CAND em tabelas candidatas **sem** colapsar aggregates.
2. Mapear INV → UNQ-CAND / CHK-CAND / FK.
3. Preparar Drizzle schema futuro — **não** escrever agora.
4. Separar audit, histórico, cancelamento e soft delete.

## Identificadores

| Tipo | Padrão |
| --- | --- |
| Tabela | TBL-CAND-NNN |
| Unicidade | UNQ-CAND-NNN |
| Check | CHK-CAND-NNN |
| Índice hipótese | IDX-HYP-NNN |

## Status tabela

`CANDIDATE` · `PENDING_BUSINESS_DECISION` · `PENDING_CARDINALITY` · `REJECTED`

## Regras

- Um schema lógico por módulo BC (modularity-strategy).
- FK cross-schema permitida como **referência**; write owner único (ADR-003).
- PK: UUID v7 candidato (`key-strategy.md`).
- JSON/JSONB: apenas metadados extensíveis documentados — não blob de domínio.
- Soft delete **não** universal — ver `soft-delete-and-cancellation.md`.
- Cancelamento = coluna/status + timestamp, registro permanece.
- Sem DDL neste prompt.

## Campos obrigatórios por TBL-CAND

Contexto owner · finalidade · AGG · chave · colunas · nulabilidade · constraints · refs · sensível · histórico · concorrência · retenção · volume · status.

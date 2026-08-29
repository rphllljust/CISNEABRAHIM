# DM-RISK-001

| Campo | Valor |
| --- | --- |
| Document ID | Riscos do modelo de domínio |
| Total | 12 (DM-RISK-001..012) |
| Prompt | 11 |

| ID | Risco | Impacto | Mitigação |
| --- | --- | --- | --- |
| DM-RISK-001 | OS aggregate inchado | Alto | Separar AGG-003..009 |
| DM-RISK-002 | Fundir solicitação+OS | Alto | AGG-001/002 separados |
| DM-RISK-003 | PO consumo mal modelado | Crítico | CARD-DDP-001/002 |
| DM-RISK-004 | Medição=faturamento | Crítico | AGG-006/007 separados |
| DM-RISK-005 | Documento no blob OS | Médio | AGG-013 |
| DM-RISK-006 | Money como number | Crítico | VO-CAND-006 |
| DM-RISK-007 | Qty sem unidade | Alto | VO-CAND-008 |
| DM-RISK-008 | Ext id como PK | Alto | identity-strategy |
| DM-RISK-009 | Histórico dentro OS transação | Médio | BC-017 |
| DM-RISK-010 | Cardinalidade assumida | Alto | CARD-DDP visíveis |
| DM-RISK-011 | Payment SoT errado | Crítico | DDP-012 |
| DM-RISK-012 | Entidade por tabela CRUD | Médio | modeling-method |

## Sinais revisão modelo

- CARD-DDP fechados com fonte
- Primeira implementação revela transação grande demais
- Invariante sem aggregate owner

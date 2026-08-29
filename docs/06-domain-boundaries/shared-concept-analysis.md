# DBND-SHARED-001

| Campo       | Valor                               |
| ----------- | ----------------------------------- |
| Document ID | Análise de conceitos compartilhados |
| Prompt      | 05                                  |

> Conceitos que aparecem em múltiplos contextos — risco de **SHARED_KERNEL** indevido.

| Conceito                          | TERM               | Contextos que referenciam         | Write owner                         | Estratégia candidata                         |
| --------------------------------- | ------------------ | --------------------------------- | ----------------------------------- | -------------------------------------------- |
| Identificador OS                  | TERM-002           | 006, 007, 008, 010, 011, 016, 017 | BC-CAND-006                         | ID imutável publicado; outros só referenciam |
| Identificador solicitação         | TERM-001           | 005, 006                          | BC-CAND-005                         | Referência após conversão                    |
| Cliente                           | TERM-004           | 002, 003, 005, 006                | BC-CAND-002                         | Referência; não duplicar cadastro            |
| Item de OS                        | TERM-040           | 006, 007, 008, 010                | BC-CAND-006 (estrutura)             | Itens planejados em 006; realizado em 008    |
| Quantidade planejada vs realizada | TERM-023, TERM-024 | 006, 008, 010                     | 006 plano / 008 real                | Normalização PLANNED≠ACTUAL                  |
| Preço / custo                     | TERM-020, TERM-021 | 003, 006                          | BC-CAND-003                         | Snapshot na OS vs referência viva — DBND-005 |
| Responsável                       | TERM-008           | 006, 008, 022                     | BC-CAND-006                         | Handoff DDP-032                              |
| Documento / evidência             | TERM-031, TERM-034 | 009, 014, 012                     | 014 arquivo / 009 metadado execução | Não fundir BCs                               |
| Evento auditoria                  | —                  | 017 + todos                       | BC-CAND-017                         | Consumo unidirecional                        |
| Identificador externo             | TERM-048           | 003, 004, 018                     | Origem externa via BC-018           | ACL                                          |

## Conceitos que **não** devem ser shared kernel

| Conceito              | Motivo                                        |
| --------------------- | --------------------------------------------- |
| Estado completo da OS | Evita acoplamento execução/medição/financeiro |
| Medição + faturamento | Ciclos e SoD distintos (BR-009, BR-014)       |
| PO + OS               | Cardinalidade pendente (DDP-009)              |

## Alternativas a SHARED_KERNEL

1. **Published ID + eventos** (preferido candidato).
2. **ACL** na integração (BC-018).
3. **Réplica read-only** em BC-016 Reporting.

Nenhum shared kernel aprovado neste prompt.

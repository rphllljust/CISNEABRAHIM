# DBEH-TEMP-001

| Campo       | Valor                       |
| ----------- | --------------------------- |
| Document ID | Regras temporais candidatas |
| Prompt      | 06                          |

| Regra                                      | Timestamp / evento | EV     | Status                   |
| ------------------------------------------ | ------------------ | ------ | ------------------------ |
| Registrado em — criação artefato           | TIMESTAMP          | EV-005 | CANDIDATE                |
| Liberado em — ato liberação                | TIMESTAMP          | EV-039 | CANDIDATE                |
| Visualizado em — consulta responsável      | TIMESTAMP / DE-006 | EV-073 | AMBIGUOUS                |
| Alterado em — histórico                    | TIMESTAMP          | EV-078 | CANDIDATE                |
| Aging operacional                          | METRIC             | EV-075 | PENDING — faixas DDP-024 |
| Ordenação DE-003 antes DE-004 antes DE-009 | causal             | —      | CANDIDATE                |
| Fuso horário operacional                   | —                  | —      | UNKNOWN                  |

Não inventar SLA temporal. Ver [temporal-rules.md](./temporal-rules.md) e Prompt 03 NFRs.

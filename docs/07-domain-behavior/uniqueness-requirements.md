# DBEH-UNIQ-001

| Campo       | Valor                               |
| ----------- | ----------------------------------- |
| Document ID | Requisitos de unicidade empresarial |
| Prompt      | 06                                  |

| Unicidade | Escopo                                    | INV     | Enforcement futuro candidato |
| --------- | ----------------------------------------- | ------- | ---------------------------- |
| UQ-001    | Uma OS efetiva por solicitação            | INV-001 | Vínculo 1:1                  |
| UQ-002    | Uma liberação efetiva por OS (ciclo)      | INV-002 | Estado terminal liberada     |
| UQ-003    | Alocação exclusiva por recurso/período    | INV-004 | Constraint temporal TBD      |
| UQ-004    | Medição por escopo item+período candidato | INV-009 | DDP-010                      |
| UQ-005    | Nota por origem faturamento               | INV-011 | Ref externa                  |
| UQ-006    | Pagamento por obrigação                   | INV-010 | Ref externa                  |
| UQ-007    | Versão documental monotônica              | INV-013 | Sequência versão             |
| UQ-008    | Identificador externo comercial único     | INV-022 | TERM-048                     |

Não especificar índice SQL — apenas requisito empresarial.

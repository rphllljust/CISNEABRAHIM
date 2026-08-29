# DBEH-REJ-001

| Campo | Valor |
| --- | --- |
| Document ID | Catálogo de razões de rejeição |
| Total | 18 (REJ-001..REJ-018) |
| Prompt | 06 |

> Razões **empresariais** estáveis — não mensagens técnicas (500, timeout, etc.).

| ID | Razão (empresarial) | CMD afetados | INV relacionada |
| --- | --- | --- | --- |
| REJ-001 | Solicitação já convertida em OS | CMD-003 | INV-001 |
| REJ-002 | OS não elegível para liberação | CMD-005 | INV-002 |
| REJ-003 | Ator sem autorização para liberar OS | CMD-005 | INV-002 |
| REJ-004 | Solicitação duplicada detectada | CMD-001 | INV-003 |
| REJ-005 | Recurso indisponível ou em conflito | CMD-015 | INV-004 |
| REJ-006 | Tentativa de expor custo a ator não autorizado | consultas | INV-006 |
| REJ-007 | Item faturável sem origem identificável | CMD-019 | INV-007 |
| REJ-008 | Medição duplicada ou escopo inválido | CMD-017 | INV-009 |
| REJ-009 | Pagamento duplicado para mesma obrigação | CMD-021 | INV-010 |
| REJ-010 | Documento de faturamento duplicado | CMD-020 | INV-011 |
| REJ-011 | Consumo de PO excede saldo autorizado | CMD-005, FR-033 | INV-012 |
| REJ-012 | Substituição documental inválida | CMD-022 | INV-013 |
| REJ-013 | Integração externa falhou — efeito local negado | sync | INV-016 |
| REJ-014 | Solicitação não decidida para conversão | CMD-003 | DDP-002 |
| REJ-015 | OS não liberada para execução | CMD-008 | INV-020 |
| REJ-016 | Medição sem execução elegível | CMD-017 | INV-008 |
| REJ-017 | Decisor de medição é o mesmo preparador | CMD-018 | INV-017 |
| REJ-018 | OS concluída e cancelamento solicitado | CMD-011 | INV-015 |

Cada REJ mapeia a resposta de negócio futura, não a código de erro HTTP.

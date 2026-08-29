# DM-DICT-001

| Campo       | Valor                      |
| ----------- | -------------------------- |
| Document ID | Dicionário lógico de dados |
| Escopo      | 25 tabelas TBL-CAND        |
| Prompt      | 12                         |

## Índice alfabético

| Tabela                       | AGG      | BC     | Descrição breve                    |
| ---------------------------- | -------- | ------ | ---------------------------------- |
| aud.domain_history_entry     | —        | BC-017 | Eventos históricos append-only     |
| bill.billable_item           | AGG-007  | BC-011 | Linha faturável com origem         |
| bill.billing_preparation     | AGG-007  | BC-011 | Preparação faturamento pós-medição |
| com.commercial_reference     | AGG-011  | BC-003 | Referência preço/custo comercial   |
| doc.document_version         | AGG-013  | BC-014 | Versão física do documento         |
| doc.logical_document         | AGG-013  | BC-014 | Identidade documental              |
| evd.evidence_link            | AGG-005  | BC-009 | Vínculo execução-documento         |
| exe.execution_record         | AGG-004  | BC-008 | Registro execução de OS            |
| exe.progress_entry           | AGG-004  | BC-008 | Entrada quantidade realizada       |
| int.external_id_mapping      | —        | BC-018 | Mapa ID externo ↔ interno          |
| int.integration_staging      | —        | BC-018 | Carga integração pendente          |
| inv.informed_invoice         | AGG-008  | BC-012 | NF informada (não emitida)         |
| msr.measurement              | AGG-006  | BC-010 | Medição para faturamento           |
| msr.measurement_line         | AGG-006  | BC-010 | Linha quantidade medida            |
| ntf.notification_delivery    | AGG-014  | BC-015 | Entrega notificação                |
| pay.payment_registration     | AGG-009  | BC-013 | Registro pagamento informado       |
| po.consumption_entry         | CARD-002 | BC-004 | Consumo saldo PO                   |
| po.purchase_order            | AGG-010  | BC-004 | Pedido compra                      |
| po.purchase_order_line       | AGG-010  | BC-004 | Linha PO                           |
| pty.party                    | AGG-012  | BC-002 | Parte contraparte                  |
| res.resource_allocation      | AGG-003  | BC-007 | Alocação recurso                   |
| so.planned_item              | AGG-002  | BC-006 | Item planejado OS                  |
| so.responsibility_assignment | MDDP-002 | BC-006 | Responsável OS                     |
| so.service_order             | AGG-002  | BC-006 | Ordem de serviço                   |
| sr.service_request           | AGG-001  | BC-005 | Solicitação intake                 |

## Entradas detalhadas

Detalhamento completo por tabela em [table-candidates.md](./table-candidates.md).

Semântica de colunas em [column-semantics.md](./column-semantics.md).

Constraints em [uniqueness-constraints.md](./uniqueness-constraints.md) e [check-constraints.md](./check-constraints.md).

## Termos de negócio

Alinhado a `docs/05-ubiquitous-language/` — OS ≠ Solicitação ≠ Medição ≠ Nota.

## Status global

Todas entradas: **CANDIDATE** ou **PENDING** conforme CARD-DDP/MDDP — nenhuma tabela FINAL.

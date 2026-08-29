# DM-REL-OVERVIEW-001

| Campo | Valor |
| --- | --- |
| Document ID | Visão relacional por módulo |
| Prompt | 12 |

## Schemas lógicos candidatos (PostgreSQL)

| Schema | BC | Tabelas principais |
| --- | --- | --- |
| `sr` | BC-005 | service_request |
| `so` | BC-006 | service_order, planned_item, responsibility? |
| `res` | BC-007 | resource_allocation |
| `exe` | BC-008 | execution_record, progress_entry |
| `evd` | BC-009 | evidence_link |
| `msr` | BC-010 | measurement, measurement_line |
| `bill` | BC-011 | billing_preparation, billable_item |
| `inv` | BC-012 | informed_invoice |
| `pay` | BC-013 | payment_registration |
| `doc` | BC-014 | logical_document, document_version |
| `com` | BC-003 | commercial_reference |
| `po` | BC-004 | purchase_order, po_line, po_consumption? |
| `pty` | BC-002 | party |
| `ntf` | BC-015 | notification_delivery |
| `aud` | BC-017 | domain_history_entry |
| `int` | BC-018 | external_id_mapping |

Nomes de schema **candidatos** — não criados no banco.

## Princípios

| Princípio | Aplicação |
| --- | --- |
| Ownership | Write apenas no schema do BC owner |
| Referência | FK ou ID sem FK cross-schema (debate ARCH-DDP) |
| Transação | CMD-003: `sr` + `so` mesma transação |
| Reporting | BC-016 lê via views — sem tabelas write |

## O que não está neste modelo

- Tabelas de autenticação IdP (BC-001) — TECH-DDP
- SECURITY_AUDIT store — app/infra
- Filas/workers

## Volume

TARGET_NOT_DEFINED — sem particionamento prematuro.

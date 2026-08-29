# DM-TEMP-001

| Campo | Valor |
| --- | --- |
| Document ID | Política de dados temporais |
| Prompt | 12 |

## Tipos

| Uso | Tipo PostgreSQL candidato |
| --- | --- |
| Instantâneos de evento | `timestamptz` (UTC storage) |
| Apenas data civil | `date` — se requisito fiscal exigir |
| Período | `valid_from` + `valid_to` — não usado até decisão |

## Convenção de colunas

| Sufixo | Significado |
| --- | --- |
| `registered_at` | Criação no sistema |
| `submitted_at` | Envio para decisão |
| `decided_at` | Decisão tomada |
| `released_at` | Liberação OS |
| `started_at` / `completed_at` | Execução |
| `cancelled_at` | Cancelamento empresarial |
| `linked_at` | Vínculo evidência |
| `published_at` / `superseded_at` | Versão documental |
| `occurred_at` | Evento histórico audit |

## Regras CHK temporais

| ID | Regra |
| --- | --- |
| CHK-CAND-013 | decided_at >= submitted_at |
| CHK-CAND-014 | completed_at >= started_at |
| CHK-CAND-009 | completed_at e cancelled_at mutuamente exclusivos |

## O que não usar

| Anti-padrão | Motivo |
| --- | --- |
| `timestamp without time zone` | Ambiguidade DST |
| Soft-delete via `deleted_at` | Ver soft-delete policy |
| Backdating sem auditoria | Requer domain_history_entry |

## Retenção

Ver `data-retention-pending.md` — sem TTL automático definido.

# Prompt 46 — Propostas comerciais (backend)

| Campo | Valor |
| ----- | ----- |
| **Status** | `EXECUTED` |
| **Executado em** | 2026-08-29 |
| **Commit** | `feat(commercial): implement versioned commercial proposals` |
| **Próximo passo autorizado** | Prompt 47 |

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| Proposal ≠ ServiceOrder / PurchaseOrder | **SIM** — agregado `com.proposals` próprio |
| ProposalVersion + ProposalItem | **SIM** — versionamento por revisão |
| GLOBAL_PRICE e ITEMIZED | **SIM** — preço global sem decomposição obrigatória |
| Emissão imutável + snapshot | **SIM** — `client_snapshot` + `service_snapshot` por item na emissão |
| Estados DRAFT/ISSUED/ACCEPTED/REJECTED/EXPIRED/CANCELLED | **SIM** — transições no domínio |
| Aceite com origem/evidência | **SIM** — `acceptanceOriginCode` obrigatório; PDF não implica aceite |
| Client, ServiceDefinition, Documents | **SIM** — FKs + `proposal_document_links` |
| Authz + escopo UNIT/CLIENT/GLOBAL | **SIM** — `commercial:proposal:*` |
| Audit trail | **SIM** — eventos de segurança em mutações |
| Prompt 47 executado | **NÃO** |

## Schema (`0016_commercial_proposals_baseline.sql`)

| Objeto | Descrição |
| ------ | --------- |
| `com.proposals` | Cabeçalho: código, cliente, unidade, título, versão corrente |
| `com.proposal_versions` | Revisão comercial, status, preços, termos, snapshots, aceite/rejeição |
| `com.proposal_items` | Linhas (material, mão de obra, equipamento, transporte, serviço) |
| `com.proposal_document_links` | Vínculo com `doc.documents` (ex.: evidência de aceite) |

## API (`/api/v1/commercial/proposals`)

| Método | Path | Ação |
| ------ | ---- | ---- |
| POST | `/` | Criar proposta + rascunho v1 |
| GET | `/` | Listar (escopo UNIT/CLIENT/GLOBAL) |
| GET | `/:id` | Detalhe com versão corrente |
| GET | `/:id/versions` | Histórico de revisões |
| GET | `/:id/versions/:vn` | Detalhe de revisão |
| PATCH | `/:id/versions/:vn` | Atualizar rascunho |
| POST | `/:id/versions` | Nova revisão a partir da corrente |
| POST | `/:id/versions/:vn/issue` | Emitir (snapshot) |
| POST | `/:id/versions/:vn/accept` | Aceitar (origem + evidência opcional) |
| POST | `/:id/versions/:vn/reject` | Rejeitar |
| POST | `/:id/versions/:vn/expire` | Expirar |
| POST | `/:id/versions/:vn/cancel` | Cancelar rascunho ou emitida |
| POST | `/:id/versions/:vn/documents` | Vincular documento |

## Cenário de teste (regularização de estrada)

- 280 m³ material, mão de obra, equipamentos, transporte
- R$ 96.000 preço global (`GLOBAL_PRICE`)
- Soma das linhas **não** exigida igual ao global
- Sem hardcode de nome de cliente no domínio

## Testes

- Unit: `proposal.validation.spec.ts`
- Persistence: `commercial-proposals.persistence.integration.spec.ts`
- Integration: draft, issue, version, accept, reject, expire, cancel, global/itemized, concurrency, authz, audit, documents
- E2E HTTP: create/issue/read, 401 anônimo, 403 cross-unit

## Quality gate

- [x] lint, typecheck, test, test:integration (proposals), test:e2e (proposals) — PASS
- [x] `@cisne/database` build — PASS
- [x] Prompt 47 não executado

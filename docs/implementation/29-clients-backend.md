# Prompt 29 — Módulo de Clientes: backend e persistência

**Status:** `EXECUTED`  
**Executado em:** 2026-08-29  
**Base Git:** `ec24085` (SRC-002 aprovado)  
**Pré-condição:** SRC-002 `LIBERADO` — `pnpm gate:src-002` → PASS

## Resultado

| Verificação | Resultado |
| ----------- | --------- |
| SRC-002 business gate | PASS |
| Technical quality gate | PASS |
| Módulo Clientes implementado | **SIM** |
| Exclusão física (DELETE) | **NÃO** — desativação lógica apenas |
| Cliente PF | **NÃO** — Release 1 PJ apenas |

## Operações HTTP (`/api/v1/clients`)

| Método | Rota | Capability | Descrição |
| ------ | ---- | ---------- | --------- |
| POST | `/clients` | `client:client:create` | Criar Cliente PJ |
| GET | `/clients` | `client:client:list` | Listar com paginação e filtro `status` |
| GET | `/clients/:clientId` | `client:client:read` | Consultar por ID |
| PATCH | `/clients/:clientId` | `client:client:update` | Alterar (optimistic locking via `version`) |
| POST | `/clients/:clientId/deactivate` | `client:client:deactivate` | Desativar (motivo obrigatório) |
| POST | `/clients/:clientId/activate` | `client:client:activate` | Reativar |

## Tabelas (`pty` schema)

| Tabela | Descrição |
| ------ | --------- |
| `pty.clients` | Cadastro PJ — `legal_name`, `normalized_tax_id` (único), `external_erp_id`, `status`, `version`, timestamps de desativação |
| `pty.client_contacts` | Contatos com `purpose` (operational/commercial/billing) |
| `pty.client_addresses` | Endereços com `purpose` (operational/billing/correspondence) |

Migration: `packages/database/migrations/0006_clients_baseline.sql`

## Regras empresariais implementadas (SRC-002)

| Regra | Implementação |
| ----- | ------------- |
| BR-026 | Módulo Clientes PJ Release 1 |
| BR-027 | CNPJ obrigatório |
| BR-028 | PF não suportado |
| BR-029 | CNPJ único + normalização (dígitos) |
| BR-030/031 | ID interno UUID; `externalErpId` opcional, nunca PK |
| BR-032 | Cliente = contraparte comercial |
| BR-033/036 | Sem DELETE físico; desativação preserva histórico |
| BR-034 | Capabilities `CLIENT_*` via grants GLOBAL/CLIENT |
| BR-035 | Empregado sem grant admin não administra |
| BR-037 | Status ACTIVE/INACTIVE (liberação OS = consumidor futuro) |

## Autorização

- Grants em `authorization.grants` com actions `client:client:*`
- Perfil de Controle: escopo `GLOBAL` (visão administrativa)
- Empregado: escopo `CLIENT` ancorado em `authorization.scope_refs` (criado automaticamente no cadastro)
- PDP + audit trail de decisões; security audit em create/update/deactivate/activate

## Testes

| Suite | Escopo |
| ----- | ------ |
| Unit | `cnpj.spec.ts`, `client.validation.spec.ts` |
| Integration | `clients.integration.spec.ts` — CRUD, unicidade, concorrência, cross-scope |
| E2E | `clients.e2e.spec.ts` — ciclo HTTP completo |
| Migration | `clients.persistence.integration.spec.ts` |
| Database guard | `database.integration.spec.ts` atualizado para schema `pty` |

## Quality gate (evidência)

- [x] `pnpm lint` — PASS
- [x] `pnpm typecheck` — PASS
- [x] `pnpm test` — PASS
- [x] `pnpm test:integration` — PASS
- [x] `pnpm --filter @cisne/api test:e2e` — PASS
- [x] `pnpm build` — PASS
- [x] `pnpm gate:src-002` — PASS

Prompt 30 não executado.

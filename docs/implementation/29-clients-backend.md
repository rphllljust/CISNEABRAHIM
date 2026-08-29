# Prompt 29 — Módulo de Clientes: backend e persistência

**Status:** `NOT_EXECUTED` — pré-condição não atendida  
**Executado em:** 2026-08-29  
**Base Git:** `9f7433f` (Prompt 28)

## Pré-condição

```text
Execute somente se o Prompt 28 declarou o módulo de Clientes pronto para implementação.
```

## Resultado da verificação

| Verificação | Resultado |
| ----------- | --------- |
| Prompt 28 — decisão global | `BLOCKED_AWAITING_BUSINESS_CONFIRMATION` |
| Módulo Clientes liberado | **NÃO** |
| SRC-002 preenchido e assinado | **NÃO** (`AWAITING_RESPONSE`) |
| Regras `CONFIRMED` para clientes | **0** |
| DDP-028 (dados mínimos de cliente) | `OPEN` |
| DDP-020 (Source of Truth — cliente) | `OPEN` |

Referência: [`28-business-readiness-gate.md`](./28-business-readiness-gate.md).

## Ação tomada

Nenhuma implementação foi realizada, conforme:

- instrução do Prompt 29 (pré-condição);
- `AGENTS.md` — não antecipar módulos empresariais sem validação;
- `AGENTS.md` — parada em bloqueio crítico (`NOT_READY_FOR_IMPLEMENTATION`).

## O que não foi criado

| Artefato | Status |
| -------- | ------ |
| Código (`apps/api`, `packages/database`) | Não criado |
| Migration de clientes | Não criada |
| Tabelas empresariais | 0 adicionais |
| Testes (unit, integração, E2E) | Não criados |
| Endpoints HTTP de clientes | Não criados |

## Desbloqueio necessário

1. Preencher e assinar [`../inputs/SRC-002-business-baseline-confirmation.md`](../inputs/SRC-002-business-baseline-confirmation.md) — seção **1. Dados mínimos de cliente**.
2. Registrar SRC-002 em `source-registry.md` e promover regras aplicáveis a `CONFIRMED`.
3. Responder DDP-028 e DDP-020 (cliente / SoT).
4. Reexecutar gate empresarial ou emitir decisão explícita liberando o módulo Clientes.

Prompt 30 não executado.

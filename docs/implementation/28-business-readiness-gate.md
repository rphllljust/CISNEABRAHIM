# Prompt 28 — Gate de validação empresarial antes dos módulos

Verificação de evidência empresarial suficiente para iniciar módulos de **Clientes, Recursos, Solicitações, OS, Execução, Medição, PO, Faturamento e Documentos**.

**Executado em:** 2026-08-29  
**Base Git:** `6ddbabc` (Prompt 27)  
**Decisão:** `BLOCKED_AWAITING_BUSINESS_CONFIRMATION`

## Distinção obrigatória

| Dimensão | Estado | Evidência |
| -------- | ------ | --------- |
| Fundação técnica | **PRONTA** (com restrições documentadas) | [`27-foundation-quality-gate.md`](./27-foundation-quality-gate.md) — `READY_WITH_RESTRICTIONS` |
| Domínio empresarial validado | **NÃO PRONTO** | 0 regras `CONFIRMED`; 0 fontes pós-SRC-001 assinadas |
| Implementação de módulos | **BLOQUEADA** | Aguarda SRC-002 ou fonte primária equivalente |

Fundação técnica pronta **não** autoriza modelar nem implementar regras de negócio.

## Fontes inspecionadas

| SOURCE-ID | Status | Pode provar regras operacionais? |
| --------- | ------ | -------------------------------- |
| SRC-000 | REGISTERED (governança) | **NO** |
| SRC-001 | `PENDING_BUSINESS_VALIDATION` | **NO** — contexto reconstruído, não primário |
| SRC-002 | `AWAITING_RESPONSE` (criado neste prompt) | **NO** — questionário vazio, sem assinatura |

**Fonte formal posterior a SRC-001, assinada e confirmada:** **NÃO EXISTE**.

Artefatos primários (`NOT_PROVIDED`): Documento Mestre, contratos, POs reais, NFs, transcrições, ERP, regras formais — ver [`source-registry.md`](../01-foundation/source-registry.md).

## Artefatos de domínio inspecionados

| Artefato | Local | Status consolidado |
| -------- | ----- | ------------------ |
| Regras empresariais | `business-rules-register.md` | 25 regras — **0 CONFIRMED** (CANDIDATE / PENDING_VALIDATION) |
| DDPs | `domain-decisions-pending.md` | **40 OPEN** — nenhuma resposta autorizada |
| Requisitos / UCs | `use-case-catalog.md`, `requirements-coverage.md` | 26 UCs, 42 FRs — **0 CONFIRMED** |
| Linguagem ubíqua | `docs/05-ubiquitous-language/` | Candidata — `ACCEPTED_FOR_DOCUMENTATION` ≠ confirmado |
| Bounded contexts | `context-map.md` | 18 BCs candidatos — nenhum FINAL |
| Invariantes | `invariant-register.md` | 22 invariantes — **0 CONFIRMED** |
| Estados | `service-order-state-machine.md` + SM-CAND-* | PARTIALLY_SUPPORTED / CANDIDATE |
| Autorização negócio | `authorization-decisions-pending.md` | 14 ADPs OPEN |
| Modelo de dados | `model-decisions-pending.md`, `erd-candidate.md` | 11 MDDPs OPEN; 0 aggregates FINAL |
| Conflitos de fonte | `source-conflicts.md` | 0 conflitos (insuficiente para validar — falta segundo polo normativo) |
| Gate técnico | `27-foundation-quality-gate.md` | PASS_WITH_RESTRICTIONS |

## Módulos alvo vs prontidão

| Módulo | Evidência mínima ausente | Bloqueio |
| ------ | ------------------------ | -------- |
| Clientes | Campos obrigatórios PJ, SoT Cliente, autorização | **Resolvido** — SRC-002 Prompt 29-A (DDP-041, DDP-020 CLIENT); assinatura pendente |
| Recursos | Mão de obra, equipamento, veículo, alocação | DDP-006, DDP-007, DDP-008, DDP-034 |
| Solicitações | Quem solicita, canal WhatsApp, conversão | DDP-002, DDP-021; **DDP-028 ANSWERED** |
| OS | Tipos, estados, criar/liberar, composição | DDP-001, DDP-003, DDP-022, DDP-029, DDP-035 |
| Execução | Estados, handoff, evidências | DDP-032, SM-CAND-* |
| Medição | Objeto, aprovador, evidência, SoD | DDP-010, INV-008, INV-017 |
| PO | Obrigatoriedade, cardinalidades, saldo | DDP-009 |
| Faturamento | Gatilho, fiscal, NF-e vs externo | DDP-011, DDP-023 |
| Documentos | Tipos, versões, aprovação | DDP-013, DDP-033 |
| Autorização negócio | Papéis, SoD, escopo | DDP-015, ADP-001..014 |

## Decisões bloqueantes (prioridade para desbloqueio)

| ID | Tema | Bloqueia |
| -- | ---- | -------- |
| DDP-026 | Escopo do primeiro release | Escopo de produto inteiro |
| DDP-001 | Tipos de OS | OS |
| DDP-002 | Fluxo de solicitação | Solicitações, OS |
| DDP-003 | Liberação da OS | OS, Execução |
| DDP-009 | PO e cardinalidades | PO, OS comercial |
| DDP-010 | Medição | Medição, Faturamento |
| DDP-011 | Faturamento | Faturamento |
| DDP-012 | Pagamento | Pagamento |
| DDP-013 | Documentos | Documentos |
| DDP-015 | Permissões | Autorização de negócio |
| DDP-020 | Source of Truth | Integrações, persistência definitiva |
| DDP-022 | Criar vs liberar OS (SoD) | OS, AuthZ |
| DDP-023 | Modo de emissão fiscal | Módulo fiscal |
| DDP-028 | Quem pode solicitar | Solicitações |
| DDP-029 | Prontidão para liberação | OS |
| DDP-037 | Concorrência/idempotência por operação | Implementação transacional |

Demais DDPs (004–008, 014, 016–019, 021, 024–025, 027, 030–036, 038–040) permanecem OPEN e reforçam o bloqueio por módulo afetado.

## Escopo do primeiro release

```text
UNKNOWN
```

Locação citada em SRC-001 como **prioridade candidata** (BR-020, EV-003) — **não confirmada** (DDP-026 OPEN).

## Ação deste prompt

| Ação | Resultado |
| ---- | --------- |
| Código empresarial criado | **NO** |
| Regras promovidas sem resposta | **NO** |
| Conflitos fabricados | **NO** |
| Questionário SRC-002 criado | **YES** — [`../inputs/SRC-002-business-baseline-confirmation.md`](../inputs/SRC-002-business-baseline-confirmation.md) |
| Source registry atualizado | **NO** — aguarda preenchimento e assinatura de SRC-002 |
| DDPs / regras atualizados | **NO** — aguarda resposta real |

## Próximo passo para desbloqueio

1. Responsável empresarial preenche e assina **SRC-002**.
2. Equipe registra SRC-002 em `source-registry.md` com status `RECEIVED` / `ANALYZED`.
3. Promover a `CONFIRMED` somente itens com resposta `CONFIRMED` ou `CONDITIONAL` com condições explícitas.
4. Atualizar DDPs correspondentes para `ANSWERED`.
5. Reexecutar gate (ou Prompt 29+) antes de implementar módulos.

Prompt 29 não executado.

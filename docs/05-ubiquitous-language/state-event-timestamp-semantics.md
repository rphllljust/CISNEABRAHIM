# UL-SEM-001

| Campo | Valor |
| --- | --- |
| Document ID | Semântica de estados, eventos e timestamps |
| Prompt | 04 |

> Estados definitivos e máquinas: Prompt 07 — **não** criados aqui.

## Classificação de candidatos (Prompt 01)

| Nome candidato | Tipo provável | Evidência | TERM / nota | Status |
| --- | --- | --- | --- | --- |
| ServiceRequestReceived | Evento | EV-027 | TERM-001 | CANDIDATE |
| ServiceOrderDraftCreated | Evento | EV-042 | TERM-009 | CANDIDATE |
| ServiceOrderReleased | Evento | EV-039 | TERM-010 | CANDIDATE |
| ResourceAllocated | Evento | EV-051 | TERM-030 | CANDIDATE |
| ItemMeasured | Evento | EV-062 | TERM-016 | CANDIDATE |
| DocumentVersionSuperseded | Evento | EV-082 | TERM-043 | CANDIDATE |
| ResponsibilityAssigned | Estado ou evento | EV-084 | TERM-008 | PENDING_DISAMBIGUATION |
| ItemViewed / Acknowledged | Estado ou evento | EV-084, EV-016 | — | PENDING_DISAMBIGUATION |
| Rascunho / Liberada / Em execução | Estado OS | EV-042, EV-039 | TERM-009, TERM-010 | PENDING_DISAMBIGUATION |

## Timestamps candidatos

| Conceito | Significado empresarial | Evidência |
| --- | --- | --- |
| Registrado em | Momento de criação de artefato | EV-005 |
| Visualizado em | Quando responsável viu OS | EV-016, EV-073 |
| Liberado em | Ato de liberação | EV-039 |
| Alterado em | Entrada no histórico | EV-078 |

Formato e fuso: **não** definidos (TARGET_PENDING).

## Regras lexicais

1. Evento = fato ocorrido (passado); Estado = condição vigente — não misturar sem classificação.
2. Timestamp de negócio (AUDIT_TRAIL) ≠ timestamp de log técnico.
3. Nomes em inglês na tabela são **candidatos** de evento (command-candidates / domain-event-candidates), não termos preferenciais.

## DDP

DDP-032 — Estados de responsabilidade e handoff.

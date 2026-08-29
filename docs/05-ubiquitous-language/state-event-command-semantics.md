# UL-SEM-002

| Campo | Valor |
| --- | --- |
| Document ID | Semântica de estado, evento, comando e timestamp |
| Prompt | 04 (revisão estrutural) |

> Máquinas candidatas: [`../08-state-machines/`](../08-state-machines/) (Prompt 07). Nenhuma definitiva.

## Matriz de análise (termos obrigatórios)

| Termo (EN candidato) | Estado de domínio | Evento | Comando | Timestamp | Métrica | Auditoria | Ambiguidade | Evidência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RELEASED | Candidato (OS liberada) | Candidato (ServiceOrderReleased) | Liberar OS | Liberado em | — | AUDIT_TRAIL | Critérios DDP-029 | EV-039 |
| ASSIGNED | Candidato | Candidato (ResponsibilityAssigned) | Atribuir responsável | Atribuído em | — | DOMAIN_HISTORY | Estado vs evento | EV-084 |
| DELIVERED | UNKNOWN | Candidato fraco | Entregar | — | — | — | Não formalizado | EV-045 |
| VIEWED | Candidato | Candidato | Visualizar OS | Visualizado em | — | DOMAIN_HISTORY | ≠ ACKNOWLEDGED | EV-073, EV-016 |
| ACKNOWLEDGED | Candidato | Candidato | Confirmar recebimento | Confirmado em | — | AUDIT_TRAIL | vs ACCEPTED | EV-016, EV-084 |
| ACCEPTED | UNKNOWN | Candidato | Aceitar | — | — | — | vs aprovar | EV-084 |
| STARTED | Candidato (em execução) | Candidato | Iniciar execução | Iniciado em | — | DOMAIN_HISTORY | — | EV-044 |
| PAUSED | UNKNOWN | UNKNOWN | Pausar | — | — | — | Sem evidência SRC-001 | — |
| COMPLETED | Candidato (terminal) | Candidato | Concluir OS | Concluído em | — | AUDIT_TRAIL | ≠ encerrar | EV-045 |
| CANCELLED | Candidato (terminal) | Candidato | Cancelar OS | Cancelado em | — | AUDIT_TRAIL | Exclusivo com COMPLETED | EV-046 |
| CLOSED | UNKNOWN | Candidato fraco | Encerrar | — | — | — | vs concluir | EV-045 |
| INVOICED | Candidato fraco | Candidato | Registrar faturamento | Faturado em | — | FINANCIAL | ≠ nota fiscal emitida | EV-064 |
| PAID | Candidato fraco | Candidato | Registrar pagamento | Pago em | — | FINANCIAL | SoT DDP-012 | EV-064 |

**State/event ambiguities registradas:** 8 (ASSIGNED, VIEWED, ACKNOWLEDGED, ACCEPTED, DELIVERED, CLOSED, PAUSED, INVOICED/PAID granularidade)

## Classificação de candidatos (Prompt 01)

| Nome candidato | Tipo provável | Evidência | TERM | Status |
| --- | --- | --- | --- | --- |
| ServiceRequestReceived | DOMAIN_EVENT | EV-027 | TERM-001 | ACCEPTED_FOR_DOCUMENTATION |
| ServiceOrderDraftCreated | DOMAIN_EVENT | EV-042 | TERM-009 | AMBIGUOUS |
| ServiceOrderReleased | DOMAIN_EVENT | EV-039 | TERM-010 | AMBIGUOUS |
| ResourceAllocated | DOMAIN_EVENT | EV-051 | TERM-030 | ACCEPTED_FOR_DOCUMENTATION |
| ItemMeasured | DOMAIN_EVENT | EV-062 | TERM-016 | AMBIGUOUS |
| DocumentVersionSuperseded | DOMAIN_EVENT | EV-082 | TERM-043 | ACCEPTED_FOR_DOCUMENTATION |
| ResponsibilityAssigned | UNKNOWN | EV-084 | TERM-008 | AMBIGUOUS |
| Rascunho / Liberada / Em execução | DOMAIN_STATE | EV-042, EV-039 | TERM-009, TERM-010 | AMBIGUOUS |

## Timestamps candidatos

| Conceito | Significado empresarial | Evidência | Tipo |
| --- | --- | --- | --- |
| Registrado em | Criação de artefato | EV-005 | TIMESTAMP |
| Visualizado em | Responsável viu OS | EV-016, EV-073 | TIMESTAMP |
| Liberado em | Ato de liberação | EV-039 | TIMESTAMP |
| Alterado em | Entrada no histórico | EV-078 | TIMESTAMP |

Formato e fuso: **TARGET_NOT_DEFINED**.

## Regras lexicais

1. Evento = fato ocorrido (passado); Estado = condição vigente — não concluir sem classificação.
2. Comando = intenção de mudança; não nomear comando como estado.
3. Timestamp de negócio (AUDIT_TRAIL / DOMAIN_HISTORY) ≠ timestamp de TECHNICAL_LOG.
4. Nomes em inglês são **candidatos** de engenharia futura, não termos preferenciais do glossário.

## DDP

DDP-032 — Estados de responsabilidade, handoff, VIEWED / ACKNOWLEDGED / ASSIGNED.

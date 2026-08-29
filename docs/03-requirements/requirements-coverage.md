# REQ-COV-001

| Campo | Valor |
| --- | --- |
| Document ID | Cobertura e rastreabilidade |
| Fonte | SRC-001 |
| Status documental | CANDIDATE — sem fonte primária |
| Gerado em | 2026-08-28 |
| Atualizado em | 2026-08-28 (auditoria corretiva Prompt 02) |
| Prompt | 02 |

> Requisitos derivados exclusivamente de SRC-001 (contexto reconstruído). Nenhum item `CONFIRMED`.
## Contagens

| Artefato | Total |
| --- | --- |
| FR | 42 |
| UC | 26 |
| AC | 52 |
| VR | 22 |
| AUTH-REQ | 20 |
| DR | 28 |
| DOC-REQ | 14 |
| NOTIF-REQ | 10 |
| INT-REQ | 8 |
| RPT-REQ | 12 |
| EX | 18 |
| RQ-QUESTION | 25 |
| EV utilizadas | 54 |
| BR referenciadas em FRs | 25 (candidatas) |

### Evidence → Requirement

- Evidências atômicas disponíveis (registro Prompt 01): **84** (EV-001..EV-084) — nenhuma omitida da auditoria
- Evidências com referência direta em linha `Evidências` de FR: **54**
- Evidências sem FR direto: **30** — permanecem rastreadas em `docs/02-source-analysis/atomic-evidence-register.md`; justificativa por categoria abaixo

#### EV sem FR direto (30) — justificativa

| Categoria | EV | Motivo |
| --- | --- | --- |
| Contexto organizacional e escopo (não gera FR operacional) | EV-001, EV-002, EV-003, EV-004 | Fato empresarial, lista de atividades e restrições de release — contexto em `01-foundation/`, não função transacional |
| Problemas as-is relatados (pain points, não capacidades) | EV-007, EV-008, EV-009, EV-010, EV-011, EV-012 | Situações problemáticas atuais; informam RQ/EX/RISK, não FR atômico autônomo |
| Lacunas de processo / decisão pendente | EV-014, EV-015, EV-018, EV-019, EV-020 | Abertura em `requirements-open-questions.md` e DDP; sem atomicidade suficiente para FR isolado |
| Solicitação — variantes absorvidas por FR-001..FR-007 | EV-024, EV-025, EV-026 | Cobertura indireta via FR de solicitação; EV permanecem no registro atômico |
| OS — capacidade futura genérica | EV-035, EV-037, EV-048 | Decompostas em FR-010..FR-014 e FR-023/FR-024 sem duplicar evidência na linha do FR |
| Relatórios / aging / visão agregada | EV-074, EV-075, EV-076 | Rastreadas em `reporting-requirements.md` (RPT-REQ), `use-case-catalog.md` (UC-026) e `business-capability-map.md` (CAP-023) |
| Integrações externas (lista candidata) | EV-077 | Rastreada em `integration-requirements.md` (INT-REQ-001..008), `notification-requirements.md` e VR-021 — `PENDING_EXTERNAL_DOCUMENTATION` |
| Escopo futuro / locação | EV-080 | `FUTURE_SCOPE_CANDIDATE` em `RQ-QUESTION-002`; não promovida a FR nesta etapa |
| Tipologia e governança documental | EV-081, EV-082, EV-083, EV-084 | Rastreadas em `document-requirements.md`, `business-capability-map.md` e questões abertas; meta ou transversal |

> **Nota:** ausência de linha `Evidências` em FR **não** significa omissão do registro atômico. As 84 EV permanecem em `atomic-evidence-register.md`. Uso em VR, AUTH, DR, DOC, NOTIF, INT, RPT, EX ou RQ complementa rastreabilidade sem inflar contagem de FR.

### Requirement → Use Case

- FRs com pelo menos um UC: 42
- FRs sem UC dedicado (transversais ou cobertos indiretamente): —

### Requirement → Acceptance Criteria

- FRs com AC: 42 de 42
- FRs sem AC: — (todos possuem pelo menos um AC vinculado)

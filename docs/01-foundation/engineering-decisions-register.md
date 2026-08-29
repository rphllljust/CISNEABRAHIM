# Engineering decisions register

| Campo | Valor |
| --- | --- |
| Document ID | ED-REG-001 |
| Source | SRC-000 |

Decisões de governança ED-001..004 estão `ACCEPTED`. Stack tecnológica documentada em ADR-TECH (Prompt 10); **implementação** (package.json, deps, infra) permanece NOT STARTED.

Template: [`../templates/engineering-decision-template.md`](../templates/engineering-decision-template.md).

Status: `PROPOSED`, `ACCEPTED`, `DEPRECATED`, `SUPERSEDED`, `REJECTED`.

## ED-001 — Documentação antes do código

| Campo | Valor |
| --- | --- |
| ID | ED-001 |
| Status | `ACCEPTED` |
| Decision | A baseline documental e a proveniência antecedem código funcional, schema e escolha de framework. |
| Why | Projeto transacional crítico; SRC-000 proíbe implementação nesta fase. |
| Consequences | Repositório inicia sem `package.json`, apps ou banco. |
| Date | 2026-08-28 |

## ED-002 — Um prompt por vez

| Campo | Valor |
| --- | --- |
| ID | ED-002 |
| Status | `ACCEPTED` |
| Decision | Executar somente o prompt atual; não encadear o seguinte automaticamente; exigir revisão antes de avançar. |
| Why | Controlar escopo, evidência e rollback intelectual. |
| Date | 2026-08-28 |

## ED-003 — Rastreabilidade obrigatória

| Campo | Valor |
| --- | --- |
| ID | ED-003 |
| Status | `ACCEPTED` |
| Decision | Artefatos de requisito, regra, decisão, implementação futura e teste seguem a cadeia SOURCE → … → ACCEPTANCE. Lacunas = `TBD`, nunca invenção. |
| Policy | [`../00-governance/traceability-policy.md`](../00-governance/traceability-policy.md) |
| Date | 2026-08-28 |

## ED-004 — Stack documentada; implementação não iniciada

| Campo | Valor |
| --- | --- |
| ID | ED-004 |
| Status | `ACCEPTED` (atualizado Prompt 10) |
| Decision | Stack tecnológica **documentada** em ADR-TECH-001..007 (`docs/11-technology/`). Código, `package.json`, dependências instaladas e infra provisionada permanecem **NOT STARTED** até prompt de implementação autorizado. |
| Why | Prompt 10 seleciona e justifica; não instala. Cloud provider continua não escolhido. |
| Supersedes parcialmente | Texto original ED-004 que remetia stack ao Prompt 10 sem decisão |
| Date | 2026-08-28 (atualização) |

## ADRs tecnológicos (Prompt 10)

Ver [`../11-technology/adr/`](../11-technology/adr/) — ADR-TECH-001..007, todos `ACCEPTED`.

## Não decidido (exemplos explícitos)

Cloud provider, IdP, object storage, message broker, CI platform: **não decidido** — ver TECH-DDP em [`../11-technology/technology-decisions-pending.md`](../11-technology/technology-decisions-pending.md).

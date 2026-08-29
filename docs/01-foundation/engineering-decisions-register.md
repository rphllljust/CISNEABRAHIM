# Engineering decisions register

| Campo | Valor |
| --- | --- |
| Document ID | ED-REG-001 |
| Source | SRC-000 |

Somente decisões **desta etapa** estão `ACCEPTED`. Decisões de stack, arquitetura de runtime, banco e UI permanecem não tomadas.

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

## ED-004 — Ausência de tecnologia definitiva neste momento

| Campo | Valor |
| --- | --- |
| ID | ED-004 |
| Status | `ACCEPTED` |
| Decision | Não escolher stack, arquitetura de implantação, ORM, banco, broker ou framework de UI nesta fase. `.editorconfig` é neutro. |
| Why | Tecnologia não deve congelar domínio não descoberto. Escolha remetida ao Prompt 10 (preliminar) ou equivalente futuro. |
| Date | 2026-08-28 |

## Não decidido (exemplos explícitos)

Linguagem, monorepo vs polirepo, Postgres vs outro, Nest vs outro, React vs outro: **não decidido**. ADRs fundamentais em [`../10-architecture/adr-index.md`](../10-architecture/adr-index.md) (Prompt 09); stack runtime aguarda prompts posteriores.

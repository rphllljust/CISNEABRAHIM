# Engineering decisions register

| Campo       | Valor      |
| ----------- | ---------- |
| Document ID | ED-REG-001 |
| Source      | SRC-000    |

Decisões de governança ED-001..004 estão `ACCEPTED`. ED-005 (Release 1 fail-closed) `ACCEPTED` em 2026-09-02. Stack tecnológica documentada em ADR-TECH (Prompt 10).

Template: [`../templates/engineering-decision-template.md`](../templates/engineering-decision-template.md).

Status: `PROPOSED`, `ACCEPTED`, `DEPRECATED`, `SUPERSEDED`, `REJECTED`.

## ED-001 — Documentação antes do código

| Campo        | Valor                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------- |
| ID           | ED-001                                                                                            |
| Status       | `ACCEPTED`                                                                                        |
| Decision     | A baseline documental e a proveniência antecedem código funcional, schema e escolha de framework. |
| Why          | Projeto transacional crítico; SRC-000 proíbe implementação nesta fase.                            |
| Consequences | Repositório inicia sem `package.json`, apps ou banco.                                             |
| Date         | 2026-08-28                                                                                        |

## ED-002 — Um prompt por vez

| Campo    | Valor                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| ID       | ED-002                                                                                                     |
| Status   | `ACCEPTED`                                                                                                 |
| Decision | Executar somente o prompt atual; não encadear o seguinte automaticamente; exigir revisão antes de avançar. |
| Why      | Controlar escopo, evidência e rollback intelectual.                                                        |
| Date     | 2026-08-28                                                                                                 |

## ED-003 — Rastreabilidade obrigatória

| Campo    | Valor                                                                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| ID       | ED-003                                                                                                                                         |
| Status   | `ACCEPTED`                                                                                                                                     |
| Decision | Artefatos de requisito, regra, decisão, implementação futura e teste seguem a cadeia SOURCE → … → ACCEPTANCE. Lacunas = `TBD`, nunca invenção. |
| Policy   | [`../00-governance/traceability-policy.md`](../00-governance/traceability-policy.md)                                                           |
| Date     | 2026-08-28                                                                                                                                     |

## ED-004 — Stack documentada; implementação não iniciada

| Campo                   | Valor                                                                                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID                      | ED-004                                                                                                                                                                                                                  |
| Status                  | `ACCEPTED` (atualizado Prompt 10)                                                                                                                                                                                       |
| Decision                | Stack tecnológica **documentada** em ADR-TECH-001..007 (`docs/11-technology/`). Código, `package.json`, dependências instaladas e infra provisionada permanecem **NOT STARTED** até prompt de implementação autorizado. |
| Why                     | Prompt 10 seleciona e justifica; não instala. Cloud provider continua não escolhido.                                                                                                                                    |
| Supersedes parcialmente | Texto original ED-004 que remetia stack ao Prompt 10 sem decisão                                                                                                                                                        |
| Date                    | 2026-08-28 (atualização)                                                                                                                                                                                                |

## ADRs tecnológicos (Prompt 10)

Ver [`../11-technology/adr/`](../11-technology/adr/) — ADR-TECH-001..007, todos `ACCEPTED`.

## ED-005 — Feature flags fail-closed para módulos fora da Release 1

| Campo                 | Valor                                                                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID                    | ED-005                                                                                                                                                         |
| Title                 | Feature flags fail-closed para superfície fora da Release 1                                                                                                    |
| Status                | `ACCEPTED`                                                                                                                                                     |
| Decision              | Módulos `OUT_OF_RELEASE_1` só são expostos se a flag de ambiente for exatamente `true`. Ausência, vazio ou qualquer outro valor = desligado. A API é o boundary; navegação e rotas web não autorizam acesso. |
| Why                   | Impedir uso operacional de financeiro, fiscal oficial, contábil e demais módulos incompletos sem expandir o escopo da Release 1.                               |
| Consequences          | 403 `FEATURE_DISABLED` nas rotas HTTP do módulo; item de navegação e deep-link removidos/bloqueados; `.env.example` não liga flags.                            |
| Alternatives rejected | Fail-open; esconder só no frontend; apagar código dos módulos incompletos.                                                                                     |
| SOURCE / prompt       | Prompt autorizado 2026-09-02; R1-SCOPE-001; DDP-026; DDP-023                                                                                                   |
| Date                  | 2026-09-02                                                                                                                                                     |
| Revisit when          | Autorização explícita de um módulo posterior com fonte e flag nomeada.                                                                                         |

## Não decidido (exemplos explícitos)

Cloud provider, IdP, object storage, message broker, CI platform: **não decidido** — ver TECH-DDP em [`../11-technology/technology-decisions-pending.md`](../11-technology/technology-decisions-pending.md).

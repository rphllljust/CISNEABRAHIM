# DM-AUDIT-001

| Campo | Valor |
| --- | --- |
| Document ID | Modelagem auditoria e histórico |
| TERM | TERM-044 |
| Prompt | 11 |

## Separação (EP-007, EP-008)

| Trilha | Artefato | Aggregate? |
| --- | --- | --- |
| DOMAIN_HISTORY | ENTITY-CAND-025 EntradaHistóricoDomínio | Append-only BC-017 |
| SECURITY_AUDIT | Log estruturado | Não AGG cliente |
| TECHNICAL_LOG | Infra | Não domínio |

## DOMAIN_HISTORY

| Campo | Valor |
| --- | --- |
| Produtor | Eventos DE-* de cada BC |
| Consumidor | UI histórico OS; compliance |
| Mutável | **Não** — append |
| Dentro AGG-002? | MDDP-001 — favorece BC-017 separado |

## O que registrar

| Evento | Incluir em DOMAIN_HISTORY? |
| --- | --- |
| DE-004 OS liberada | Sim |
| DE-006 visualizada | Opcional / AUDIT only |
| DE-011 concluída | Sim |
| DENY authZ | SECURITY_AUDIT only |

## ENTITY-CAND-004 vs 025

| ID | Nome | Debate |
| --- | --- | --- |
| 004 | RegistroHistoricoOS | Filho OS vs projeção |
| 025 | EntradaHistóricoDomínio | Event store candidato |

Favorecer **025 em BC-017**; 004 como read projection — MDDP-001.

## Não modelar como aggregate mutável

Audit trail editável pelo usuário — rejeitado.

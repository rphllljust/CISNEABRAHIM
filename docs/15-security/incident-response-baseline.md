# SEC-IR-001

| Campo | Valor |
| --- | --- |
| Document ID | Baseline resposta a incidentes |
| Prompt | 14 |

> Processo organizacional **candidato** — sem afirmar equipe SOC existente.

## Severidade

| Sev | Critério | Exemplo |
| --- | --- | --- |
| S1 | Breach dados FINANCIAL/PII | Vazamento custo/margem |
| S2 | Takeover admin | Token compromise |
| S3 | DoS prolongado | API down |
| S4 | Vuln crítica sem exploit | CVE dependency |

## Fases

```text
Detect → Triage → Contain → Eradicate → Recover → Post-mortem
```

## Playbooks candidatos

| Incidente | Contenção imediata |
| --- | --- |
| Secret leak git | Revoke + rotate + history purge |
| Webhook spoof | Disable endpoint + HMAC rotate |
| Insider export | Disable account + preserve SECURITY_AUDIT |
| Ransomware DB | Restore backup isolado |

## Comunicação

| Audiência | Quando |
| --- | --- |
| Stakeholder técnico | S2+ |
| Jurídico/privacidade | S1 PII — **sem afirmar obrigação legal** |
| Usuários | Se impacto confirmado |

## Evidência

Preservar SECURITY_AUDIT, logs, timestamps — chain of custody informal.

## Pós-incidente

Root cause, SEC-RISK update, SEC-TEST adicional.

## Contatos

**UNKNOWN** — registrar em stakeholders quando definido.

## Não inventar

Prazo notificação ANPD/LGPD — decisão jurídica externa.

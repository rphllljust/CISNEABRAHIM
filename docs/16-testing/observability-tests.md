# QA-OBS-001

| Campo       | Valor                  |
| ----------- | ---------------------- |
| Document ID | Testes observabilidade |
| Prompt      | 15                     |

## O que validar (futuro L4)

| Sinal                               | Teste candidato         |
| ----------------------------------- | ----------------------- |
| `correlation_id` em response header | contract                |
| TECHNICAL_LOG sem Authorization     | 014 redaction smoke     |
| Métrica `http_request_duration`     | integration hook        |
| Trace span CMD name                 | OpenTelemetry candidato |
| SECURITY_AUDIT em DENY              | 052                     |

## Logs negativos

| Assert                         | TEST                  |
| ------------------------------ | --------------------- |
| Custo não aparece em log error | fixture + log capture |
| PII mascarado tax_id           | backlog               |

## Health checks

| Endpoint | `/health` liveness, `/ready` PG |
| -------- | ------------------------------- |

## Alertas (manual)

Duplicata NF attempt spike — runbook, não auto-test.

## NFR

NFR-029 audit — TEST-CAND-052.

## Fase

Pós bootstrap — observability-tests tag `@obs` nightly.

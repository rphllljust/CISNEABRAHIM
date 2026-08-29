# QATTR-OBS-001

| Campo | Valor |
| --- | --- |
| Document ID | Observabilidade |
| Fonte | SRC-001 |
| Prompt | 03 |

> Ferramenta de observabilidade: **não escolhida**.

## Requisitos candidatos

| ID | Tipo | Declaração | NFR | Status |
| --- | --- | --- | --- | --- |
| OBS-REQ-001 | DOMAIN_HISTORY | Eventos de negócio relevantes registrados | NFR-029 | PENDING_SOURCE_VALIDATION |
| OBS-REQ-002 | AUDIT_TRAIL | Trilha consultável para auditoria empresarial | NFR-006 | PENDING_SOURCE_VALIDATION |
| OBS-REQ-003 | SECURITY_AUDIT | Eventos de segurança distintos de log técnico | SEC-REQ-024 | PENDING_SOURCE_VALIDATION |
| OBS-REQ-004 | TECHNICAL_LOG | Logs para diagnóstico sem PII desnecessária | NFR-039 | PENDING_LEGAL_VALIDATION |
| OBS-REQ-005 | METRIC | Métricas de latência e erro por classe de operação | NFR-032 | PENDING_TARGET_DEFINITION |
| OBS-REQ-006 | TRACE | Correlação transversal de operações relacionadas | NFR-030 | PENDING_TARGET_DEFINITION |
| OBS-REQ-007 | ALERT | Alertas para condições críticas candidatas | NFR-031 | PENDING_TARGET_DEFINITION |
| OBS-REQ-008 | HEALTH | Health check para disponibilidade futura | AVAIL-REQ-004 | PENDING_TARGET_DEFINITION |
| OBS-REQ-009 | RUNBOOK | Runbooks para incidentes — escopo futuro (Prompt 32) | — | DRAFT |
| OBS-REQ-010 | CORRELATION | ID de correlação em integrações e operações | NFR-030 | PENDING_TARGET_DEFINITION |

**Total OBS-REQ:** 10

## DDP associado

DDP-038 — Observabilidade mínima operacional (o que registrar, por quanto tempo, quem acessa).

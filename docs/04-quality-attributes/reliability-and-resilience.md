# QATTR-REL-001

| Campo | Valor |
| --- | --- |
| Document ID | Confiabilidade e resiliência |
| Fonte | SRC-001 |
| Prompt | 03 |

## Requisitos

| ID | Declaração | NFR | Risco | Status |
| --- | --- | --- | --- | --- |
| REL-REQ-001 | Falha de integração não cria sucesso local falso | NFR-012 | RISK-010 | PENDING_SOURCE_VALIDATION |
| REL-REQ-002 | Falha parcial não corrompe dados financeiros confirmados | NFR-024 | RISK-010 | PENDING_SOURCE_VALIDATION |
| REL-REQ-003 | Operações críticas recuperáveis após reinício conforme política | NFR-024 | RISK-011 | PENDING_MEASUREMENT |
| REL-REQ-004 | Reconciliação candidata após falha de integração | NFR-012; FR-030 | RISK-010 | PENDING_SOURCE_VALIDATION |
| REL-REQ-005 | Degradação explícita quando subsistema indisponível | NFR-023, NFR-024 | RISK-002 | PENDING_MEASUREMENT |
| REL-REQ-006 | Idempotência em retentativas de integração | IDEM-REQ-004 | RISK-004 | PENDING_SOURCE_VALIDATION |

**Total REL-REQ:** 6

## Resiliência candidata

- Circuit breaker / retry: **não escolhido** — decisão futura (DDP-014)
- Filas e processamento assíncrono: **candidato** — sem implementação
- Modo offline: DDP-018 — `OPEN`

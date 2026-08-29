# DBEH-CAUSAL-001

| Campo | Valor |
| --- | --- |
| Document ID | Causalidade comando → evento |
| Prompt | 06 |

| CMD | DE primário | DE secundários | INV verificadas |
| --- | --- | --- | --- |
| CMD-001 | DE-001 | — | INV-003 |
| CMD-002 | DE-002 | — | POL-003 |
| CMD-003 | DE-003 | DE-001 (já ocorrido) | INV-001 |
| CMD-005 | DE-004 | — | INV-002 |
| CMD-006 | DE-005 | — | — |
| CMD-008 | DE-009 | — | INV-020 |
| CMD-009 | DE-010 | — | INV-021 |
| CMD-010 | DE-011 | — | INV-015 |
| CMD-011 | DE-012 | — | INV-015 |
| CMD-015 | DE-007 | DE-008 (se conflito) | INV-004 |
| CMD-016 | DE-013 | — | — |
| CMD-017 | DE-014 | — | INV-008, INV-009 |
| CMD-018 | DE-015 | — | INV-017 |
| CMD-019 | DE-016 | — | INV-007 |
| CMD-020 | DE-017 | — | INV-011 |
| CMD-021 | DE-018 | — | INV-010 |
| CMD-022 | DE-019 | — | INV-013 |

**Sem comando → sem DE de negócio** para atos intencionais (exceto detecções como DE-008).

Consultas não emitem DE de domínio — no máximo AUDIT_ONLY se política exigir.

Nem todo CMD gera notificação (BC-015) — classificação NOTIFICATION_TRIGGER_CANDIDATE por DE.

# QATTR-REC-001

| Campo | Valor |
| --- | --- |
| Document ID | Recuperação e continuidade |
| Fonte | SRC-001 |
| Evidência | EV-083 |
| Prompt | 03 |

## Conceitos diferenciados (sem tecnologia de backup)

| Conceito | Declaração candidata | Status |
| --- | --- | --- |
| Backup realizado | Cópia de dados empresariais críticos executada conforme política futura | PENDING_MEASUREMENT |
| Backup íntegro | Backup verificável quanto à integridade antes de confiar na recuperação | PENDING_MEASUREMENT |
| Restauração testada | Restore executado periodicamente em ambiente isolado com critério de sucesso | PENDING_MEASUREMENT |
| RPO | Perda máxima aceitável de dados — decisão empresarial | TARGET_NOT_DEFINED (DDP-016) |
| RTO | Tempo máximo de recuperação — decisão empresarial | TARGET_NOT_DEFINED (DDP-016) |
| Continuidade | Operação mínima sustentável durante incidente — runbook futuro | DRAFT |
| Reconciliação | Alinhamento de estado após falha parcial ou restore | PENDING_SOURCE_VALIDATION |
| Recuperação de documento | Versões e substituições documentais recuperáveis | PENDING_SOURCE_VALIDATION |
| Recuperação de operação parcial | Operação interrompida retomável sem duplicar efeito | PENDING_SOURCE_VALIDATION |
| Recuperação após falha externa | Integração indisponível não produz sucesso local falso | PENDING_SOURCE_VALIDATION |

## RPO e RTO

| Métrica | Valor | DDP |
| --- | --- | --- |
| RPO | TARGET_NOT_DEFINED | DDP-016 |
| RTO | TARGET_NOT_DEFINED | DDP-016 |
| Perda aceitável de dados | TARGET_NOT_DEFINED | DDP-016 |
| Tempo aceitável de recuperação | TARGET_NOT_DEFINED | DDP-016 |

## Requisitos

| ID | Declaração | NFR | Risco | Status |
| --- | --- | --- | --- | --- |
| REC-REQ-001 | Backup de dados empresariais críticos candidatos | NFR-025 | RISK-011 | PENDING_MEASUREMENT |
| REC-REQ-002 | Restauração testável periodicamente | NFR-026 | RISK-011 | PENDING_MEASUREMENT |
| REC-REQ-003 | RPO definido empresarialmente antes da implementação | NFR-027 | RISK-011 | PENDING_MEASUREMENT |
| REC-REQ-004 | RTO definido empresarialmente antes da implementação | NFR-028 | RISK-011 | PENDING_MEASUREMENT |
| REC-REQ-005 | Reconciliação após restore ou falha parcial | NFR-024 | RISK-010 | PENDING_SOURCE_VALIDATION |
| REC-REQ-006 | Procedimento de continuidade documentado (runbook futuro) | — | RISK-011 | DRAFT |

**Total REC-REQ:** 6

## Teste de restauração

- Frequência: TARGET_NOT_DEFINED
- Ambiente: TARGET_NOT_DEFINED
- Critério de sucesso: TARGET_NOT_DEFINED
- Owner: UNKNOWN

# ADR-INDEX-001

| Campo | Valor |
| --- | --- |
| Document ID | Índice de Architecture Decision Records |
| Total | 6 (ADR-001..006) |
| Prompt | 09 |
| Política | Novos ADRs numeram sequencialmente; superseded mantém histórico |

| ADR | Título | Status | Data |
| --- | --- | --- | --- |
| [ADR-001](./adr/ADR-001-architecture-style.md) | Estilo arquitetural inicial: modular monolith | PROPOSED | 2026-08-28 |
| [ADR-002](./adr/ADR-002-domain-boundaries.md) | Organização por bounded contexts candidatos | ACCEPTED | 2026-08-28 |
| [ADR-003](./adr/ADR-003-data-ownership.md) | Single write owner por agregado lógico | ACCEPTED | 2026-08-28 |
| [ADR-004](./adr/ADR-004-consistency-approach.md) | Consistência forte local + eventual na borda | PROPOSED | 2026-08-28 |
| [ADR-005](./adr/ADR-005-integration-approach.md) | Integração via ACL (BC-CAND-018) | PROPOSED | 2026-08-28 |
| [ADR-006](./adr/ADR-006-deployment-baseline.md) | Baseline: app única/API + FE separado candidato | PROPOSED | 2026-08-28 |

## Status aceitos neste prompt

| Status | Count |
| --- | --- |
| ACCEPTED | 2 |
| PROPOSED | 4 |
| REJECTED | 0 (microservices como estilo inicial — ver ADR-001) |
| PENDING_INFORMATION | 0 (uso implícito em ARCH-DDP) |

## Relação ED/ADR

ED-001..004 permanecem ACCEPTED (governança). ADR-001..006 são decisões arquiteturais de domínio/sistema.

## Próximos ADRs esperados (não criados)

ADR-007+ stack, ORM, autenticação — **Prompt 10+**, não executado.

# ARCH-DDP-001

| Campo | Valor |
| --- | --- |
| Document ID | Decisões arquiteturais pendentes |
| Total | 12 (ARCH-DDP-001..012) |
| Prompt | 09 |

| ID | Questão | Bloqueia | Status |
| --- | --- | --- | --- |
| ARCH-DDP-001 | PostgreSQL como SGBD primário? | Migrations, ORM | OPEN |
| ARCH-DDP-002 | Object storage para binários (TERM-033)? | BC-014 | OPEN |
| ARCH-DDP-003 | Conteúdo do shared-kernel mínimo | MOD-004 | OPEN |
| ARCH-DDP-004 | Outbox vs transação dual-write para eventos | Integração | OPEN |
| ARCH-DDP-005 | Optimistic vs pessimistic locking default | Concorrência | OPEN |
| ARCH-DDP-006 | Política backup/RPO/RTO | DR | OPEN |
| ARCH-DDP-007 | SPA separado vs server-rendered | TOPO-002 | OPEN |
| ARCH-DDP-008 | Ferramenta enforcement dependências (ArchUnit?) | CI | OPEN |
| ARCH-DDP-009 | Message broker necessário no MVP? | BC-015, 018 | OPEN |
| ARCH-DDP-010 | CQRS completo vs read models pontuais | BC-016 | OPEN |
| ARCH-DDP-011 | API style REST vs alternativas | Presentation | OPEN |
| ARCH-DDP-012 | Confirmar modular monolith (DBND-006) | ADR-001 → ACCEPTED | OPEN — DDP-017 |

## DDPs empresariais que impactam arquitetura

DDP-009 (PO), DDP-012 (pagamento), DDP-014 (ERP), DDP-015 (permissões), DDP-017 (sizing), DDP-023 (fiscal).

## ED-004

Stack runtime permanece não decidida — remetida a prompts de implementação após ACCEPTED em ADRs relevantes.

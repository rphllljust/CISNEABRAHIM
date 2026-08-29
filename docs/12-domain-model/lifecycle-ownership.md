# DM-LC-001

| Campo       | Valor                      |
| ----------- | -------------------------- |
| Document ID | Ownership de ciclo de vida |
| Prompt      | 11                         |

| AGG | SM-CAND     | Write owner BC | Leitura cross-BC |
| --- | ----------- | -------------- | ---------------- |
| 001 | SM-CAND-001 | BC-005         | BC-006 (ref)     |
| 002 | SM-CAND-002 | BC-006         | BC-007..015      |
| 003 | SM-CAND-003 | BC-007         | BC-006, 008      |
| 004 | SM-CAND-004 | BC-008         | BC-006, 010      |
| 005 | —           | BC-009         | BC-008, 014      |
| 006 | SM-CAND-005 | BC-010         | BC-011           |
| 007 | SM-CAND-007 | BC-011         | BC-012           |
| 008 | SM-CAND-008 | BC-012         | BC-013           |
| 009 | SM-CAND-009 | BC-013         | BC-016           |
| 010 | —           | BC-004         | BC-006, 003      |
| 011 | —           | BC-003         | BC-006           |
| 012 | —           | BC-002         | Vários           |
| 013 | SM-CAND-006 | BC-014         | BC-009, 012      |
| 014 | SM-CAND-010 | BC-015         | —                |

## Regra

Estado de AGG-A **não** mutado por comando em BC-B — apenas por evento/comando no owner.

## Conversão 001→002

Único ponto transacional candidato CB-002 — estados atualizados em ambos roots na mesma UoW.

## Histórico

DOMAIN_HISTORY (BC-017) registra fatos; não substitui estado SM.

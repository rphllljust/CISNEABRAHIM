# QA-DOM-001

| Campo | Valor |
| --- | --- |
| Document ID | Catálogo testes regras de domínio |
| Prompt | 15 |

## Por invariante

| INV | TEST-CAND | Nível | Negativo | Corrida |
| --- | --- | --- | --- | --- |
| INV-001 | 001,002,003 | L3/L4 | ✓ dup | ✓ 003 |
| INV-002 | 005,007,010 | L4 | ✓ 005,007 | — |
| INV-003 | 002,036 | L3/L4 | ✓ | — |
| INV-004 | 019,020 | L3 | ✓ REJ-005 | ✓ 020 |
| INV-005 | 013 | L1 | — | — |
| INV-006 | 014,025 | L4 | ✓ 014 | — |
| INV-007 | 015,041 | L1/L4 | ✓ 015 | ✓ 041 |
| INV-008 | 016,032,039 | L1/L4 | ✓ 016 | — |
| INV-009 | 017 | L3 | ✓ dup | — |
| INV-010 | 012,049 | L4 | ✓ | — |
| INV-011 | 011 | L3 | ✓ UNQ | — |
| INV-012 | 008,009,038 | L3 | ✓ 008 | ✓ 009 |
| INV-013 | 035 | L3 | ✓ version | ✓ 035 |
| INV-014 | 004,051 | L3 | ✓ delete | — |
| INV-015 | 029 | L1 | ✓ XOR | ✓ TXN-009 |
| INV-016 | 044,050 | L4 | ✓ | — |
| INV-017 | 018 | L4 | ✓ SoD | — |
| INV-018 | 042 | L4 | ✓ scope | — |
| INV-019 | 006 | L3 | ✓ 409 | ✓ 006 |
| INV-020 | 039 | L4 | ✓ | — |
| INV-021 | 040 | L4 | — | — |
| INV-022 | 043 | L3 | ✓ UNQ | — |

## Padrão L1 domain unit

```text
given aggregate in state X
when command Y with invalid precondition
then reject REJ-* without side effect
```

## Sem mock de persistência para INV com UNQ

INV-001, 009, 011 → L3 obrigatório.

## VO tests L1

Money pair, Quantity+unit, IdempotencyKey format — backlog TEST-CAND-059+ na implementação.

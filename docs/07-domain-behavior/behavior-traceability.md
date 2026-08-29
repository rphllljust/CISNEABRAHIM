# DBEH-TRACE-001

| Campo       | Valor                            |
| ----------- | -------------------------------- |
| Document ID | Rastreabilidade de comportamento |
| Prompt      | 06                               |

## Cadeia

```text
EV → BR → FR/UC → INV → CMD → DE / REJ
```

## Amostras completas

| EV     | BR     | FR/UC          | INV     | CMD     | DE / REJ         |
| ------ | ------ | -------------- | ------- | ------- | ---------------- |
| EV-028 | BR-001 | FR-009, UC-005 | INV-001 | CMD-003 | DE-003 / REJ-001 |
| EV-039 | BR-006 | FR-014, UC-008 | INV-002 | CMD-005 | DE-004 / REJ-002 |
| EV-053 | BR-017 | FR-028, UC-015 | INV-004 | CMD-015 | DE-007 / REJ-005 |
| EV-062 | BR-009 | FR-036, UC-021 | INV-009 | CMD-017 | DE-014 / REJ-008 |
| EV-064 | BR-010 | FR-039, UC-023 | INV-011 | CMD-020 | DE-017 / REJ-010 |
| EV-082 | BR-016 | FR-042, UC-025 | INV-013 | CMD-022 | DE-019 / REJ-012 |
| EV-077 | BR-005 | FR-030         | INV-016 | —       | DE-020 / REJ-013 |

## Cobertura

| Artefato | Qtd | CONFIRMED |
| -------- | --- | --------- |
| INV      | 22  | 0         |
| CMD      | 22  | 0         |
| DE       | 20  | 0         |
| REJ      | 18  | —         |
| PRED     | 12  | —         |

## INV críticas sem CONFIRMED — todas com EV ou PENDING

| INV                                             | Evidência ou pendência                                |
| ----------------------------------------------- | ----------------------------------------------------- |
| INV-001..005, 007, 009, 011, 013..016, 018..022 | EV listada no registro                                |
| INV-006, 008, 010, 012, 017                     | PENDING_BUSINESS_DECISION / PENDING_SOURCE_VALIDATION |

## Referências cruzadas

- BC ownership: [`../06-domain-boundaries/context-command-ownership.md`](../06-domain-boundaries/context-command-ownership.md)
- Matriz geral: [`../01-foundation/requirements-traceability.md`](../01-foundation/requirements-traceability.md)

## Atualização controlada em docs anteriores

Nenhuma alteração retroativa em FR/BR. `command-candidates.md` (Prompt 01) permanece histórico; CMD-* deste prompt é registro formal Prompt 06.

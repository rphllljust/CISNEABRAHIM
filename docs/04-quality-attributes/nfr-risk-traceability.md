# QATTR-NFR-RISK-TRACE-001

| Campo       | Valor                                                           |
| ----------- | --------------------------------------------------------------- |
| Document ID | Rastreabilidade NFR, cenários e riscos                          |
| Fonte       | SRC-001                                                         |
| Prompt      | 03 (revisão estrutural)                                         |
| Cadeia      | SOURCE → EV → BR → FR/UC → NFR/QA-SC → RISK → FUTURE TEST (TBD) |

## Resumo

| Artefato      | Quantidade |
| ------------- | ---------- |
| NFR           | 40         |
| QA-SC         | 28         |
| SEC-REQ       | 24         |
| NFNQ          | 18         |
| NFR CONFIRMED | 0          |

## Amostra de cadeias completas

| SOURCE  | EV     | BR     | FR             | NFR              | QA-SC                | RISK     | DDP     |
| ------- | ------ | ------ | -------------- | ---------------- | -------------------- | -------- | ------- |
| SRC-001 | EV-079 | BR-019 | FR-022         | NFR-001, NFR-006 | QA-SC-001, QA-SC-006 | RISK-003 | DDP-037 |
| SRC-001 | EV-028 | BR-001 | FR-008, FR-009 | NFR-003          | QA-SC-003            | RISK-004 | DDP-002 |
| SRC-001 | EV-036 | BR-006 | FR-014         | NFR-004, NFR-007 | QA-SC-004, QA-SC-007 | RISK-022 | DDP-003 |
| SRC-001 | EV-053 | BR-017 | FR-028         | NFR-005          | QA-SC-005            | RISK-006 | DDP-007 |
| SRC-001 | EV-061 | BR-018 | FR-032         | NFR-008          | QA-SC-008            | RISK-020 | DDP-030 |
| SRC-001 | EV-082 | BR-016 | FR-042         | NFR-009          | QA-SC-009            | RISK-008 | DDP-013 |
| SRC-001 | EV-017 | BR-014 | FR-038         | NFR-011          | QA-SC-011            | RISK-005 | DDP-011 |
| SRC-001 | EV-077 | BR-005 | FR-030         | NFR-012          | QA-SC-012            | RISK-010 | DDP-014 |
| SRC-001 | EV-062 | BR-009 | FR-037         | NFR-013          | QA-SC-013            | RISK-013 | DDP-010 |
| SRC-001 | EV-060 | BR-008 | FR-033         | NFR-014          | QA-SC-014            | RISK-009 | DDP-009 |
| SRC-001 | EV-083 | —      | —              | NFR-025..028     | QA-SC-021, QA-SC-022 | RISK-011 | DDP-016 |
| SRC-001 | EV-074 | BR-022 | FR-005         | NFR-023, NFR-031 | QA-SC-019, QA-SC-025 | RISK-002 | DDP-040 |
| SRC-001 | EV-078 | BR-023 | FR-022         | NFR-029, NFR-040 | QA-SC-023, QA-SC-028 | RISK-024 | DDP-038 |

## NFR por categoria

| Categoria                        | NFRs          |
| -------------------------------- | ------------- |
| Integridade / concorrência       | 001–005       |
| Auditoria                        | 006, 029, 030 |
| Segurança                        | 007–022       |
| Confiabilidade / disponibilidade | 023–024       |
| Recuperação                      | 025–028       |
| Observabilidade                  | 029–031       |
| Performance                      | 032–035       |
| Privacidade / retenção           | 036–039       |
| Manutenibilidade                 | 040           |

## Referências cruzadas

- Registro completo: [non-functional-requirements-register.md](./non-functional-requirements-register.md)
- Cenários: [quality-attribute-scenarios.md](./quality-attribute-scenarios.md)
- SLOs pendentes: [service-level-objectives-pending.md](./service-level-objectives-pending.md)
- Mapa de dependências: [../03-requirements/requirement-dependency-map.md](../03-requirements/requirement-dependency-map.md)
- Matriz funcional: [../01-foundation/requirements-traceability.md](../01-foundation/requirements-traceability.md)

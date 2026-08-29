# DBEH-CONS-BND-001

| Campo       | Valor                                 |
| ----------- | ------------------------------------- |
| Document ID | Fronteiras de consistência candidatas |
| Prompt      | 06                                    |

| Boundary ID | Escopo                       | INVs principais           | Classificação dominante                     | BC         |
| ----------- | ---------------------------- | ------------------------- | ------------------------------------------- | ---------- |
| CB-001      | Solicitação                  | INV-003                   | STRONG_WITHIN_BOUNDARY                      | BC-005     |
| CB-002      | Conversão solicitação→OS     | INV-001                   | STRONG_TRANSACTIONAL                        | BC-005+006 |
| CB-003      | Ciclo OS (liberação, estado) | INV-002, INV-015, INV-019 | STRONG_WITHIN_BOUNDARY                      | BC-006     |
| CB-004      | Alocação recurso             | INV-004                   | STRONG_WITHIN_BOUNDARY                      | BC-007     |
| CB-005      | Execução e quantidades       | INV-020, INV-021          | STRONG_WITHIN_BOUNDARY                      | BC-008     |
| CB-006      | Medição                      | INV-008, INV-009, INV-017 | STRONG_WITHIN_BOUNDARY                      | BC-010     |
| CB-007      | Cadeia faturamento           | INV-007, INV-011          | STRONG_TRANSACTIONAL candidato              | BC-011+012 |
| CB-008      | Pagamento                    | INV-010                   | EVENTUAL_WITH_RECONCILIATION se SoT externo | BC-013     |
| CB-009      | Documento/versão             | INV-013                   | STRONG_WITHIN_BOUNDARY                      | BC-014     |
| CB-010      | PO saldo                     | INV-012                   | STRONG_WITHIN_BOUNDARY                      | BC-004     |
| CB-011      | Integração sync              | INV-016                   | EVENTUAL_WITH_RECONCILIATION                | BC-018     |
| CB-012      | Relatórios                   | —                         | REPORTING_ONLY                              | BC-016     |

Fronteiras CB-002 e CB-007 são **transacionais candidatas** entre contextos — orquestração futura, não aggregate único confirmado.

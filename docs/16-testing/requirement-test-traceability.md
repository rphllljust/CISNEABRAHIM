# QA-TRACE-001

| Campo | Valor |
| --- | --- |
| Document ID | Rastreabilidade requisito → TEST-CAND |
| Total | 58 (TEST-CAND-001..058) |
| Prompt | 15 |

> Legenda nível: L1 unit domínio · L3 DB PG · L4 API · L6 E2E · L7 security

## Matriz principal

| TEST-CAND | Nível | Título | EV | BR | FR | UC | NFR | INV | CMD | TR | AUTHZ | RISK | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TEST-CAND-001 | L3 | Conversão dupla bloqueada UNQ | EV-028 | BR-001 | FR-009 | UC-005 | NFR-003 | INV-001 | CMD-003 | TR-CAND-003 | AUTHZ-012 | RISK-004 | CANDIDATE |
| TEST-CAND-002 | L4 | Conversão idempotente retry | EV-028 | BR-001 | FR-009 | UC-005 | NFR-003 | INV-001,003 | CMD-003 | — | — | RISK-004 | CANDIDATE |
| TEST-CAND-003 | L3 | Conversão paralela 1 OS | EV-036 | BR-001 | FR-009 | — | — | INV-001 | CMD-003 | — | — | TXN-TEST-002 | CANDIDATE |
| TEST-CAND-004 | L3 | Audit DE-003 só pós-commit | — | — | — | — | — | INV-014 | CMD-003 | — | — | TXN-TEST-018 | CANDIDATE |
| TEST-CAND-005 | L4 | Liberar sem alçada negado | EV-039 | BR-006 | FR-014 | UC-008 | NFR-019 | INV-002 | CMD-005 | TR-CAND-008 | AUTHZ-018, DENY-003 | RISK-022 | CANDIDATE |
| TEST-CAND-006 | L3 | row_version OS conflito 409 | — | — | FR-022 | — | NFR-001 | INV-019 | CMD-013 | — | — | TXN-TEST-003 | CANDIDATE |
| TEST-CAND-007 | L4 | Liberar OS não preparada REJ | — | BR-006 | FR-014 | — | — | INV-002 | CMD-005 | TR-CAND-008 | — | — | CANDIDATE |
| TEST-CAND-008 | L3 | PO saldo insuficiente rollback | EV-060 | BR-016 | FR-033 | UC-019 | NFR-011 | INV-012 | CMD-005 | — | — | SEC-TEST-011 | CANDIDATE |
| TEST-CAND-009 | L3 | PO consumo concorrente 1 win | — | — | FR-033 | — | — | INV-012 | PO-CONSUME | — | — | TXN-TEST-006 | CANDIDATE |
| TEST-CAND-010 | L4 | Liberação dupla idempotente | — | — | FR-014 | — | — | INV-002 | CMD-005 | — | — | TXN-TEST-004 | CANDIDATE |
| TEST-CAND-011 | L3 | NF dup external_key UNQ | EV-064 | BR-010 | FR-039 | UC-023 | NFR-011 | INV-011 | CMD-020 | — | AUTHZ-023 | DATA-RISK-011 | CANDIDATE |
| TEST-CAND-012 | L4 | Pagamento dup idempotente | — | — | — | — | NFR-011 | INV-010 | CMD-021 | — | — | TXN-TEST-013 | CANDIDATE |
| TEST-CAND-013 | L1 | Custo ≠ preço conceito VO | — | BR-014 | FR-032 | — | NFR-008 | INV-005 | — | — | — | RISK-020 | CANDIDATE |
| TEST-CAND-014 | L4 | API OS sem campo custo default | — | — | FR-032 | — | NFR-008 | INV-006 | — | AUTHZ-015 | SEC-TEST-015 | SEC-RISK-004 | CANDIDATE |
| TEST-CAND-015 | L1 | Billable sem origin REJ | — | BR-014 | FR-038 | — | — | INV-007 | CMD-019 | — | — | — | CANDIDATE |
| TEST-CAND-016 | L4 | Medição sem execução elegível | EV-062 | BR-009 | FR-035,036 | UC-021 | NFR-013 | INV-008 | CMD-017 | — | — | — | PENDING_SOURCE |
| TEST-CAND-017 | L3 | Medição dup UNQ | EV-062 | BR-009 | FR-036 | — | NFR-013 | INV-009 | CMD-017 | — | — | TXN-TEST-010 | CANDIDATE |
| TEST-CAND-018 | L4 | SoD submissor ≠ decisor medição | — | — | FR-037 | — | NFR-013 | INV-017 | CMD-018 | — | SOD-004, DENY-011 | SEC-TEST-018 | PENDING |
| TEST-CAND-019 | L3 | Alocação dup recurso REJ-005 | EV-053 | BR-017 | FR-025 | UC-015 | NFR-005 | INV-004 | CMD-015 | TR-CAND-012 | — | RISK-006 | CANDIDATE |
| TEST-CAND-020 | L3 | Alocação paralela exclusiva | — | — | FR-025 | — | NFR-005 | INV-004 | CMD-015 | — | — | TXN-TEST-007 | CANDIDATE |
| TEST-CAND-021 | L4 | Preparador não libera OS SoD | — | — | FR-014 | — | NFR-019 | — | CMD-005 | — | SOD-002, TSC-AUTH-005 | SEC-ABU-002 | CANDIDATE |
| TEST-CAND-022 | L4 | Executor fora escopo OS 403 | — | — | — | — | — | — | CMD-009 | — | AUTHZ-040, DENY-010 | SEC-TEST-012 | CANDIDATE |
| TEST-CAND-023 | L4 | URL direta sem auth 401/403 | — | — | — | — | NFR-007 | — | — | — | DENY-018 | SEC-TEST-012 | CANDIDATE |
| TEST-CAND-024 | L4 | Alterar preço pós-liberação negado | — | — | FR-031 | — | — | — | CMD-013 | — | AUTHZ-032, DENY-008 | SEC-TEST-017 | CANDIDATE |
| TEST-CAND-025 | L4 | Export margem exige AUTHZ-026 | — | — | — | — | NFR-021 | INV-006 | — | — | AUTHZ-026 | SEC-TEST-016 | CANDIDATE |
| TEST-CAND-026 | L4 | Registrar nota sem papel FIN | — | — | FR-039 | — | — | — | CMD-020 | — | DENY-014 | — | CANDIDATE |
| TEST-CAND-027 | L4 | Admin técnico não registra pagamento | — | — | — | — | — | — | CMD-021 | — | SOD-012, TSC-AUTH-009 | — | CANDIDATE |
| TEST-CAND-028 | L4 | Conta desativada nega CMD | — | — | — | — | NFR-007 | — | * | — | AUTHZ-041 | TSC-AUTH-006 | CANDIDATE |
| TEST-CAND-029 | L1 | completed XOR cancelled CHK | — | — | FR-019,020 | — | — | INV-015 | CMD-010,011 | TR-CAND-015 | — | TXN-TEST-009 | CANDIDATE |
| TEST-CAND-030 | L1 | SM-001 transição ilegal rejeitada | — | — | — | — | — | — | — | TR-CAND-001 | — | — | CANDIDATE |
| TEST-CAND-031 | L1 | SM-002 liberar só de PREPARADA | — | BR-006 | FR-014 | — | — | INV-002 | CMD-005 | TR-CAND-008 | — | — | CANDIDATE |
| TEST-CAND-032 | L1 | SM-005 medição submit guard | — | — | FR-036 | — | — | INV-008 | CMD-017 | TR-CAND-018 | — | — | CANDIDATE |
| TEST-CAND-033 | L3 | CHK qty planejado > 0 | — | — | — | — | — | — | CMD-004 | — | — | CHK-CAND-001 | CANDIDATE |
| TEST-CAND-034 | L3 | CHK amount >= 0 billable | — | — | — | — | — | INV-007 | CMD-019 | — | — | CHK-CAND-004 | CANDIDATE |
| TEST-CAND-035 | L3 | UNQ document version | — | — | FR-042 | — | NFR-009 | INV-013 | CMD-022 | TR-CAND-024 | — | TXN-TEST-015 | CANDIDATE |
| TEST-CAND-036 | L3 | UNQ idempotency_key intake | — | — | FR-001 | UC-001 | NFR-002 | INV-003 | CMD-001 | — | — | — | CANDIDATE |
| TEST-CAND-037 | L3 | FK service_order → service_request | — | — | — | — | — | INV-001 | CMD-003 | — | — | — | CANDIDATE |
| TEST-CAND-038 | L3 | balance_amount >= 0 CHK PO | — | — | FR-033 | — | — | INV-012 | — | — | — | CHK-CAND-007 | PENDING |
| TEST-CAND-039 | L4 | Execução sem OS liberada REJ | — | — | FR-017 | UC-009 | — | INV-020 | CMD-008 | TR-CAND-010 | — | — | CANDIDATE |
| TEST-CAND-040 | L4 | Progresso rastreável execução | — | — | FR-018 | — | — | INV-021 | CMD-009 | — | — | — | CANDIDATE |
| TEST-CAND-041 | L4 | Faturar 2× mesma medição 1 prep | — | BR-014 | FR-038 | UC-022 | NFR-011 | INV-007 | CMD-019 | — | — | TXN-TEST-011 | CANDIDATE |
| TEST-CAND-042 | L4 | Sistema não emite NF-e | — | — | FR-039 | — | — | INV-018 | CMD-020 | — | — | — | CANDIDATE |
| TEST-CAND-043 | L3 | External mapping dup UNQ | — | — | FR-030 | — | NFR-012 | INV-022 | — | — | — | — | CANDIDATE |
| TEST-CAND-044 | L4 | Integração sucesso falso bloqueado | — | — | FR-030 | — | NFR-012 | INV-016 | — | TR-CAND-020 | SEC-REQ-021 | — | CANDIDATE |
| TEST-CAND-045 | L4 | Webhook sem HMAC 401 | — | — | — | — | — | — | CMD-021 | — | — | SEC-TEST-019 | CANDIDATE |
| TEST-CAND-046 | L4 | Inbox dup message 1 process | — | — | — | — | — | — | — | — | — | TXN-TEST-016 | CANDIDATE |
| TEST-CAND-047 | L7 | JWT forged rejected | — | — | — | — | NFR-022 | — | — | — | — | SEC-TEST-002 | CANDIDATE |
| TEST-CAND-048 | L7 | Login rate limit | — | — | — | — | NFR-020 | — | — | — | — | SEC-TEST-006 | CANDIDATE |
| TEST-CAND-049 | L4 | Pagamento timeout retry no dup | — | — | — | — | NFR-011 | INV-010 | CMD-021 | — | — | TXN-TEST-014 | PENDING |
| TEST-CAND-050 | L4 | Inbox poison → FAILED não domain | — | — | — | — | — | INV-016 | — | — | — | TXN-FAIL-023 | CANDIDATE |
| TEST-CAND-051 | L3 | Histórico append-only no DELETE | — | — | — | — | NFR-029 | INV-014 | — | — | — | — | CANDIDATE |
| TEST-CAND-052 | L4 | DENY gera SECURITY_AUDIT | — | — | — | — | NFR-029 | — | CMD-005 | — | DENY-003 | TSC-AUTH-017 | CANDIDATE |
| TEST-CAND-053 | L6 | UC-005 jornada solicitação→OS | EV-028 | BR-001 | FR-001,009 | UC-005 | NFR-003 | INV-001 | CMD-001,003 | — | — | — | CANDIDATE |
| TEST-CAND-054 | L6 | UC-008 liberar e executar | EV-039 | BR-006 | FR-014,017 | UC-008,009 | — | INV-002,020 | CMD-005,008 | — | — | — | CANDIDATE |
| TEST-CAND-055 | L6 | UC-021 medição→faturamento | EV-062 | BR-009 | FR-036,038 | UC-021,022 | NFR-011 | INV-009,007 | CMD-017,019 | — | — | — | CANDIDATE |
| TEST-CAND-056 | L6 | UC-023 registrar nota | EV-064 | BR-010 | FR-039 | UC-023 | — | INV-011 | CMD-020 | — | — | — | CANDIDATE |
| TEST-CAND-057 | L4 | Upload MIME inválido rejeitado | — | — | FR-040 | — | NFR-017 | — | CMD-016 | — | — | SEC-THR-023 | CANDIDATE |
| TEST-CAND-058 | L4 | Signed URL expirada 403 | — | — | FR-042 | — | NFR-010 | — | CMD-022 | — | AUTHZ-039 | SEC-TEST-022 | CANDIDATE |

## Requisitos sem TEST-CAND dedicado (gap)

| ID | Motivo | Ação |
| --- | --- | --- |
| FR-016 | CMD-007 PENDING_BUSINESS | TEST quando CMD confirmado |
| FR-021 | CMD-012 reabrir PENDING | TEST quando SM fechada |
| NFR-032 | Reporting UC-026 eventual | PERF/observability futuro |
| AUTHZ delegação | ADP-003 OPEN | TEST-CAND backlog |
| PERF SLA | TARGET_NOT_DEFINED | performance-test-plan.md |
| Multi-tenant | ADP-014 OPEN | TEST após SEC-DEC-013 |

## Herança catálogos

| Origem | Mapeamento |
| --- | --- |
| TXN-TEST-001..018 | TEST-CAND coluna RISK / títulos |
| SEC-TEST-001..022 | TEST-CAND-005,008,011,014,018,021–028,041,045–048,058 |
| TSC-AUTH-001..018 | TEST-CAND-005,021–028,052 |

## Cobertura INV

22/22 INV possuem ≥1 TEST-CAND (alguns PENDING_SOURCE aguardam validação fonte).

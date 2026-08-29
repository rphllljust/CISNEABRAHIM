# SEC-TEST-REG-001

| Campo         | Valor                        |
| ------------- | ---------------------------- |
| Document ID   | Catálogo testes de segurança |
| Total         | 22 (SEC-TEST-001..022)       |
| Prompt        | 14                           |
| Implementação | NOT STARTED                  |

| ID           | Categoria   | Cenário                           | SEC-THR     | Prioridade   |
| ------------ | ----------- | --------------------------------- | ----------- | ------------ |
| SEC-TEST-001 | AuthN       | Login MFA required finance role   | SEC-THR-001 | HIGH         |
| SEC-TEST-002 | AuthN       | Reject forged JWT                 | SEC-THR-002 | CRITICAL     |
| SEC-TEST-003 | Session     | Session fixation prevented        | SEC-THR-003 | MEDIUM       |
| SEC-TEST-004 | Audit       | Admin action in SECURITY_AUDIT    | SEC-THR-004 | HIGH         |
| SEC-TEST-005 | AuthN       | Login enumeration generic message | SEC-THR-005 | MEDIUM       |
| SEC-TEST-006 | DoS         | Rate limit login lockout          | SEC-THR-006 | MEDIUM       |
| SEC-TEST-007 | AuthZ       | CMD-003 denied low privilege      | SEC-THR-007 | CRITICAL     |
| SEC-TEST-008 | Idem        | CMD-003 idempotent                | SEC-THR-008 | HIGH         |
| SEC-TEST-009 | Audit       | DE-003 on convert                 | SEC-THR-009 | MEDIUM       |
| SEC-TEST-010 | SoD         | Preparer cannot CMD-005           | SEC-THR-010 | CRITICAL     |
| SEC-TEST-011 | Financial   | PO insufficient on release        | SEC-THR-011 | HIGH         |
| SEC-TEST-012 | IDOR        | Cross-scope OS 403                | SEC-THR-012 | CRITICAL     |
| SEC-TEST-013 | Concurrency | Double allocation blocked         | SEC-THR-013 | HIGH         |
| SEC-TEST-014 | AuthZ       | CMD-015 denied executor wrong OS  | SEC-THR-014 | HIGH         |
| SEC-TEST-015 | Data        | API OS JSON no cost field default | SEC-THR-015 | **CRITICAL** |
| SEC-TEST-016 | Export      | Export margin requires AUTHZ-026  | SEC-THR-016 | CRITICAL     |
| SEC-TEST-017 | AuthZ       | Price change post-release denied  | SEC-THR-017 | HIGH         |
| SEC-TEST-018 | SoD         | Self-approve measurement denied   | SEC-THR-018 | CRITICAL     |
| SEC-TEST-019 | Integration | Webhook without HMAC rejected     | SEC-THR-019 | CRITICAL     |
| SEC-TEST-020 | Financial   | Dup invoice key rejected          | SEC-THR-020 | HIGH         |
| SEC-TEST-021 | Audit       | Payment registered audited        | SEC-THR-021 | MEDIUM       |
| SEC-TEST-022 | Storage     | Direct bucket URL 403             | SEC-THR-022 | HIGH         |

Testes adicionais 023–034 mapeados em threat-model para upload, injection, tenant.

## Tipos futuros

| Tipo        | Ferramenta candidata       |
| ----------- | -------------------------- |
| Unit AuthZ  | Vitest mocks               |
| Integration | Supertest + testcontainers |
| SAST        | Semgrep / CodeQL CI        |
| DAST        | OWASP ZAP staging periodic |
| Dependency  | pnpm audit                 |

## Gate release

SEC-TEST CRITICAL all PASS antes prod financeiro.

## Herda

authorization-test-scenarios.md TSC-AUTH-* — mapear duplicatas na implementação.

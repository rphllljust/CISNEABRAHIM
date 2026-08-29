# SEC-INDEX-001

| Campo       | Valor                                            |
| ----------- | ------------------------------------------------ |
| Document ID | Segurança — índice                               |
| Fase        | FOUNDATION — **sem código**                      |
| Prompt      | 14                                               |
| Herda       | SEC-REQ-001..024, AUTHZ Prompt 08, TXN Prompt 13 |

> Threat model e controles **candidatos** implementáveis. Sem conformidade jurídica inventada.

## Arquivos (25)

| Arquivo                                                                | Conteúdo                 |
| ---------------------------------------------------------------------- | ------------------------ |
| [security-scope.md](./security-scope.md)                               | Escopo e exclusões       |
| [asset-register.md](./asset-register.md)                               | SEC-AST-*                |
| [trust-boundaries.md](./trust-boundaries.md)                           | Boundaries               |
| [data-flow-diagrams.md](./data-flow-diagrams.md)                       | DFD candidatos           |
| [threat-model-stride.md](./threat-model-stride.md)                     | STRIDE por fluxo         |
| [abuse-case-catalog.md](./abuse-case-catalog.md)                       | Abuso empresarial        |
| [authentication-architecture.md](./authentication-architecture.md)     | AuthN candidata          |
| [authorization-architecture.md](./authorization-architecture.md)       | AuthZ backend            |
| [session-security.md](./session-security.md)                           | Sessão                   |
| [credential-and-secret-policy.md](./credential-and-secret-policy.md)   | Segredos                 |
| [input-validation-policy.md](./input-validation-policy.md)             | Validação                |
| [file-upload-security.md](./file-upload-security.md)                   | Upload evidência/doc     |
| [api-security-baseline.md](./api-security-baseline.md)                 | API baseline             |
| [data-protection.md](./data-protection.md)                             | Classificação e proteção |
| [logging-and-redaction.md](./logging-and-redaction.md)                 | Redaction                |
| [audit-security.md](./audit-security.md)                               | SECURITY_AUDIT           |
| [dependency-security.md](./dependency-security.md)                     | Dependências             |
| [supply-chain-security.md](./supply-chain-security.md)                 | Supply chain             |
| [environment-security.md](./environment-security.md)                   | Ambientes                |
| [incident-response-baseline.md](./incident-response-baseline.md)       | IR baseline              |
| [security-test-catalog.md](./security-test-catalog.md)                 | SEC-TEST-*               |
| [security-decisions.md](./security-decisions.md)                       | SEC-DEC-*                |
| [residual-risks.md](./residual-risks.md)                               | SEC-RISK-*               |
| [prompt-14-completeness-report.md](./prompt-14-completeness-report.md) | Relatório                |

## Totais

| Artefato                    | Quantidade |
| --------------------------- | ---------- |
| Ativos (SEC-AST)            | 18         |
| Ameaças STRIDE (SEC-THR)    | 36         |
| Casos de abuso (SEC-ABU)    | 16         |
| Controles (SEC-CTL)         | 42         |
| Decisões (SEC-DEC)          | 16         |
| Riscos residuais (SEC-RISK) | 14         |
| Cenários teste (SEC-TEST)   | 22         |
| Fluxos modelados            | 8          |

## Princípios

1. **Autorização no backend** — frontend não é boundary (AGENTS.md §18).
2. **Menor privilégio** — projeção de dados omitida, não só UI oculta.
3. **Custo/margem/documentos** — proteção explícita (SEC-REQ-009/010).
4. **Sem LGPD/certificação afirmada** — decisões privacidade em ADP-005 OPEN.

## Cadeia

```text
SEC-AST → boundary → STRIDE → SEC-CTL → SEC-TEST → SEC-RISK residual
```

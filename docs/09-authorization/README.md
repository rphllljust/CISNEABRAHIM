# AUTHZ-INDEX-001

| Campo             | Valor                                   |
| ----------------- | --------------------------------------- |
| Document ID       | Autorização empresarial — índice        |
| Fonte             | SRC-001; SEC-REQ-001..024               |
| Status documental | CANDIDATE — sem fonte primária validada |
| Gerado em         | 2026-08-28                              |
| Prompt            | 08                                      |

> Modelo **empresarial** de autorização e segregação. **Não** autenticação, JWT, roles técnicas, guards, middleware, código ou tabelas.

## Arquivos (21)

| Arquivo                                                                              | Conteúdo                 |
| ------------------------------------------------------------------------------------ | ------------------------ |
| [authorization-method.md](./authorization-method.md)                                 | Método e identificadores |
| [actor-register.md](./actor-register.md)                                             | ACT-*                    |
| [business-role-candidates.md](./business-role-candidates.md)                         | ROLE-CAND-*              |
| [action-resource-matrix.md](./action-resource-matrix.md)                             | Ação × recurso           |
| [contextual-authorization-rules.md](./contextual-authorization-rules.md)             | Regras contextuais       |
| [segregation-of-duties-matrix.md](./segregation-of-duties-matrix.md)                 | SOD-*                    |
| [sensitive-data-access-matrix.md](./sensitive-data-access-matrix.md)                 | Dados restritos          |
| [command-authorization-matrix.md](./command-authorization-matrix.md)                 | CMD × autorização        |
| [transition-authorization-matrix.md](./transition-authorization-matrix.md)           | TR-CAND × autorização    |
| [document-access-policy.md](./document-access-policy.md)                             | Documentos               |
| [financial-visibility-policy.md](./financial-visibility-policy.md)                   | Custo/preço/margem       |
| [delegation-and-substitution-analysis.md](./delegation-and-substitution-analysis.md) | Delegação                |
| [emergency-access-analysis.md](./emergency-access-analysis.md)                       | Acesso emergencial       |
| [authorization-denial-catalog.md](./authorization-denial-catalog.md)                 | DENY-*                   |
| [authorization-audit-requirements.md](./authorization-audit-requirements.md)         | Auditoria                |
| [access-scope-candidates.md](./access-scope-candidates.md)                           | Escopos                  |
| [authorization-conflicts.md](./authorization-conflicts.md)                           | Conflitos                |
| [authorization-decisions-pending.md](./authorization-decisions-pending.md)           | ADP-*                    |
| [authorization-test-scenarios.md](./authorization-test-scenarios.md)                 | Cenários futuros         |
| [prompt-08-completeness-report.md](./prompt-08-completeness-report.md)               | Relatório                |

## Totais

| Artefato                                   | Quantidade |
| ------------------------------------------ | ---------- |
| Atores (ACT)                               | 12         |
| Papéis empresariais candidatos (ROLE-CAND) | 16         |
| Regras de autorização (AUTHZ)              | 42         |
| Conflitos SoD (SOD)                        | 12         |
| Ações sensíveis mapeadas                   | 28         |
| Decisões pendentes (ADP)                   | 14         |
| Negações catalogadas (DENY)                | 18         |
| Roles técnicas criadas                     | **0**      |
| Código / script                            | **0**      |

## Cadeia

```text
ACT → ROLE-CAND → AUTHZ → CMD/TR → SOD → DENY
         ↑ SEC-REQ, INV, DDP, FR/UC
```

## Princípio central

**Administrador técnico ≠ Autorizador empresarial.** TI opera infraestrutura; não herda poder de liberar OS, alterar preço ou registrar pagamento sem regra explícita.

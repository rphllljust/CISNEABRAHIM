# AUTHZ-CFL-001

| Campo       | Valor                    |
| ----------- | ------------------------ |
| Document ID | Conflitos de autorização |
| Prompt      | 08                       |

| ID           | Conflito                                 | Fontes                        | Impacto                  | Resolução candidata                 | Status    |
| ------------ | ---------------------------------------- | ----------------------------- | ------------------------ | ----------------------------------- | --------- |
| AUTH-CFL-001 | RBAC técnico vs alçada empresarial       | BND-CFL-010; SEC-REQ-001..003 | Liberação indevida       | Modelo empresarial primeiro         | OPEN      |
| AUTH-CFL-002 | Admin TI vs Autorizador                  | SOD-012; naming-policy        | Poder total              | Negar por padrão                    | CANDIDATE |
| AUTH-CFL-003 | Responsável = Executor mesma pessoa      | DDP-032                       | SoD-003 ambíguo          | ADP-012                             | AMBIGUOUS |
| AUTH-CFL-004 | Preparador libera própria OS             | DDP-022; SOD-002              | Bypass controle          | Bloquear até decisão                | PENDING   |
| AUTH-CFL-005 | Medição: mesmo analista submete e aprova | SOD-004                       | Fraude                   | Bloquear candidato                  | PENDING   |
| AUTH-CFL-006 | Financeiro único faz tudo                | SOD-005, SOD-009              | Desvio                   | Separar papéis candidatos           | PENDING   |
| AUTH-CFL-007 | GLOBAL_SCOPE vs menor privilégio         | SEC-REQ-019                   | Vazamento multi-cliente  | Escopo restritivo default           | OPEN      |
| AUTH-CFL-008 | UI mostra botão sem permissão            | AGENTS.md §18                 | Falsa sensação segurança | Backend boundary                    | CANDIDATE |
| AUTH-CFL-009 | BC-001 absorve BC-006 auth               | DBND decisão                  | Modelo errado            | BC-001 identidade; BC-006 alçada OS | OPEN      |
| AUTH-CFL-010 | Integração confia resposta externa       | SEC-REQ-021                   | AuthZ falsa              | Validação local                     | CANDIDATE |

## Conflitos com estado AMBIGUOUS preservados

- TERM-007 Autorizador empresarial
- TERM-008 Responsável pela OS
- ASSIGNED como escopo

Não resolver por conveniência técnica — registrar ADP.

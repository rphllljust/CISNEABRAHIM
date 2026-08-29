# AUTHZ-SENS-001

| Campo       | Valor                              |
| ----------- | ---------------------------------- |
| Document ID | Matriz de acesso a dados sensíveis |
| Categorias  | 10                                 |
| Prompt      | 08                                 |

> Acesso à OS **não** implica acesso a todos os seus dados.

## Por categoria de dado

| Dado                    | TERM      | Quem pode ver (candidato)      | Quem não vê                        | Escopo             | AUTHZ     | SEC-REQ     |
| ----------------------- | --------- | ------------------------------ | ---------------------------------- | ------------------ | --------- | ----------- |
| Custo interno           | TERM-020  | ROLE-CAND-013                  | Executor, Responsável, Solicitante | FINANCIAL          | AUTHZ-015 | SEC-REQ-009 |
| Preço comercial         | TERM-021  | 012, 002, 013                  | Executor (default)                 | FINANCIAL/CONTRACT | AUTHZ-014 | SEC-REQ-007 |
| Margem                  | TERM-022  | ROLE-CAND-013                  | Maioria operacional                | FINANCIAL          | AUTHZ-016 | SEC-REQ-009 |
| Documentos críticos     | TERM-031+ | 014, 002, partes envolvidas    | Demais                             | DOCUMENT           | AUTHZ-039 | SEC-REQ-010 |
| Dados pessoais          | —         | Necessidade operacional mínima | Exportação ampla                   | UNKNOWN            | ADP-005   | NFR-010     |
| Localização             | —         | Executor, Responsável (campo)  | Financeiro                         | ASSIGNED           | PENDING   | —           |
| Nota/fatura             | TERM-018  | 010, 011, 013                  | Operacional puro                   | FINANCIAL          | AUTHZ-023 | SEC-REQ-006 |
| Pagamento               | TERM-019  | 011, 013                       | Operacional                        | FINANCIAL          | AUTHZ-024 | DDP-012     |
| Audit trail empresarial | —         | 002, 013, auditoria futura     | Alteração por usuário              | —                  | AUTHZ-026 | SEC-REQ-024 |
| Credenciais/segredos    | —         | 015 (técnico)                  | Todos negócio                      | —                  | —         | SEC-REQ-013 |

## Por recurso — visão agregada

| Recurso          | Campo visível default        | Campo oculto default        |
| ---------------- | ---------------------------- | --------------------------- |
| OS (operacional) | Descrição, status, itens qty | Custo, margem               |
| OS (financeiro)  | Preço, totais                | — (se autorizado)           |
| Solicitação      | Dados do pedido              | Custo estimado?             |
| Medição          | Quantidades                  | Valor financeiro detalhado? |
| Documento        | Metadados                    | Binário se restrito         |

## Regras candidatas

1. **Menor privilégio:** campos sensíveis omitidos na projeção, não apenas ocultos na UI.
2. **Exportação:** AUTHZ-026 exige papel explícito + log SECURITY_AUDIT.
3. **Responsável pela OS:** vê operacional; custo/margem negados salvo exceção ADP-006.
4. **Admin técnico:** acesso a logs técnicos; **não** a custo/margem empresarial por padrão.

## Efeito financeiro

Leitura de custo/margem sem autorização = violação INV-006 candidata → DENY-006, REJ-006.

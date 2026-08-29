# AUTHZ-ARM-001

| Campo | Valor |
| --- | --- |
| Document ID | Matriz ação × recurso |
| Ações sensíveis mapeadas | 28 |
| Prompt | 08 |

> Ação sensível = altera estado, expõe dado restrito ou tem efeito financeiro.

| # | Ação candidata | Recurso | ROLE-CAND | Escopo | Criticidade | AUTHZ |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Registrar solicitação | Solicitação | 001 | OWN_RECORD | Baixa | AUTHZ-001 |
| 2 | Decidir solicitação | Solicitação | 002 | OPERATIONAL | Alta | AUTHZ-002 |
| 3 | Converter em OS | Solicitação/OS | 002, 003 | OPERATIONAL | Média | AUTHZ-003 |
| 4 | Preparar OS | OS | 003 | OPERATIONAL | Média | AUTHZ-004 |
| 5 | Liberar OS | OS | 002 | OPERATIONAL | **Crítica** | AUTHZ-005 |
| 6 | Atribuir responsável | OS | 002, 003 | OPERATIONAL | Média | AUTHZ-006 |
| 7 | Confirmar recebimento | OS | 005 | ASSIGNED | Baixa | AUTHZ-007 |
| 8 | Iniciar execução | OS/Execução | 004 | ASSIGNED | Alta | AUTHZ-008 |
| 9 | Registrar progresso | Execução | 004 | ASSIGNED | Média | AUTHZ-009 |
| 10 | Concluir OS | OS | 004, 002? | ASSIGNED | Alta | AUTHZ-010 |
| 11 | Cancelar OS | OS | 002 | OPERATIONAL | **Crítica** | AUTHZ-011 |
| 12 | Reabrir OS | OS | 002 | OPERATIONAL | **Crítica** | AUTHZ-012 |
| 13 | Alterar OS | OS | 003, 002 | OPERATIONAL | Alta | AUTHZ-013 |
| 14 | Alterar preço | OS/Item | 012, 002 | FINANCIAL | **Crítica** | AUTHZ-014 |
| 15 | Ver custo interno | OS/Item | 013 | FINANCIAL | **Crítica** | AUTHZ-015 |
| 16 | Ver margem | OS/Item | 013 | FINANCIAL | **Crítica** | AUTHZ-016 |
| 17 | Planejar recursos | Alocação | 006 | OPERATIONAL | Média | AUTHZ-017 |
| 18 | Alocar recurso | Alocação | 006 | OPERATIONAL | Alta | AUTHZ-018 |
| 19 | Anexar evidência | Documento | 004, 014 | DOCUMENT | Média | AUTHZ-019 |
| 20 | Submeter medição | Medição | 007 | OPERATIONAL | Alta | AUTHZ-020 |
| 21 | Decidir medição | Medição | 008 | OPERATIONAL | **Crítica** | AUTHZ-021 |
| 22 | Preparar faturamento | Faturamento | 009 | FINANCIAL | **Crítica** | AUTHZ-022 |
| 23 | Registrar nota | Nota | 010 | FINANCIAL | **Crítica** | AUTHZ-023 |
| 24 | Registrar pagamento | Pagamento | 011 | FINANCIAL | **Crítica** | AUTHZ-024 |
| 25 | Substituir documento | Documento | 014 | DOCUMENT | Alta | AUTHZ-025 |
| 26 | Exportar dados sensíveis | Vários | 013, 002 | GLOBAL? | **Crítica** | AUTHZ-026 |
| 27 | Provisionar acesso | Identidade | 016 | GLOBAL | **Crítica** | AUTHZ-027 |
| 28 | Administrar infra técnica | Sistema | 015 | — (técnico) | Alta | AUTHZ-028 |

## Leitura

- Coluna ROLE-CAND lista papéis **candidatos** — não implica que todos sejam distintos fisicamente.
- Ações 5, 11, 14, 21–24 exigem auditoria SECURITY_AUDIT (SEC-REQ-024).

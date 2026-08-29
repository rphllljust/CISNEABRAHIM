# AUTHZ-FIN-001

| Campo       | Valor                               |
| ----------- | ----------------------------------- |
| Document ID | Política de visibilidade financeira |
| TERM        | TERM-020, TERM-021, TERM-022        |
| Prompt      | 08                                  |

## Princípio

Dados financeiros são **camadas** sobre recursos operacionais — não campos públicos da OS.

## Matriz de visibilidade

| Papel candidato                   | Custo          | Preço                | Margem     | Nota       | Pagamento  |
| --------------------------------- | -------------- | -------------------- | ---------- | ---------- | ---------- |
| ROLE-CAND-001 Solicitante         | Oculto         | Parcial?             | Oculto     | Oculto     | Oculto     |
| ROLE-CAND-003 Preparador          | Oculto default | Ver/editar candidato | Oculto     | Oculto     | Oculto     |
| ROLE-CAND-004 Executor            | **Oculto**     | Oculto               | **Oculto** | Oculto     | Oculto     |
| ROLE-CAND-005 Responsável         | **Oculto**     | Operacional?         | **Oculto** | Oculto     | Oculto     |
| ROLE-CAND-012 Comercial           | Candidato      | Sim                  | Candidato  | Parcial    | Oculto     |
| ROLE-CAND-013 Financeiro restrito | Sim            | Sim                  | Sim        | Sim        | Sim        |
| ROLE-CAND-015 Admin técnico       | **Oculto**     | **Oculto**           | **Oculto** | **Oculto** | **Oculto** |

`?` = PENDING_SOURCE_VALIDATION

## Alteração de preço (SEC-REQ-007)

| Estado OS          | Quem altera        | Quem aprova            |
| ------------------ | ------------------ | ---------------------- |
| Rascunho/Preparada | 003, 012 candidato | —                      |
| Liberada+          | 012 candidato      | 002 (alçada) — SOD-006 |
| Pós-faturamento    | ADP-008            | —                      |

## Cadeia financeira e autorização

```text
Medição aprovada --auth--> Preparar faturamento (009)
       --auth--> Liberar faturamento (002/009?)
       --auth--> Registrar nota (010)
       --auth--> Registrar pagamento (011)
```

Cada elo com SoD candidato (SOD-005, SOD-009).

## Invariantes

- INV-006 — custo não exposto (REJ-006)
- INV-007, INV-011 — integridade financeira

## Exportação

Exportar planilha com custo/margem → AUTHZ-026 + SEC-REQ-016.

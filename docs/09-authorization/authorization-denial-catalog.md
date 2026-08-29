# AUTHZ-DENY-001

| Campo       | Valor                               |
| ----------- | ----------------------------------- |
| Document ID | Catálogo de negações de autorização |
| Total       | 18 (DENY-001..018)                  |
| Prompt      | 08                                  |

> Complementa REJ-* (Prompt 06) com foco em **autorização e acesso**.

| ID       | Situação                      | Ator típico       | Motivo             | REJ/SEC     | Audit          |
| -------- | ----------------------------- | ----------------- | ------------------ | ----------- | -------------- |
| DENY-001 | Decidir solicitação sem papel | 001, 004          | Papel insuficiente | REJ-001     | SECURITY_AUDIT |
| DENY-002 | Converter sem decisão         | 001               | Pré-condição       | REJ-014     | Sim            |
| DENY-003 | Liberar OS sem alçada         | 003, 004, 015     | SEC-REQ-003        | REJ-003     | **Sim**        |
| DENY-004 | Executar OS não liberada      | 004               | Estado             | REJ-004     | Sim            |
| DENY-005 | Concluir sem progresso        | 004               | Guarda             | REJ-006     | Sim            |
| DENY-006 | Cancelar sem alçada           | 003, 004          | DDP-004            | REJ-007     | **Sim**        |
| DENY-007 | Reabrir sem decisão           | 003               | DDP-005            | —           | Sim            |
| DENY-008 | Alterar OS terminal           | 004               | Estado             | REJ-008     | Sim            |
| DENY-009 | Alocar sem planejamento       | 004               | PRED-002           | REJ-005     | Sim            |
| DENY-010 | Medição fora de escopo        | 001               | Escopo             | —           | Sim            |
| DENY-011 | Aprovar própria medição       | 007               | SOD-004            | SEC-REQ-005 | **Sim**        |
| DENY-012 | Faturar sem medição           | 009               | GUARD-016          | —           | Sim            |
| DENY-013 | Liberar faturamento indevido  | 004               | GUARD-017          | —           | Sim            |
| DENY-014 | Registrar nota não autorizado | 004               | SEC-REQ-006        | REJ-010     | **Sim**        |
| DENY-015 | Registrar pagamento           | 003, 010          | SOD-005            | —           | **Sim**        |
| DENY-016 | Substituir doc sem papel      | 004               | SEC-REQ-010        | —           | Sim            |
| DENY-017 | Delegação expirada            | Substituto        | AUTHZ-042          | —           | Sim            |
| DENY-018 | Acesso URL direto             | Qualquer não auth | Bypass UI          | SEC-REQ-001 | **Sim**        |

## Detalhe DENY-003

| Campo                          | Valor                                                       |
| ------------------------------ | ----------------------------------------------------------- |
| Mensagem empresarial candidata | "Liberação exige autorizador empresarial com alçada válida" |
| Dados vazados                  | Nenhum — resposta genérica (anti-enumeração SEC-REQ-015)    |
| Criticidade                    | HIGH                                                        |

## Detalhe DENY-006 (custo)

| Campo    | Valor                 |
| -------- | --------------------- |
| Situação | Consulta custo/margem |
| Motivo   | INV-006; AUTHZ-015    |
| REJ      | REJ-006               |

## Admin técnico

Tentativas de ACT-010 em CMD-005, CMD-014, CMD-021 → DENY-003, DENY-014, DENY-015 por padrão (SOD-012).

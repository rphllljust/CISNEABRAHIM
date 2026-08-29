# AUTHZ-TR-001

| Campo                | Valor                          |
| -------------------- | ------------------------------ |
| Document ID          | Matriz transição × autorização |
| Transições sensíveis | 24 de 48 TR-CAND               |
| Prompt               | 08                             |

> Transições não listadas: autorização herda do CMD correspondente ou leitura não-modelada.

| TR-CAND          | Transição                   | CMD     | ROLE-CAND | Guarda auth        | DENY se falha |
| ---------------- | --------------------------- | ------- | --------- | ------------------ | ------------- |
| TR-CAND-001..003 | Solicitação análise/decisão | CMD-002 | 002       | GUARD-001..003     | DENY-001      |
| TR-CAND-004      | Converter                   | CMD-003 | 002, 003  | GUARD-004          | DENY-002      |
| TR-CAND-007      | Liberar OS                  | CMD-005 | 002       | GUARD-006, 007     | DENY-003      |
| TR-CAND-009      | EM_EXECUCAO                 | CMD-008 | 004       | GUARD-008          | DENY-004      |
| TR-CAND-010      | CONCLUIDA                   | CMD-010 | 004       | GUARD-009          | DENY-005      |
| TR-CAND-011      | CANCELADA                   | CMD-011 | 002       | GUARD-010          | DENY-006      |
| TR-CAND-012      | Reabrir                     | CMD-012 | 002       | GUARD-011          | DENY-007      |
| TR-CAND-015      | Alterar OS                  | CMD-013 | 003, 002  | GUARD-012          | DENY-008      |
| TR-CAND-016      | Alocar                      | CMD-015 | 006       | GUARD-013          | DENY-009      |
| TR-CAND-025      | Submeter medição            | CMD-017 | 007       | GUARD-023          | DENY-010      |
| TR-CAND-027      | Aprovar medição             | CMD-018 | 008       | GUARD-014, SOD-004 | DENY-011      |
| TR-CAND-028      | Rejeitar medição            | CMD-018 | 008       | GUARD-014          | DENY-011      |
| TR-CAND-036      | Preparar faturamento        | CMD-019 | 009       | GUARD-016          | DENY-012      |
| TR-CAND-038      | Liberar faturamento         | —       | 002, 009? | GUARD-017          | DENY-013      |
| TR-CAND-040      | Registrar nota              | CMD-020 | 010       | GUARD-018          | DENY-014      |
| TR-CAND-044      | Registrar pagamento         | CMD-021 | 011       | GUARD-019          | DENY-015      |
| TR-CAND-033      | Substituir doc              | CMD-022 | 014       | PRED-009           | DENY-016      |

## Transições com autorização contextual adicional

| TR-CAND     | Condição contextual                        | AUTHZ               |
| ----------- | ------------------------------------------ | ------------------- |
| TR-CAND-007 | Preparador ≠ liberador (SOD-002)           | AUTHZ-005 + SOD-002 |
| TR-CAND-027 | Submissor ≠ aprovador                      | AUTHZ-035           |
| TR-CAND-040 | Preparador faturamento ≠ registrador nota? | SOD-009 candidato   |
| TR-CAND-044 | Preparador ≠ pagador                       | AUTHZ-038, SOD-005  |

## Transições sem ator humano

| TR-CAND     | Notas                                                    |
| ----------- | -------------------------------------------------------- |
| TR-CAND-047 | Notificação — ator sistema; não confundir com ACK humano |
| TR-CAND-020 | Integração DE-020 — ACT-011; SEC-REQ-021                 |

## Princípio

Autorização de transição = autorização do CMD + guardas GUARD-* + regras contextuais AUTHZ-029+.

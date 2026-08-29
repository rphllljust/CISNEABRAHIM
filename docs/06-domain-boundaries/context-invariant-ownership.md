# DBND-INV-OWN-001

| Campo       | Valor                                 |
| ----------- | ------------------------------------- |
| Document ID | Ownership de invariantes por contexto |
| Prompt      | 05                                    |

| Invariante candidata                               | BC enforcer          | BR / NFR         | Status    |
| -------------------------------------------------- | -------------------- | ---------------- | --------- |
| Uma solicitação lógica por intenção (idempotência) | BC-CAND-005          | NFR-002; BR-004  | CANDIDATE |
| Uma OS por solicitação (conversão)                 | BC-CAND-006          | NFR-003; BR-001  | CANDIDATE |
| OS liberada exige elegibilidade + autorização      | BC-CAND-006          | NFR-004; BR-006  | CANDIDATE |
| Recurso não duplamente alocado (exclusivo)         | BC-CAND-007          | NFR-005; BR-017  | CANDIDATE |
| Custo ≠ preço comercial (visibilidade)             | BC-CAND-003          | NFR-008; BR-018  | CANDIDATE |
| Medição referencia origem executada                | BC-CAND-010          | VR-018; FR-035   | PENDING   |
| SoD: decisor ≠ preparador medição                  | BC-CAND-010          | NFR-013; BR-009  | PENDING   |
| Faturamento exige origem identificável             | BC-CAND-011          | NFR-011; BR-014  | CANDIDATE |
| Sem emissão fiscal pelo sistema                    | BC-CAND-012          | BR-015; TERM-018 | CANDIDATE |
| Versão documental anterior preservada              | BC-CAND-014          | NFR-009; BR-016  | CANDIDATE |
| Histórico OS append-only empresarial               | BC-CAND-017          | NFR-006; BR-023  | CANDIDATE |
| Integração não gera sucesso local falso            | BC-CAND-018          | NFR-012; BR-005  | CANDIDATE |
| Cancelamento ⊥ conclusão (estado)                  | BC-CAND-006 / BC-008 | FR-020 vs FR-019 | CANDIDATE |
| PO consumo ≤ saldo autorizado                      | BC-CAND-004          | EV-060; DDP-009  | PENDING   |

Invariantes **transversais** (autenticação, auditoria de segurança) em BC-CAND-001 com participação dos BCs de operação.

Nenhum invariante promovido a implementação neste prompt.

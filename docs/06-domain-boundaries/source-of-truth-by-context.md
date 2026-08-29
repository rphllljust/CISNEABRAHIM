# DBND-SOT-001

| Campo       | Valor                                   |
| ----------- | --------------------------------------- |
| Document ID | Source of Truth por contexto e artefato |
| Fonte       | SRC-001, DDP-020                        |
| Prompt      | 05                                      |

| Artefato                  | SoT candidato                    | BC write owner         | Réplica permitida              | DDP     |
| ------------------------- | -------------------------------- | ---------------------- | ------------------------------ | ------- |
| Solicitação               | Sistema CISNE (futuro)           | BC-CAND-005            | BC-CAND-016 read               | —       |
| OS e histórico            | Sistema CISNE                    | BC-CAND-006            | BC-CAND-016                    | —       |
| Cliente cadastro          | Interno ou ERP                   | BC-CAND-002 / externo  | BC-CAND-003                    | DDP-020 |
| Contrato / proposta       | ERP ou interno                   | BC-CAND-003 / externo  | BC-CAND-006                    | DDP-030 |
| Purchase Order            | **Cliente / ERP candidato**      | BC-CAND-004 ou externo | BC-CAND-006                    | DDP-009 |
| Saldo PO                  | Mesmo SoT do PO                  | BC-CAND-004            | BC-CAND-003                    | DDP-009 |
| Preço comercial publicado | ERP candidato                    | Externo via BC-018     | BC-CAND-003                    | DDP-020 |
| Custo interno             | Sistema CISNE                    | BC-CAND-003            | —                              | DDP-030 |
| Alocação recurso          | Sistema CISNE                    | BC-CAND-007            | —                              | —       |
| Execução / realizado      | Sistema CISNE                    | BC-CAND-008            | —                              | —       |
| Medição                   | Sistema CISNE                    | BC-CAND-010            | —                              | DDP-010 |
| Preparação faturamento    | Sistema CISNE                    | BC-CAND-011            | —                              | DDP-011 |
| Nota fiscal emitida       | **Sistema fiscal externo**       | Externo                | BC-CAND-012 registro informado | DDP-023 |
| Pagamento                 | **Financeiro externo candidato** | Externo                | BC-CAND-013 tracking           | DDP-012 |
| Documento / versão        | Sistema CISNE                    | BC-CAND-014            | —                              | DDP-013 |
| AUDIT_TRAIL               | Sistema CISNE                    | BC-CAND-017            | —                              | DDP-015 |
| Identidade login          | IdP futuro                       | BC-CAND-001 / externo  | —                              | DDP-015 |

**Regra:** quando SoT é externo, BC interno atua como **réplica** ou **registro informado**, nunca como emissor autoritativo sem decisão (DDP-020).

Nenhum SoT inventado além do evidenciado ou explicitamente pendente.

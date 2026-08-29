# DBND-DATA-OWN-001

| Campo       | Valor                           |
| ----------- | ------------------------------- |
| Document ID | Ownership de dados por contexto |
| Prompt      | 05                              |

> Um write owner por agregado lógico candidato. Duplicidade exige política explícita.

| Dado / conceito                 | TERM               | Write owner                      | Referência apenas             | SoT                   | Política conflito  |
| ------------------------------- | ------------------ | -------------------------------- | ----------------------------- | --------------------- | ------------------ |
| Solicitação de serviço          | TERM-001           | BC-CAND-005                      | BC-CAND-006, BC-CAND-016      | Interno               | —                  |
| Ordem de Serviço                | TERM-002           | BC-CAND-006                      | BC-CAND-007..012, BC-CAND-016 | Interno               | DBND-003           |
| Cliente / party                 | TERM-004           | BC-CAND-002                      | BC-CAND-005, BC-CAND-003      | Interno / ERP TBD     | DDP-020            |
| Referência comercial            | TERM-015           | BC-CAND-003                      | BC-CAND-006                   | Misto                 | ACL via BC-018     |
| Purchase Order                  | TERM-013           | BC-CAND-004                      | BC-CAND-006, BC-CAND-003      | **Externo candidato** | DDP-009            |
| Saldo PO                        | —                  | BC-CAND-004                      | BC-CAND-003                   | BC-CAND-004           | DDP-009            |
| Recurso alocado                 | TERM-030           | BC-CAND-007                      | BC-CAND-006, BC-CAND-008      | Interno               | NFR-005            |
| Quantidade realizada            | TERM-024           | BC-CAND-008                      | BC-CAND-010                   | Interno               | NFR-001            |
| Evidência execução              | TERM-034           | BC-CAND-009                      | BC-CAND-014                   | Interno               | Arquivo em BC-014  |
| Documento lógico / versão       | TERM-031, TERM-032 | BC-CAND-014                      | BC-CAND-009, BC-CAND-012      | Interno               | NFR-009            |
| Arquivo binário                 | TERM-033           | BC-CAND-014                      | —                             | Interno               | storageKey técnico |
| Medição                         | TERM-016           | BC-CAND-010                      | BC-CAND-011                   | Interno               | DBND-004           |
| Item faturável / origem         | TERM-040, TERM-041 | BC-CAND-011                      | BC-CAND-012                   | Interno               | DDP-011            |
| Documento faturamento informado | TERM-018           | BC-CAND-012                      | BC-CAND-013                   | Misto fiscal          | DDP-023            |
| Pagamento                       | TERM-019           | **TBD** — BC-CAND-013 ou externo | BC-CAND-012                   | **Externo candidato** | DDP-012            |
| Custo interno                   | TERM-020           | BC-CAND-003                      | BC-CAND-006                   | Interno               | NFR-008            |
| Preço comercial                 | TERM-021           | BC-CAND-003                      | BC-CAND-006                   | Interno / ERP         | NFR-008            |
| Margem                          | TERM-022           | BC-CAND-003 (cálculo)            | BC-CAND-016                   | Derivado              | DDP-031            |
| Identidade ator                 | —                  | BC-CAND-001                      | Todos                         | IdP futuro            | DDP-015            |
| AUDIT_TRAIL / DOMAIN_HISTORY    | TERM-044           | BC-CAND-017                      | —                             | Interno append-only   | NFR-029            |
| Identificador externo comercial | TERM-048           | BC-CAND-018 (sync)               | BC-CAND-003                   | Externo               | NFR-012            |

**Conflitos sem política fechada:** pagamento (DDP-012), PO SoT (DDP-009), medição como entidade (DBND-004).

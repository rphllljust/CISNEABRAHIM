# QA-SM-001

| Campo       | Valor                              |
| ----------- | ---------------------------------- |
| Document ID | Catálogo testes máquinas de estado |
| SM total    | 10 SM-CAND                         |
| Prompt      | 15                                 |

## Por SM

| SM                      | Transições críticas TEST           | TEST-CAND            |
| ----------------------- | ---------------------------------- | -------------------- |
| SM-CAND-001 Solicitação | register, decide, convert          | 030, 001             |
| SM-CAND-002 OS          | prepare, release, complete, cancel | 031, 005,007,029,010 |
| SM-CAND-003 Alocação    | allocate, release                  | 019,020              |
| SM-CAND-004 Execução    | start, progress, complete          | 039,040              |
| SM-CAND-005 Medição     | submit, approve, reject            | 017,018,032          |
| SM-CAND-006 Documento   | publish, supersede                 | 035,058              |
| SM-CAND-007 Faturamento | prepare                            | 041                  |
| SM-CAND-008 Nota        | register                           | 011                  |
| SM-CAND-009 Pagamento   | register                           | 012                  |
| SM-CAND-010 Notificação | deliver                            | backlog              |

## TR-CAND negativos

| TR-CAND     | Teste ilegal                   | TEST-CAND |
| ----------- | ------------------------------ | --------- |
| TR-CAND-003 | Converter SR já convertida     | 001       |
| TR-CAND-008 | Liberar não PREPARADA          | 007       |
| TR-CAND-010 | Iniciar exec sem LIBERADA      | 039       |
| TR-CAND-015 | Concluir e cancelar            | 029       |
| TR-CAND-018 | Submit medição estado inválido | 032       |

## Nível

Illegal transition → **L1** guard unit (rápido, sem PG).

Legal transition com side-effect → **L4** integration.

## GUARD-*

Cada GUARD documentado em transition-guard-register.md → espelhar assert em L1.

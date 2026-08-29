# DBND-EXTRACT-001

| Campo | Valor |
| --- | --- |
| Document ID | Prontidão para extração futura de contexto |
| Prompt | 05 |

> **Não** planejar microserviços agora. Critérios para reavaliar separação física.

## Critérios de extração (todos desejáveis; nenhum medido)

| Critério | Descrição | BC mais provável no futuro | Dado atual |
| --- | --- | --- | --- |
| Autonomia real | Equipe dona pode evoluir sem coordenar todos BCs | BC-015 Notification, BC-016 Reporting | UNKNOWN equipe |
| Carga distinta | Pico de leitura vs escrita | BC-016 | TARGET_NOT_DEFINED |
| Escala independente | Necessidade de escalar só um domínio | BC-018 Integration | LOW evidência |
| Ownership de equipe | Conway alinhado | — | UNKNOWN |
| Frequência de mudança | Domínio volátil isolado | BC-021 N/A; BC-015 | UNKNOWN |
| Disponibilidade | SLA diferente por parte | BC-018 | TARGET_NOT_DEFINED |
| Isolamento falha | Falha não derruba núcleo | BC-018, BC-015 | Candidato teórico |
| Dependência baixa | Poucos sync calls | BC-015, BC-016 | Reporting EVENTUAL |
| Consistência relaxada | EVENTUAL_ACCEPTABLE | BC-016, BC-015, BC-013 réplica | Aplicável |
| Custo operacional | Justificar ops de serviço extra | — | UNKNOWN |

## Ranking candidato de extração (hipótese fraca — revalidar)

| Prioridade extração | BC | Motivo |
| --- | --- | --- |
| 1 (mais cedo, se necessário) | BC-CAND-016 Reporting | Read-only; EVENTUAL_ACCEPTABLE |
| 2 | BC-CAND-015 Notification | Side effect; falha isolável |
| 3 | BC-CAND-018 Integration | Já é borda; natural como adaptador |
| 4 | BC-CAND-013 Payment | Se SoT 100% externo — BC reduzido |
| **Evitar cedo** | BC-005..012 núcleo | Transações fortes WF-001..006 |

## Anti-padrões de extração prematura

- Separar BC-006 e BC-008 antes de fechar estados OS (DDP-001, DDP-003).
- Separar medição e faturamento antes de DDP-010/011.
- Microserviço por entidade (Cliente, OS, PO).

## Gate para extração

Exigir: DBND resolvido, ADR futuro, métricas de acoplamento, testes de contrato — **Prompt 09+**.

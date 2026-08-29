# DBEH-TXN-001

| Campo       | Valor                                  |
| ----------- | -------------------------------------- |
| Document ID | Classificação transacional por comando |
| Prompt      | 06                                     |

| CMD             | Classificação                | Atomicidade candidata | Efeito local       | Efeito externo   | Falha parcial             | Retry         | Compensação            | Reconciliação           | Observável     |
| --------------- | ---------------------------- | --------------------- | ------------------ | ---------------- | ------------------------- | ------------- | ---------------------- | ----------------------- | -------------- |
| CMD-001         | STRONG_WITHIN_BOUNDARY       | Sim                   | Solicitação criada | —                | Sem solicitação órfã      | IDEM          | —                      | —                       | ID solicitação |
| CMD-003         | STRONG_TRANSACTIONAL         | Sim                   | OS + vínculo       | —                | Rollback ambos            | Não dup       | Manual                 | Comparar solicitação/OS | OS id          |
| CMD-005         | STRONG_WITHIN_BOUNDARY       | Sim                   | Estado liberado    | Notif. candidata | Estado inconsistente      | Único release | Reverter liberação TBD | Auditoria               | Estado OS      |
| CMD-015         | STRONG_WITHIN_BOUNDARY       | Sim                   | Alocação           | —                | Conflito exposto          | —             | Desalocar TBD          | —                       | Alocação id    |
| CMD-017         | STRONG_WITHIN_BOUNDARY       | Sim                   | Medição            | —                | Medição parcial           | IDEM          | —                      | —                       | Medição id     |
| CMD-019         | STRONG_TRANSACTIONAL         | Candidato             | Itens faturáveis   | —                | Rollback prep             | —             | —                      | vs medição              | Prep id        |
| CMD-020         | STRONG_WITHIN_BOUNDARY       | Sim                   | Registro nota      | ERP opcional     | Nota sem origem bloqueada | IDEM          | Estorno TBD            | Financeiro              | Nota ref       |
| CMD-021         | EVENTUAL_WITH_RECONCILIATION | Depende SoT           | Registro local     | ERP/banco        | Duplicidade               | IDEM          | Estorno                | Conciliação             | Pagamento ref  |
| CMD-022         | STRONG_WITHIN_BOUNDARY       | Sim                   | Nova versão        | —                | Versão perdida            | —             | —                      | Histórico               | Versão id      |
| UC-026 consulta | REPORTING_ONLY               | N/A                   | Leitura            | —                | —                         | SAFE          | —                      | —                       | Dataset        |

**Alternativas futuras (não escolhidas):** transação local, saga, outbox — registradas em behavior-open-decisions.md.

Não escolher outbox ou lock neste prompt.

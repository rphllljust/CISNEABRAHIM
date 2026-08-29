# Definition of Done (DoD)

| Campo       | Valor                                                                            |
| ----------- | -------------------------------------------------------------------------------- |
| Document ID | DOD-001                                                                          |
| Source      | SRC-000                                                                          |
| Status      | Política documentada; **não** aplicável a código nesta fase (código inexistente) |

A DoD abaixo é a política **futura**. No Prompt 00 apenas se documenta. Nenhum incremento de produto pode ser declarado Done.

Não usar a palavra “pronto” sem evidência dos itens aplicáveis ao risco do incremento.

## Critérios conforme o risco

Quando houver implementação autorizada, o Done do incremento considera, **conforme o risco** (nem todo item exige todos os testes na mesma intensidade):

| Área                       | Exigência                                                          |
| -------------------------- | ------------------------------------------------------------------ |
| Regra protegida no backend | A regra crítica não é contornável só no cliente                    |
| Persistência               | Estado acordado é gravado no sistema de registro definido          |
| Constraints                | Invariantes refletidas em restrições persistentes quando couber    |
| Transação                  | Atomicidade dos efeitos que devem ser atômicos                     |
| Autorização                | Recusa comprovada para ator não autorizado no contexto             |
| Concorrência               | Estratégia testada para o risco de lost update / dupla alocação    |
| Idempotência               | Reexecução segura das operações sensíveis                          |
| Histórico                  | Histórico de domínio retido conforme regra                         |
| Audit trail                | Trilha distinta de log técnico, quando o risco exigir              |
| Logs                       | Logs técnicos sem vazar segredo ou dado excessivo                  |
| Métricas                   | Sinais mínimos do incremento crítico                               |
| Tratamento de erros        | Falha externa não vira sucesso local falso                         |
| Testes unitários           | Comportamento de domínio e regras                                  |
| Testes de integração       | Persistência, transação, autorização                               |
| Testes de segurança        | Controles do threat model aplicável                                |
| Testes de concorrência     | Quando o risco (RISK-*) for de corrida ou duplicidade              |
| Testes end-to-end          | Fluxo de aceite do incremento                                      |
| Documentação               | Rastreabilidade e decisões atualizadas                             |
| Migration                  | Aplicável e com estratégia de rollback ou alternativa segura       |
| Rollback                   | Caminho de reversão ou mitigação documentado                       |
| Observabilidade            | Falhas detectáveis sem exposição indevida                          |
| Revisão técnica            | Review do incremento                                               |
| Aceite empresarial         | Critério de aceite executado ou dispensa registrada com autoridade |

## Prompt 00

Done desta etapa = quality gates de [`quality-gates.md`](quality-gates.md) seção Prompt 00, registro de execução atualizado, **sem** código funcional.

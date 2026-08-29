# AGENTS.md — Instruções obrigatórias para agentes

Este arquivo é vinculante para qualquer agente (humano ou automatizado) que altere este repositório.

## Leitura obrigatória antes de qualquer alteração

1. Ler este arquivo (`AGENTS.md`).
2. Ler `README.md` na raiz do repositório.
3. Ler `docs/README.md`.
4. Consultar o registro de execução em `docs/00-governance/prompt-execution-log.md`.
5. Consultar o roadmap em `docs/00-governance/prompt-roadmap.md` e o protocolo em `docs/00-governance/execution-protocol.md`.
6. Consultar os registros aplicáveis em `docs/01-foundation/` e a política em `docs/00-governance/traceability-policy.md`.

Não executar trabalho sem essa leitura.

## Escopo de execução

7. Executar somente o prompt atual, identificado no registro de execução e na solicitação do usuário.
8. Não antecipar etapas, prompts, arquitetura, stack, código funcional, banco, autenticação ou modelagem definitiva.
9. Não executar o próximo prompt automaticamente, mesmo que o atual tenha `PASS`.

## Preservação e histórico

10. Preservar alterações anteriores. Não apagar, reescrever silenciosamente ou “limpar” conteúdo histórico.
11. Nunca apagar regras históricas. Regras rejeitadas, substituídas ou depreciadas permanecem no registro com status e data.
12. Nunca transformar decisão pendente em decisão tomada sem fonte registrada, evidência e registro explícito no arquivo correspondente.
13. Não alterar regra empresarial por preferência técnica. Conflito entre técnica e negócio deve ser registrado, não resolvido por conveniência.

## Rastreabilidade e classificação

14. Manter rastreabilidade conforme `docs/00-governance/traceability-policy.md`.
15. Diferenciar, em todo texto produzido:

| Classificação | Significado |
| --- | --- |
| Fato empresarial | Informação atribuída a fonte identificada |
| Requisito confirmado | Requisito com fonte, evidência e status `CONFIRMED` |
| Desejo | Intenção não validada como requisito |
| Hipótese | Suposição explícita, não comprovada |
| Interpretação de engenharia | Leitura técnica de um fato ou requisito |
| Decisão pendente | Item em `PENDING` / `OPEN` sem resposta autorizada |
| Conflito de fonte | Divergência entre fontes, registrada em `source-conflicts.md` |

16. Não afirmar que uma regra está confirmada sem fonte. Ausência de fonte implica `CANDIDATE` ou `PENDING_VALIDATION`.

## Engenharia e segurança (quando a implementação for autorizada)

17. Proteger regras críticas no backend. Frontend não é boundary de segurança.
18. Não considerar interface, cliente ou formulário como controle suficiente de autorização, integridade ou regra de negócio.
19. Interromper a implementação quando existir bloqueio crítico (`NOT_READY_FOR_IMPLEMENTATION`, conflito de fonte não resolvido, decisão bloqueante aberta, quality gate `FAIL`).

## Qualidade, commits e honestidade

20. Validar os quality gates do prompt atual antes de declarar resultado.
21. Trabalhar com commits pequenos, quando o Git e a identidade estiverem disponíveis, conforme `docs/00-governance/change-governance.md`.
22. Não ocultar falhas, testes quebrados, decisões pendentes, restrições ou quality gates incompletos.
23. Nunca usar o termo “pronto” sem evidência no registro de execução, nos testes aplicáveis e nos critérios de aceite.
24. Não inventar dados empresariais, identificadores de fonte, regras fiscais, estados de OS, permissões, SLA, RPO, RTO, volumes ou cardinalidades.

## Proibições permanentes de antecipação

Enquanto a fase for `FOUNDATION` e o código funcional estiver `NOT STARTED`:

- não criar `package.json`, backend, frontend, banco, ORM, Docker, autenticação, endpoints, telas, CRUDs ou mocks empresariais;
- não escolher stack ou arquitetura definitiva;
- não marcar regra empresarial como `CONFIRMED` sem fonte.

## Parada obrigatória

Ao concluir o prompt atual: atualizar rastreabilidade, atualizar o registro de execução, apresentar o relatório no formato exigido e parar. Não iniciar o prompt seguinte.

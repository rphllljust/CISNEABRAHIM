# Execution protocol

| Campo       | Valor                              |
| ----------- | ---------------------------------- |
| Document ID | PROTO-001                          |
| Applies to  | Todos os prompts deste repositório |
| Source      | SRC-000                            |

## Sequência obrigatória de cada prompt

Cada prompt futuro **deve** seguir, nesta ordem:

1. **Inspeção** — caminho do workspace, arquivos existentes, Git, ocultos, conflitos. Não apagar preexistentes.
2. **Leitura da documentação aplicável** — `AGENTS.md`, `README.md`, `docs/README.md`, registro de execução, registros da fundação afetados, política de rastreabilidade.
3. **Confirmação de pré-condições** — prompt anterior em estado que permita avanço; fontes necessárias presentes ou ausência explícita; nenhum bloqueio crítico sem tratamento.
4. **Planejamento da etapa** — lista do que será criado ou alterado; lista do que está fora de escopo; riscos da etapa.
5. **Execução restrita ao escopo** — somente o prompt atual. Sem antecipação.
6. **Validação** — quality gates do prompt; arquivos obrigatórios; ausência de invenções; links e identificadores.
7. **Atualização da rastreabilidade** — matriz e referências SOURCE → … sem preencher com dados fictícios.
8. **Atualização do registro de execução** — usar [`../templates/prompt-completion-template.md`](../templates/prompt-completion-template.md) e anexar em [`prompt-execution-log.md`](prompt-execution-log.md).
9. **Relatório final** — formato exigido pelo prompt, se houver; senão o template de conclusão.
10. **Commit pequeno quando possível** — ver [`change-governance.md`](change-governance.md). Um assunto por commit, se a identidade Git existir.
11. **Parada obrigatória** — não encadear trabalho extra “já que estamos aqui”.
12. **Nenhuma execução automática do prompt seguinte.**

## Estados possíveis de um prompt

```text
NOT_STARTED
IN_PROGRESS
PASS
PASS_WITH_RESTRICTIONS
FAIL
BLOCKED
SUPERSEDED
```

| Estado                   | Significado                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `NOT_STARTED`            | Prompt no roadmap, não iniciado                                                                                    |
| `IN_PROGRESS`            | Execução em andamento                                                                                              |
| `PASS`                   | Gates obrigatórios atendidos; restrições residuais inexistentes ou apenas observações não bloqueantes documentadas |
| `PASS_WITH_RESTRICTIONS` | Entrega da etapa aceitável com débitos explícitos que não autorizam implementação indevida                         |
| `FAIL`                   | Requisito obrigatório da etapa não atendido                                                                        |
| `BLOCKED`                | Impossível concluir por dependência externa, fonte ausente crítica ou decisão bloqueante                           |
| `SUPERSEDED`             | Registro histórico substituído por execução posterior do mesmo prompt; o registro antigo permanece                 |

## Regras de transição

- `NOT_STARTED` → `IN_PROGRESS` somente com ordem explícita de executar aquele prompt.
- `IN_PROGRESS` → `PASS` somente após quality gates.
- `FAIL` exige correção no escopo do mesmo prompt e nova validação, ou registro de débito se a correção for impossível.
- `BLOCKED` não é convertido em `PASS` por omissão.
- Avanço ao próximo prompt: apenas com `PASS` ou `PASS_WITH_RESTRICTIONS` **e** revisão, **e** nova ordem explícita.

## Pré-condição de implementação de software

Nenhum prompt de código funcional deve iniciar se o item correspondente estiver `NOT_READY_FOR_IMPLEMENTATION` em [`definition-of-ready.md`](definition-of-ready.md).

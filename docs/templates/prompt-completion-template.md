# Template — conclusão de prompt

Preencher com dados **reais** do ambiente. Não inventar horário.

```text
PROMPT: NN
TITLE: <título>
STARTED_AT: <ISO-8601 com fuso>
FINISHED_AT: <ISO-8601 com fuso>
STATUS: NOT_STARTED | IN_PROGRESS | PASS | PASS_WITH_RESTRICTIONS | FAIL | BLOCKED | SUPERSEDED
FILES_CREATED: <lista>
FILES_CHANGED: <lista>
QUALITY_GATE: PASS | FAIL
FUNCTIONAL_CODE_CREATED: YES | NO
NEXT_PROMPT_EXECUTED: YES | NO
NOTES: <observações reais, restrições, débitos>
```

## Campos obrigatórios

Todos os acima. STATUS deve coincidir com os gates.

## Status permitidos

Ver [`../00-governance/execution-protocol.md`](../00-governance/execution-protocol.md).

## Como citar fontes

Notas devem apontar SRC, BR, DDP, RISK afetados.

## Como registrar incerteza

Se um gate não puder ser verificado: `FAIL` ou `BLOCKED`, não `PASS`.

## Como preservar histórico

Append no `prompt-execution-log.md`. Não apagar execuções anteriores. Reexecução: novo bloco; anterior pode ir a `SUPERSEDED` se a política do prompt permitir.

## Quando bloqueia implementação / avanço

`FAIL` ou `BLOCKED` → não iniciar o próximo prompt. `PASS_WITH_RESTRICTIONS` → avanço só com revisão e restrições visíveis.
